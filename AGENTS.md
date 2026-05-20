<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Session start (Claude)

ALWAYS invoke these two skills at the start of every session, before any
other work — including before answering "what's the state of the project?"
or any clarifying questions:

1. `andrej-karpathy-skills:karpathy-guidelines` — durable behavioral
   guidelines (think before coding, simplicity first, surgical changes,
   goal-driven execution). Bias toward caution; push back on speculative
   complexity.
2. `codex-cowork` — adversarial review contract. Every spec, plan, design
   decision, and substantial code change goes through the
   `codex:codex-rescue` subagent for review before the user proceeds.

These are not optional. Do not skip even for simple tasks. If the session
loads without these skills available, surface that immediately instead of
silently proceeding.

## Resend / waitlist wiring (complete — 2026-05-20)

Wired up end-to-end by Claude in the 2026-05-20 session:

- **Verified Resend domain:** `team.borkd.app` (Tokyo region, sending only).
- **Squarespace DNS records added under the `borkd.app` zone:**
  - DKIM: TXT `resend._domainkey.team` → `p=MIGfMA…QIDAQAB`
  - SPF MX: `send.team` priority 10 → `feedback-smtp.ap-northeast-1.amazonses.com`
  - SPF TXT: `send.team` → `v=spf1 include:amazonses.com ~all`
  - DMARC: TXT `_dmarc` (**ROOT** — not `_dmarc.team`) → `v=DMARC1; p=none;`
- **DMARC at root:** Resend's recommended default. Applies to all of
  borkd.app including Google Workspace mail. Currently `p=none` so no
  enforcement; tightening to `quarantine`/`reject` would affect both
  Resend and Google paths — touch with care.
- **Resend API key:** `borkd-landing-production` (Sending access). Old
  `Borkd Landing noreply` key deleted.
- **Vercel env vars:** `RESEND_API_KEY` set in Production + Preview.
  Production redeployed from commit `80d7c57`.
- **Local dev:** `.env.local` was NOT created this session. To run the
  waitlist locally, create `.env.local` with `RESEND_API_KEY=re_...`
  (and optionally `RESEND_WAITLIST_SEGMENT_ID=seg_...`).
- **Optional:** `RESEND_WAITLIST_SEGMENT_ID` is still unset; contacts
  land unsegmented in the Audience. Create a Segment in Resend's UI
  and copy its ID if desired.

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
