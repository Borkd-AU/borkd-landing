# Checkpoint — 2026-05-20 (late)
_Mode: full | Skill version: 1.0_

## Done this session

- **Cursor-dog feature shipped to `main`** via PR #1 (merge commit
  `6c629c5`, two-parent merge — `5bf714a` and `38b26c5`). The PR
  branch (`hobobranch`) carried 26 commits between `5bf714a..38b26c5`.
  Closes the "shout-lines SVG asset" blocker the prior session's
  checkpoint left open + everything that flowed from it.
  - Asset: `public/images/illustration/vector6-shout.svg` (4 stroke
    lines, brand-violet, focal centroid `29.7 7.4`) — commit `630efdb`.
  - Spec round-6 (svgOrigin pin, shoutRef-as-sibling) + round-7
    (bobRef separation) amendments — `630efdb`, `8c9c209`.
  - Implementation plan
    (`docs/superpowers/plans/2026-05-20-cursor-dog.md`, 1633 lines,
    11 tasks) — `8c9c209`.
  - **17 implementation/fix/polish commits `234ea1b → 38b26c5`**:
    - 10 core-impl commits `234ea1b → 83d8382`: constants/types,
      `useReactiveMode`, `useCursorTracker`, pure `stateMachine.ts` +
      unit test, `useDogStateMachine.ts` runtime layer, mobile +
      desktop SVGs, controller `index.tsx`, `CursorDogMount.tsx`
      client wrapper, `app/layout.tsx` + `app/globals.css` wiring.
    - 2 mid-impl fixes from review: `dc9df7c` (entry-trot
      `gsap.context()` registration), `45a1850` (lint).
    - 2 smoke-test fixes: `e9ed6bb` (leash slack physics —
      `SLACK_VELOCITY_GAIN_K` 0.01 → 0.00005 + `MAX_SLACK=1.5`
      clamp), `dc439a4` (explicitly kill bark/sniff timeline refs
      before `ctx.revert()` — sniff `repeat: -1` was leaking
      detached SVG nodes, caught by codex final-pass review).
    - 3 user-driven polish commits: `d8e78a5` (brand violet stroke
      `var(--content-accent, #3A39FF)`, 2× size `scale(1.2)`,
      `WANDER_RADIUS=80` ambient offset), `3837053` (bark cadence
      8–20s vs prior 20–40s, `BARK_SHOUT_PEAK_SCALE=1.8`, dropped
      park opacity fade), `38b26c5` (direction flip with 12px
      hysteresis dead zone, click-to-bark suppressed in
      `PAUSED_INPUT`, bark-freeze, dev-mode console hello).

- **Codex review cycles on the feature** (all clean now):
  - Asset codex review (1) — geometry passes; spec defects surfaced
    became round-6.
  - Plan codex reviews (3) — round-1 BLOCK on aborted-controller;
    round-2 REVISE on baseline-snap + module loading; round-3
    SHIP-WITH-FIXES, fixes applied inline.
  - Final code-stage codex review — BLOCK on state-machine timeline
    leak (fixed in `dc439a4`).
  - Ship-gate codex review on the user-driven polish — verdict SHIP,
    no changes required.
  - Checkpoint review (this file) — round-1 REVISE on 6 factual
    errors, all corrected before write.

## Received via main merge (not this session's work)

`main` advanced while `hobobranch` was open. The following mobile
Steps polish commits are on `main` post-merge but are NOT cursor-dog
work — they were authored elsewhere and arrived via the merge
parent-1 (`5bf714a`) chain:

- `5bf714a fix(landing): delay mobile Steps pin so the card slider is visible`
- `8698970 fix(landing): mobile Steps — lead with the hero image, headline below`
- `17e4b13 fix(landing): mobile Steps composite — match QuoteSection card size`
- `3cec7e0 fix(landing): contain Steps GSAP track + show hero composite on mobile`

Worth knowing because if mobile Steps behavior surprises a future
session, the commits are real but not part of this session's intent.

## In progress

- _Nothing in progress._ Working tree shows only the two pre-existing
  prior-session diffs (`AGENTS.md` 63 changed lines = 42 ins + 21 del;
  `CHECKPOINT.md` overwritten by this file). Both will be committed
  immediately after this checkpoint is written.

## Next

1. **Production deploy to live URL.** PR merged to `main` at
   `6c629c5`; Vercel will auto-deploy on the next prod workflow
   trigger. Verify on `https://www.borkd.app`:
   - Production deployment is for commit `6c629c5` or newer
     (check the Vercel dashboard's production deployment hash).
   - **Desktop** (pointer:fine, reduce-motion off): violet
     line-art cursor dog appears ~50ms after mount; ambles around
     the cursor (not overlapping); leash visibly tracks the dog;
     direction flips when cursor crosses dog horizontally;
     click anywhere fires a bark; bark freezes the wander
     mid-stride; dog trots offscreen on cursor-leave at full
     opacity (no fade); returns at full opacity.
   - **Mobile** (DevTools device mode or actual phone): static
     dog in bottom-right corner (24px inset); no leash; bark
     fires every 8–20s.
   - **Reduce-motion ON** (System Prefs → Accessibility): dog
     vanishes within 1s; `window.__borkdDog === undefined`; no
     console warnings.
   - **Print preview** (Cmd+P): cursor dog hidden (`@media print`
     rule in `app/globals.css`).
   - **DevTools console**: no `console.error`; in dev mode the
     hello message `🐕 borkd — try window.__borkdDog.triggerBark()`
     appears (suppressed in prod build).

## Blockers / open questions

- _None._ Codex's ship-gate verdict was clean.

## Abandoned / dead ends

- **`SLACK_VELOCITY_GAIN_K = 0.01` (the plan-draft default).** Spec
  flagged this as in-impl tuning; smoke-test confirmed it produced
  leash control-point Y values of ~3600px (off-screen) on cursor
  teleport. Settled at `0.00005`. Don't raise without re-running the
  teleport test (claude-in-chrome's hover action is one trigger).
- **Park fade to opacity 0.4.** Originally spec'd; manifested only
  as "dog comes back lighter" on cursor return (dog is offscreen
  during PARKED anyway, so the fade itself was never visible).
  Removed in `3837053`. Don't re-add unless you also restore
  opacity on `PARKED → IDLE` transition (add a `gsap.set(dogRef,
  {opacity: 1})` side effect on that edge).
- **Per-task two-stage codex reviews for the mechanical
  SVG/scaffold tasks (1, 2, 6, 7, 9, 10).** Batched into combined
  spec-compliance+code-quality reviews instead of the strict
  two-stage pattern the subagent-driven-development skill
  prescribes. Defensible for mechanical copy-paste tasks, but
  worth flagging that this session deviated from the skill's
  prescribed flow.

## Decisions

- **Merge strategy: regular merge commit, not squash.** Verified:
  `6c629c5` has two parents (`5bf714a`, `38b26c5`). Preserves the
  26-commit history (each with its codex-review trail in the commit
  message). Trade-off: noisier main log but auditability for next
  time we revisit this feature.
- **`gh` active account: switched from `Anocs1` to `hobopark`
  mid-session.** Required for `Borkd-AU/borkd-landing` PR creation
  (Anocs1 lacks collaborator access; got "must be a collaborator"
  error). Switch is sticky across the host's gh sessions until
  manually reverted with `gh auth switch -u Anocs1`.
- **Code-stage codex review is non-redundant with plan-stage codex
  review.** The plan went through 3 codex rounds and was approved
  SHIP-WITH-FIXES, but the final code-stage review still caught a
  CRITICAL leak (state-machine timeline refs not in `ctx`). For
  any future feature with similar GSAP-context complexity, plan
  on a final code-stage codex pass regardless of plan-stage
  outcome.

## Runtime state

- **Branch:** `main` (synced with `origin/main`; 0 ahead, 0 behind).
- **`hobobranch`:** deleted on remote (`gh pr merge --delete-branch`)
  AND local (cleaned up after merge).
- **Dev server:** none running (smoke-tested + killed).
- **Migrations:** none touched (no schema changes this session).
- **Env vars:** none added/changed this session. Resend
  (`RESEND_API_KEY`) was set in the prior session. Supabase
  (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) came in via merge
  of `origin/main` (commit `80d7c57` "feat(waitlist): Supabase is
  source of truth") early in this session.
- **Git remote:** `git@github.com:Borkd-AU/borkd-landing.git` (SSH;
  authenticates as `hobopark`).
- **`gh` active account:** `hobopark` (was `Anocs1` at session
  start). Verify with `gh auth status` before any Borkd-AU
  operation in a future session.

## Mental model notes

- **gh CLI two-account trap.** This machine has both `Anocs1`
  (personal) and `hobopark` logged in via the gh keyring. At
  session start `Anocs1` was active. ANY `gh pr create` /
  `gh pr merge` / `gh api repos/Borkd-AU/*` against the Borkd
  org will fail with "must be a collaborator" until you switch.
  The switch is sticky across sessions. For a future session,
  first `gh auth status`; if active is `Anocs1`, run
  `gh auth switch -u hobopark` before any Borkd ops; restore
  with `gh auth switch -u Anocs1` after.
- **Plan-stage codex review is not a substitute for code-stage
  review.** The spec went through 11 codex invocations across 7
  rounds; the plan through 3 codex rounds; both delivered
  "READY TO SHIP" verdicts. The final code-stage review still
  caught the state-machine timeline leak (sniff `repeat: -1`
  running on detached DOM after `ctx.revert()`) — a defect
  neither the spec nor the plan made detectable on paper. For
  GSAP-heavy features in particular, always fire one codex pass
  on the implemented code before merge.
- **"In-impl tuning" constants in specs are real risks, not just
  hand-waves.** The spec marked `SLACK_VELOCITY_GAIN_K = 0.01` as
  "tune visually". That phrase smuggled in a 200×-too-high value
  that broke on cursor teleport in the first smoke test. Treat
  any "tune visually" constant in a spec as a follow-up TODO
  bearing real risk, not as a defensible default.

---

## Resume prompt

Paste into a fresh Claude Code session:

> Please read AGENTS.md FIRST and invoke the two session-start skills
> listed there (`andrej-karpathy-skills:karpathy-guidelines` and
> `codex-cowork`) BEFORE anything else. Then read CHECKPOINT.md and
> any other relevant `.md` files to get up to speed. Give me a brief
> summary of where we left off and what's next. Specifically, pick
> up from: **Production deploy to live URL. PR #1 merged to `main`
> at `6c629c5`; Vercel will auto-deploy on the next prod workflow
> trigger. Verify on `https://www.borkd.app` that the production
> deployment hash is `6c629c5` or newer and that the cursor dog
> renders correctly per the checklist in CHECKPOINT.md's "Next"
> section (desktop wander/leash/flip/click-bark/freeze/no-fade;
> mobile static corner; reduce-motion teardown; print hides;
> clean console).**
