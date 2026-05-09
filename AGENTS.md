<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Pending: Resend / waitlist wiring (assigned: Ryan)

The waitlist signup endpoint at `app/api/waitlist/route.ts` is built and
tested but env-gated. Until `RESEND_API_KEY` is set, the route returns 503
with friendly copy and no contact is created.

To wire it up:

1. Get a Resend API key at https://resend.com/api-keys.
2. (Optional) Create a Resend Segment for the waitlist and grab its ID —
   without one, contacts are added unsegmented.
3. Drop both into `.env.local` (gitignored):
   ```
   RESEND_API_KEY=re_...
   RESEND_WAITLIST_SEGMENT_ID=seg_...   # optional
   ```
4. For Vercel deployments, set the same keys in Project Settings →
   Environment Variables (Production + Preview).
5. Smoke test by submitting an email through the homepage form. The
   upstream Resend response is logged on errors and returned as
   `{ ok: true }` on success.

Notes:

- The integration targets Resend's modern Contacts API (`POST /contacts`),
  not the deprecated `/audiences/{id}/contacts` path. Don't switch back.
- The honeypot field name is `borkd_check` and must match between
  `components/landing/WaitlistSection.tsx` and `app/api/waitlist/route.ts`.
  Don't rename without updating both — and read the file headers before
  changing it; the name is deliberately non-semantic to defend against
  password-manager autofill false-positives.
- The in-memory IP/email rate limiter is per-Function-instance under
  serverless (cold starts reset, concurrent instances each have their own
  map). Catches obvious bursts; production-grade upgrade is
  `@upstash/ratelimit` + Vercel KV. Code header marks the spot.
