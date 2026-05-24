import { NextResponse } from "next/server";
import { getSupabaseAdmin, supabaseConfigured } from "@/lib/supabase";

/**
 * Waitlist signup. Supabase is the SOURCE OF TRUTH; Resend is a
 * best-effort mirror.
 *
 *   1. Insert into public.waitlist_signups (REQUIRED). A unique-email
 *      conflict means the address is already on the list. Any other DB
 *      failure rejects the signup (502) — we never report success when
 *      the source of truth wasn't written.
 *   2. POST to Resend's modern Contacts endpoint (BEST-EFFORT). A
 *      Resend failure is logged but the signup still succeeds, because
 *      the row is already safely in Supabase. Launch broadcasts go out
 *      via Resend later; missing/broken Resend just means a contact to
 *      backfill, not a lost signup.
 *
 * Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional env: RESEND_API_KEY (no key → skip the mirror, signup still
 *   recorded), RESEND_WAITLIST_SEGMENT_ID (tag contacts into a segment).
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

  // ── 1. Source of truth: Supabase insert (REQUIRED) ────────────────
  if (!supabaseConfigured) {
    console.warn(
      "[waitlist] Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — cannot record signup."
    );
    return jsonError(503, "Waitlist isn't configured yet. Try again soon.");
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512) ?? null;

  let alreadyOnList = false;
  try {
    const { error } = await getSupabaseAdmin()
      .from("waitlist_signups")
      .insert({ email, source: "landing", user_agent: userAgent });

    if (error) {
      // 23505 = unique_violation → the email is already on the list.
      // Treat as success (idempotent signup), don't surface an error.
      if (error.code === "23505") {
        alreadyOnList = true;
      } else {
        console.error(
          "[waitlist] Supabase insert failed",
          error.code,
          error.message
        );
        return jsonError(
          502,
          "Waitlist service is having a moment. Try again."
        );
      }
    }
  } catch (err) {
    console.error("[waitlist] Supabase insert threw", err);
    return jsonError(502, "Couldn't reach the waitlist service. Try again.");
  }

  // ── 2. Best-effort mirror into Resend Contacts ────────────────────
  // The signup is already safely recorded above; a Resend failure must
  // NOT fail the request. Skip entirely on a duplicate (the contact
  // already exists) or when no API key is configured.
  if (!alreadyOnList) {
    await mirrorToResend(email).catch((err) => {
      console.error("[waitlist] Resend mirror failed (signup still ok)", err);
    });
  }

  return NextResponse.json<SuccessBody>(
    alreadyOnList ? { ok: true, alreadyOnList: true } : { ok: true }
  );
}

/**
 * Push the email into the Resend audience scoped to RESEND_AUDIENCE_ID.
 * Best-effort: never throws to the caller in a way that should fail the
 * signup — the caller already persisted the source-of-truth row. Errors
 * are logged here; the caller's .catch is a final safety net.
 *
 * Endpoint distinction: `POST /contacts` creates an org-level contact
 * that is NOT visible in any audience (so broadcasts can't target it).
 * `POST /audiences/{id}/contacts` is the only path that adds a contact
 * to the audience the launch broadcast will use.
 */
async function mirrorToResend(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      "[waitlist] RESEND_API_KEY not set — skipping Resend mirror (signup recorded in Supabase)."
    );
    return;
  }

  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) {
    console.warn(
      "[waitlist] RESEND_AUDIENCE_ID not set — skipping Resend mirror (signup recorded in Supabase). Set this to the audience that launch broadcasts will target."
    );
    return;
  }

  const segmentId = process.env.RESEND_WAITLIST_SEGMENT_ID;
  // Resend's modern Contacts API expects segments as `[{ id }]` objects.
  const upstreamBody: Record<string, unknown> = { email };
  if (segmentId) upstreamBody.segments = [{ id: segmentId }];

  // Bound upstream latency so a slow Resend call can't dominate the
  // function or leave the user staring at a spinner.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 10_000);

  try {
    const resendResponse = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(upstreamBody),
        signal: abort.signal,
      }
    );

    if (resendResponse.ok) return;

    // Duplicate-in-Resend is fine — Supabase already owns the truth.
    let upstreamSignal = "";
    try {
      const upstream = await resendResponse.json();
      if (upstream && typeof upstream === "object") {
        const u = upstream as Record<string, unknown>;
        upstreamSignal = [
          u.message,
          u.name,
          u.error,
          typeof u.error === "object" && u.error
            ? (u.error as Record<string, unknown>).message
            : undefined,
        ]
          .filter((v): v is string => typeof v === "string")
          .join(" ");
      }
    } catch {
      // Non-JSON body — log the status only.
    }

    const lower = upstreamSignal.toLowerCase();
    const isDuplicate =
      lower.includes("already") ||
      lower.includes("exists") ||
      lower.includes("duplicate");
    if (isDuplicate) return;

    console.error(
      "[waitlist] Resend mirror rejected (signup still recorded)",
      resendResponse.status,
      upstreamSignal
    );
  } finally {
    clearTimeout(timer);
  }
}
