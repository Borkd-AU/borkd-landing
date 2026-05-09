"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 254;

// Honeypot — must match HONEYPOT_FIELD in app/api/waitlist/route.ts. Bots
// fill any unknown form input; real users never see this one. Name is
// deliberately non-semantic so password managers / browser autofill don't
// classify it as a website / username / address field.
const HONEYPOT_FIELD = "borkd_check";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; alreadyOnList?: boolean };

/**
 * Section 4 — Waitlist email capture. Sits between StepsSection and
 * SiteFooter. The wrapping <section id="waitlist"> is the anchor target
 * for the hero "get on the waitlist" caption and the About-page CTA.
 *
 * The form submits to /api/waitlist, which forwards to Resend. See
 * app/api/waitlist/route.ts for backend behaviour.
 */
export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // Synchronous lock — guards against double-submit before React's state
  // update lands. setState alone leaves a window where two clicks fire
  // two requests.
  const inFlight = useRef(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // Belt-and-braces: clear any value an aggressive autofill engine wrote
  // into the honeypot before the user could submit. Defends against the
  // false-positive where 1Password / iCloud / browser autofill silently
  // populates the field and our server treats the user as a bot.
  useEffect(() => {
    if (honeypotRef.current) honeypotRef.current.value = "";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;

    const trimmed = email.trim();
    if (!trimmed || trimmed.length > MAX_EMAIL_LEN || !EMAIL_RE.test(trimmed)) {
      setStatus({
        kind: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    inFlight.current = true;
    setStatus({ kind: "submitting" });

    const honeypotValue = honeypotRef.current?.value ?? "";

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          [HONEYPOT_FIELD]: honeypotValue,
        }),
      });

      let body: { ok?: boolean; alreadyOnList?: boolean; error?: string } = {};
      try {
        body = await response.json();
      } catch {
        // Non-JSON response — fall through to generic handling.
      }

      if (response.ok && body.ok) {
        setStatus({ kind: "success", alreadyOnList: body.alreadyOnList });
      } else {
        setStatus({
          kind: "error",
          message:
            body.error ?? "Something went wrong. Try again in a moment.",
        });
      }
    } catch {
      setStatus({
        kind: "error",
        message:
          "Couldn't reach the waitlist service. Check your connection and try again.",
      });
    } finally {
      inFlight.current = false;
    }
  }

  const isSubmitting = status.kind === "submitting";
  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <section
      id="waitlist"
      className="w-full scroll-mt-32 bg-background-brand px-6 py-16 sm:px-12 md:py-20 lg:px-[235px] lg:py-[80px]"
    >
      <div className="mx-auto flex max-w-[640px] flex-col items-center gap-6 text-center">
        <h2
          className="leading-tight tracking-tight text-content-brand text-[clamp(28px,5vw,44px)]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Sydney first. Then{" "}
          <em className="font-display italic">everywhere worth ending up</em>.
        </h2>
        <p
          className="leading-normal tracking-tight text-content-primary text-[clamp(16px,2.4vw,20px)]"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          Drop your email and you&rsquo;ll be one of the first pup parents on
          Borkd. We&rsquo;ll let you know when there&rsquo;s a real spot to
          walk into.
        </p>

        {status.kind === "success" ? (
          <div
            role="status"
            aria-live="polite"
            className="mt-2 w-full rounded-md border border-border-muted bg-background-primary px-6 py-5 text-content-primary"
          >
            <p className="text-base sm:text-lg">
              {status.alreadyOnList
                ? "You're already on the list — we'll be in touch when there's something worth opening."
                : "You're in. We'll be in touch when there's something worth opening."}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="mt-2 flex w-full flex-col gap-3 sm:flex-row"
            aria-describedby={errorMessage ? "waitlist-error" : undefined}
          >
            {/* Honeypot — kept reachable in the DOM tree (not display:none)
                so naive form-walkers fill it, but visually hidden and
                removed from the a11y tree so real users + AT skip it.
                Server checks the field name HONEYPOT_FIELD. */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-10000px",
                top: "auto",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            >
              <label htmlFor={`waitlist-${HONEYPOT_FIELD}`}>
                Leave this field empty
              </label>
              <input
                ref={honeypotRef}
                id={`waitlist-${HONEYPOT_FIELD}`}
                name={HONEYPOT_FIELD}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                // Hints picked up by the major password managers so they
                // skip this field; reduces false-positive autofill risk.
                data-1p-ignore="true"
                data-bwignore="true"
                data-lpignore="true"
                data-form-type="other"
                defaultValue=""
              />
            </div>

            <label htmlFor="waitlist-email" className="sr-only">
              Email address
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              required
              maxLength={MAX_EMAIL_LEN}
              autoComplete="email"
              inputMode="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              aria-invalid={errorMessage ? true : undefined}
              className="flex-1 rounded-md border border-border-muted bg-background-primary px-4 py-3 text-base text-content-primary placeholder:text-content-tertiary focus:border-border-accent focus:outline-none focus:ring-2 focus:ring-border-accent/40 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-background-accent px-5 py-3 text-content-contrast shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <em className="font-display text-[18px] italic tracking-tight sm:text-[20px]">
                {isSubmitting ? "Joining…" : "Join the waitlist"}
              </em>
            </button>
          </form>
        )}

        {errorMessage && (
          <p
            id="waitlist-error"
            role="alert"
            className="text-sm text-content-negative"
          >
            {errorMessage}
          </p>
        )}

        {status.kind !== "success" && (
          <div className="space-y-1 text-sm text-content-secondary">
            <p>No spam, no ads, no tracking. Promise.</p>
            <p>
              By joining you agree to our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-content-primary"
              >
                privacy policy
              </Link>{" "}
              and{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-content-primary"
              >
                terms
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
