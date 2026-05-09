import { NextResponse } from "next/server";

/**
 * Waitlist signup. POSTs to Resend's modern Contacts endpoint
 * (https://resend.com/docs/api-reference/contacts/create-contact). The
 * legacy /audiences/{id}/contacts path is being phased out in favour of
 * the unscoped /contacts path with an optional segment.
 *
 * Required env: RESEND_API_KEY
 * Optional env: RESEND_WAITLIST_SEGMENT_ID — if set, contacts are tagged
 *   into this segment so launch broadcasts can target the waitlist.
 *
 * If RESEND_API_KEY is missing the route returns 503 — preferable to a
 * silent local-dev success that loses signups.
 *
 * Abuse defenses (layered):
 *   1. Honeypot field — bots fill any unknown form input; humans don't see
 *      the hidden one. Filled → silently 200 so bots can't iterate around.
 *   2. Per-IP rate limit — best-effort in-memory bucket. Caveat: under
 *      serverless this is per-instance only; cold starts reset and
 *      concurrent instances each have their own map. Catches obvious
 *      bursts; for production, swap for KV/Redis-backed limiting.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254; // RFC 5321 path limit
const MAX_BODY_BYTES = 1024;

// Deliberately non-semantic name so password managers / browser autofill
// heuristics don't classify and pre-fill it (which would falsely flag
// real users as bots). Must match HONEYPOT_FIELD in WaitlistSection.tsx.
const HONEYPOT_FIELD = "borkd_check";

const IP_LIMIT_MAX = 8;
const IP_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const EMAIL_LIMIT_MAX = 2;
const EMAIL_LIMIT_WINDOW_MS = 10 * 60 * 1000;
// Cap each map so a flood from many distinct keys can't OOM the function.
const RATE_LIMIT_MAX_KEYS = 5_000;

const ipBuckets: Map<string, number[]> = new Map();
const emailBuckets: Map<string, number[]> = new Map();

type LimitOutcome = { allowed: boolean; retryAfterSec: number };

function checkBucket(
  store: Map<string, number[]>,
  key: string,
  max: number,
  windowMs: number
): LimitOutcome {
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = store.get(key) ?? [];
  const fresh = existing.filter((t) => t > cutoff);

  // LRU bump: delete-then-set moves the key to the end of insertion order
  // so later eviction targets genuinely-stale keys, not active ones.
  store.delete(key);

  if (fresh.length >= max) {
    store.set(key, fresh);
    const retryAfterMs = fresh[0] + windowMs - now;
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  fresh.push(now);
  store.set(key, fresh);

  if (store.size > RATE_LIMIT_MAX_KEYS) {
    const firstKey = store.keys().next().value;
    if (firstKey !== undefined) store.delete(firstKey);
  }

  return { allowed: true, retryAfterSec: 0 };
}

function clientIp(request: Request): string | null {
  // Vercel sets x-vercel-forwarded-for under the hood; honour it first
  // since x-forwarded-for can be client-supplied on other deployments.
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const first = vercel.split(",")[0]?.trim();
    if (first) return first;
  }
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

function describeWait(retryAfterSec: number): string {
  const minutes = Math.ceil(retryAfterSec / 60);
  if (minutes <= 1) return "about a minute";
  return `about ${minutes} minutes`;
}

type SuccessBody = { ok: true; alreadyOnList?: boolean };
type ErrorBody = { ok: false; error: string };

function jsonError(status: number, error: string, headers?: HeadersInit) {
  return NextResponse.json<ErrorBody>(
    { ok: false, error },
    { status, headers }
  );
}

export async function POST(request: Request) {
  // Cheap header check first — most malformed bodies still set this.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return jsonError(413, "Request too large.");
  }

  // Per-IP rate limit fires BEFORE body parse so a flood of garbage
  // POSTs can't burn JSON parse cycles or validation work. If we can't
  // identify the client IP (dev / misconfigured proxy / non-Vercel
  // edge), skip the IP throttle and rely on the honeypot + email
  // bucket instead — refusing every "unknown" request would block
  // legitimate localhost dev and shared-NAT corner cases.
  const ip = clientIp(request);
  if (ip) {
    const ipOutcome = checkBucket(
      ipBuckets,
      ip,
      IP_LIMIT_MAX,
      IP_LIMIT_WINDOW_MS
    );
    if (!ipOutcome.allowed) {
      return jsonError(
        429,
        `You've tried that a few times. Try again in ${describeWait(
          ipOutcome.retryAfterSec
        )}.`,
        { "Retry-After": String(ipOutcome.retryAfterSec) }
      );
    }
  } else {
    console.warn("[waitlist] No client IP header — skipping IP rate limit.");
  }

  // Read the body as text first so we can enforce a real size limit.
  // Header-based content-length is advisory; chunked clients omit it.
  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  if (raw.length > MAX_BODY_BYTES) {
    return jsonError(413, "Request too large.");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return jsonError(400, "Invalid request body.");
  }

  // Honeypot: if any falsy-truthy mismatch — bot filled the field with
  // a string, number, object, etc. — silently 200 so the bot can't
  // iterate around the rejection.
  const honeypot =
    payload && typeof payload === "object" && HONEYPOT_FIELD in payload
      ? (payload as Record<string, unknown>)[HONEYPOT_FIELD]
      : undefined;
  if (honeypot !== undefined && honeypot !== null && honeypot !== "" && honeypot !== false) {
    return NextResponse.json<SuccessBody>({ ok: true });
  }

  const rawEmail =
    payload && typeof payload === "object" && "email" in payload
      ? (payload as { email: unknown }).email
      : undefined;

  if (typeof rawEmail !== "string") {
    return jsonError(400, "Email is required.");
  }

  const email = rawEmail.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
    return jsonError(400, "Please enter a valid email address.");
  }

  // Per-email throttle catches the rotating-IP attack: a bot with a
  // botnet of clean IPs can no longer hammer the same address into
  // Resend without hitting this bucket.
  const emailOutcome = checkBucket(
    emailBuckets,
    email,
    EMAIL_LIMIT_MAX,
    EMAIL_LIMIT_WINDOW_MS
  );
  if (!emailOutcome.allowed) {
    return jsonError(
      429,
      `That email's been submitted recently. Try again in ${describeWait(
        emailOutcome.retryAfterSec
      )}.`,
      { "Retry-After": String(emailOutcome.retryAfterSec) }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[waitlist] RESEND_API_KEY not configured — signup not delivered."
    );
    return jsonError(503, "Waitlist isn't configured yet. Try again soon.");
  }

  const segmentId = process.env.RESEND_WAITLIST_SEGMENT_ID;
  // Resend's modern Contacts API expects segments as `[{ id }]` objects,
  // not an array of bare ID strings.
  const upstreamBody: Record<string, unknown> = { email };
  if (segmentId) upstreamBody.segments = [{ id: segmentId }];

  // Bound upstream latency so a slow Resend call doesn't dominate
  // function execution time or leave the user staring at a spinner.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10_000);

  let resendResponse: Response;
  try {
    resendResponse = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
      signal: abort.signal,
    });
  } catch (err) {
    console.error("[waitlist] Resend fetch threw", err);
    return jsonError(502, "Couldn't reach the waitlist service. Try again.");
  } finally {
    clearTimeout(timer);
  }

  // 2xx → success. Resend's modern API returns 200 with `{ id, email, ... }`.
  if (resendResponse.ok) {
    return NextResponse.json<SuccessBody>({ ok: true });
  }

  // Resend doesn't publish a single status code for duplicates and the
  // payload shape isn't fully documented, so we scan a few plausible
  // fields for the signal. Strings on success-likely fields like `name`
  // ("contact_already_exists") are also a common error-type pattern.
  let upstreamSignal = "";
  try {
    const upstream = await resendResponse.json();
    if (upstream && typeof upstream === "object") {
      const u = upstream as Record<string, unknown>;
      const candidates: unknown[] = [
        u.message,
        u.name,
        u.error,
        typeof u.error === "object" && u.error
          ? (u.error as Record<string, unknown>).message
          : undefined,
      ];
      upstreamSignal = candidates
        .filter((v): v is string => typeof v === "string")
        .join(" ");
    }
  } catch {
    // Body wasn't JSON — fall through with empty upstreamSignal.
  }

  const lower = upstreamSignal.toLowerCase();
  const isDuplicate =
    resendResponse.status >= 400 &&
    resendResponse.status < 500 &&
    (lower.includes("already") ||
      lower.includes("exists") ||
      lower.includes("duplicate"));

  if (isDuplicate) {
    return NextResponse.json<SuccessBody>({ ok: true, alreadyOnList: true });
  }

  // Don't leak Resend's exact wording to users.
  console.error(
    "[waitlist] Resend rejected signup",
    resendResponse.status,
    upstreamSignal
  );

  // 401/403/5xx are operational/auth issues, not user input issues —
  // surface a service message instead of asking the user to recheck.
  if (
    resendResponse.status === 401 ||
    resendResponse.status === 403 ||
    resendResponse.status >= 500
  ) {
    return jsonError(502, "Waitlist service is having a moment. Try again.");
  }
  return jsonError(400, "We couldn't add that email. Double-check it?");
}
