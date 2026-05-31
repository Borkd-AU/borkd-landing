# Design Rules — borkd-landing

> **Single Source of Truth: `/design-system`**
> Visit `http://localhost:3000/design-system` (also at `app/design-system/page.tsx`)
> to see every token rendered live. If a color, spacing, radius, or font choice
> is not in the control center, **it does not exist on this site**.
>
> The control center is a 1:1 mirror of the Figma design system. Editing tokens
> in `styles/tokens/*.css` or the `@theme inline` block in `app/globals.css`
> updates the entire site in one place. That power is the entire point — do not
> bypass it by writing hex codes, rgba values, or off-scale spacing.

This document is the rule set. The control center is the catalog. Read both
before touching UI. Every page in `app/`, every component in
`components/landing/*`, and every animation in `lib/gsap.ts` must obey these
rules.

---

## 1. The hard rules (zero tolerance)

| # | Rule | Why |
|---|------|-----|
| 1 | **No hardcoded hex, rgba, or hsl in component code.** Always reference a token. | If a designer changes Zoomies/500 in Figma, the entire site should update on the next deploy. A stray `#3A39FF` makes that promise a lie. |
| 2 | **No off-scale spacing.** Use Tailwind's default scale (1 = 4px = XXXSmall, 2 = 8px = XXSmall, … 20 = 80px = XXXXLarge) or `[padding:var(--size-md)]` for the named token. | Mixing 6px and 7px is the universal tell of AI-generated UI. The Borkd grid is 4px-anchored. |
| 3 | **No third-party fonts.** DM Sans (`font-sans`) is the body face, Instrument Serif (`font-display`) is the italic accent. No `font-mono` outside code blocks. No imports from Google Fonts or NPM beyond what's already wired in `app/layout.tsx`. | Two typefaces, perfectly paired. Adding a third dilutes the brand instantly. |
| 4 | **No emojis as UI** — with ONE documented exception. Brand uses SVG illustrations and the Zoomies logo only; emojis read as low-effort. **Exception:** the cursor-hover morph (`CursorDog` `MORPHED` state) may render a single large emoji as the cursor while hovering a `data-emoji` element. This is a deliberate, playful cursor affordance — not chrome, not content, not a UI control. It is the only place an emoji is allowed. Do not use this as precedent for emoji anywhere else. | |
| 5 | **`prefers-reduced-motion: reduce` must be respected.** Every GSAP effect, every scroll-triggered reveal, every cursor-following element must have a no-motion fallback. | Accessibility law in many jurisdictions; design discipline everywhere else. See `useGsapReveal.ts` and `CursorDog/useReactiveMode.ts` for the pattern. |
| 6 | **No `width`/`height`/`top`/`left` animation.** Only `transform` and `opacity`. Anything else triggers layout/paint and stutters on mobile. | |
| 7 | **Cursor-following / hover-only interactions must be gated on `pointer: fine`.** Touch devices get a static fallback. | Hovering a hover is impossible on a phone. |
| 8 | **Max 1–2 key motions per view.** "Trendy" is not "everything moves." Pick the moment that earns the user's attention; leave the rest still. | |

If you find yourself wanting to break a rule "just this once," the answer is
no. Open `/design-system` instead and find a token that fits.

---

## 2. The catalog — what to reach for

### 2a. Color tokens

**Always prefer semantic tokens.** They are aliases that express *intent*, not
*hue*. The control center publishes 23 semantic colors:

#### `content/*` — text & icons
| Token | Tailwind class | Use |
|-------|----------------|-----|
| `content.primary` | `text-content-primary` | Default body text (Black/500) |
| `content.brand` | `text-content-brand` | Brand-colored headings (Bark/500) |
| `content.contrast` | `text-content-contrast` | Text on dark backgrounds (White/500) |
| `content.secondary` | `text-content-secondary` | De-emphasized text (Black/400) |
| `content.tertiary` | `text-content-tertiary` | Meta, captions, disabled (Black/300) |
| `content.accent` | `text-content-accent` | Links, accent text (Zoomies/500) |
| `content.positive` | `text-content-positive` | Success/verified |
| `content.negative` | `text-content-negative` | Errors/destructive |

#### `background/*` — surfaces
| Token | Tailwind class | Use |
|-------|----------------|-----|
| `background.primary` | `bg-background-primary` | Default white page (White/500) |
| `background.brand` | `bg-background-brand` | Cream section (Cloud/500 — the iconic Borkd surface) |
| `background.secondary` | `bg-background-secondary` | Subtle filled surface (Black/200 = light alpha) |
| `background.tertiary` | `bg-background-tertiary` | Hover fill (Black/100) |
| `background.overlay` | `bg-background-overlay` | Modal scrim |
| `background.contrast` | `bg-background-contrast` | Surface on dark imagery |
| `background.accent` | `bg-background-accent` | Primary CTA fill (Zoomies/500) |
| `background.accent-muted` | `bg-background-accent-muted` | Accent badge/chip (Zoomies/100) |
| `background.positive` / `.positive-muted` | `bg-background-positive(-muted)` | Success surface |
| `background.negative` / `.negative-muted` | `bg-background-negative(-muted)` | Error surface |

#### `border/*` — outlines & dividers
| Token | Tailwind class | Use |
|-------|----------------|-----|
| `border.primary` | `border-border-primary` | Strong outline (Black/500) |
| `border.muted` | `border-border-muted` | Subtle divider (Black/200) — **the divider you'll use 90% of the time** |
| `border.accent` | `border-border-accent` | Focus rings, brand outline (Zoomies/500) |

### 2b. Primitive scales (use only when no semantic token applies)

11 color families, 97 total tokens. Use directly only for explicit illustration
or chart accents — *never* for chrome that a semantic token already covers.

| Family | Hex/role | Tailwind |
|--------|----------|----------|
| Cloud | Cream off-white | `bg-cloud-50`–`950` |
| Bark | Warm brown (brand) | `text-bark-700` |
| Zoomies | Electric blue (accent) | `bg-zoomies-500` |
| Moss | Green | `bg-moss-300` |
| Walkies | Warm yellow | `bg-walkies-400` |
| Snoot | Soft pink | `bg-snoot-400` |
| Puddle | Lavender | `bg-puddle-400` |
| Black (+alpha) | `#131218` + steps | `bg-black-200` |
| White (+alpha) | `#FFFFFF` + steps | `bg-white-300` |
| Positive | Teal | `bg-positive-300` |
| Negative | Crimson | `bg-negative-300` |

### 2c. Opacity / alpha — only two correct ways

When you need a token at less than 100% opacity, **never** introduce a new hex.
Choose one:

1. **Tailwind opacity modifier** — preferred for chrome:
   ```tsx
   className="border-border-accent/40 bg-background-accent/[0.04] text-content-primary/85"
   ```

2. **CSS `color-mix` against a token** — for backgrounds, gradients, shadows:
   ```tsx
   style={{
     background:
       "radial-gradient(360px circle at var(--mx) var(--my), color-mix(in srgb, var(--color-zoomies-500) 10%, transparent), transparent 60%)",
   }}
   ```

**Never** write `rgba(58, 57, 255, 0.10)`. That's the Zoomies/500 RGB inlined,
and the moment the designer adjusts the brand color in Figma, your card is the
only thing on the site that didn't follow.

### 2d. Spacing — `--size-*` aligned to Tailwind defaults

The control center publishes 10 named steps that line up exactly with
Tailwind's default scale (which is 4px-stepped):

| Figma name | px | Tailwind | Token |
|------------|-----|----------|-------|
| XXXSmall   | 4   | `p-1`, `gap-1`, `mt-1` | `--size-3xs` |
| XXSmall    | 8   | `p-2`, `gap-2` | `--size-2xs` |
| XSmall     | 12  | `p-3`, `gap-3` | `--size-xs` |
| Small      | 16  | `p-4`, `gap-4` | `--size-sm` |
| Medium     | 24  | `p-6`, `gap-6` | `--size-md` |
| Large      | 32  | `p-8`, `gap-8` | `--size-lg` |
| XLarge     | 40  | `p-10`, `gap-10` | `--size-xl` |
| XXLarge    | 48  | `p-12`, `gap-12` | `--size-2xl` |
| XXXLarge   | 64  | `p-16`, `gap-16` | `--size-3xl` |
| XXXXLarge  | 80  | `p-20`, `gap-20` | `--size-4xl` |

Use Tailwind's default classes (`p-1`, `gap-6`, etc.) — they map automatically.
For the named token, use the arbitrary form: `[padding:var(--size-md)]`.

**Off-scale (e.g. `p-[15px]`, `gap-[7px]`) is forbidden** for component chrome.
Only acceptable for:

1. **One-off positioning of decorative SVG paths**
2. **1–2px hairlines** (progress bars, dividers, focus underlines) — the
   scale's smallest step is 4px (XXXSmall), and a 2px line is intentionally
   sub-scale. Annotate with a comment so it isn't mistaken for sloppiness.

### 2e. Border radius — `--radius-*`

| Token | px | Tailwind | Use |
|-------|-----|----------|-----|
| `--radius-xs` | 4 | `rounded-xs` | Tiny inset (badges) |
| `--radius-sm` | 8 | `rounded-sm` | Small inputs |
| `--radius-md` | 12 | `rounded-md` | Default for buttons |
| `--radius-lg` | 16 | `rounded-lg` | Cards |
| `--radius-xl` | 24 | `rounded-xl` | Hero panels |
| `--radius-2xl` | 32 | `rounded-2xl` | Large feature cards (our default editorial card radius) |
| `--radius-full` | ∞ | `rounded-full` | Pills, CTA, avatars |

### 2f. Typography

| Family | Variable | Class | Use |
|--------|----------|-------|-----|
| DM Sans | `--font-body` | `font-sans` (default) | All body, UI labels, most headings |
| Instrument Serif | `--font-display` | `font-display italic` | Emphasis only — italic accents on a sans baseline |

**Headings** use `font-sans` + `tracking-tight` (`-0.02em`) by default. Use
`font-display italic` for a single word or phrase to break the rhythm — like
*"actually friendly"* in our pull-quotes. Don't use `font-display` for entire
headings; it loses its character.

**Font sizes** use the published ramp:

| Class | rem | px |
|-------|-----|-----|
| `text-xs` | 0.75 | 12 |
| `text-sm` | 0.875 | 14 |
| `text-base` | 1 | 16 |
| `text-lg` | 1.125 | 18 |
| `text-xl` | 1.25 | 20 |
| `text-2xl` | 1.5 | 24 |
| `text-3xl` | 1.875 | 30 |
| `text-4xl` | 2.25 | 36 |
| `text-5xl` | 3 | 48 |
| `text-6xl` | 3.75 | 60 |
| `text-7xl` | 4.5 | 72 |
| `text-8xl` | 6 | 96 |

For responsive headings, **`clamp()` with these endpoints is preferred** over
plain `sm:text-Xxl`:
```tsx
className="text-[clamp(32px,6vw,56px)]"
```
This is the only "off-scale" sizing acceptable because it interpolates
*between* tokens, not around them.

**Line height**: body uses `leading-relaxed` (1.65). Tight display uses
`leading-tight` (1.1).

**Letter spacing**: headings use `tracking-tight` (-0.02em). Small overlines
(e.g. eyebrows above sections) use `tracking-wider` (0.06em) with `uppercase`.

### 2g. Shadows

| Token | When |
|-------|------|
| `var(--shadow-sm)` | Subtle elevation (form inputs, chips) |
| `var(--shadow-md)` | Default card lift (the floating header logo uses this) |
| `var(--shadow-lg)` | Modals, popovers |
| `var(--shadow-xl)` | Dialogs, lightboxes |

Tinted with Bark, not pure black — they integrate with cream surfaces. Use via
arbitrary value: `shadow-[var(--shadow-md)]`.

---

## 3. Motion — what's allowed, what isn't

### Allowed primitives (GSAP)

- `gsap.from()` / `gsap.to()` on **transform + opacity only**
- `gsap.quickTo()` for per-frame writes (cursor followers, scrubs)
- `ScrollTrigger.batch()` for viewport-enter reveals
- `ScrollSmoother` (page-wide) — already configured in `components/SmoothScroll.tsx`
- `SplitText` for character-level text reveals (already registered)

### Timing

| Use | Duration | Ease |
|-----|----------|------|
| Hover state change | 150–250ms | `power2.out` |
| Card flip / turn | 350–500ms (split) | `power2.in` → `back.out(1.4)` |
| Scroll-reveal text | 600–700ms | `power2.out` / `power3.out` |
| Cursor follower | 0.55s `quickTo` | `power2.out` |
| Hero text stagger | 600ms total | `power3.out` |

Never exceed 800ms for UI motion. Never use `linear` for anything other than
continuous scrubs.

### Stagger

- Per-paragraph reveal: **80ms** between elements
- Per-character text reveal: **24ms** between chars

Faster than this reads as "one motion." Slower reads as "deliberate
sequence." We default to the faster end because we want motion to feel like
*breath*, not *announcement*.

### Anti-patterns

- ❌ AI-purple/pink mesh gradients on hero
- ❌ Glassmorphism (frosted blur cards) — out of brand
- ❌ Bento grid with 5+ tile sizes — instant template tell
- ❌ Floating UI elements that bounce or pulse continuously
- ❌ "Light beam swept across the title" on every page
- ❌ Scroll-jacking (long horizontal pin pans on text pages — we reserve the one we have for Steps and that's it)

---

## 4. Layout primitives

### Page widths

| Page type | `max-w` | Reasoning |
|-----------|---------|-----------|
| Home (landing) | varies per section | Hero + Steps each pick their own |
| Editorial subpage (`/about`, `/for-venues`) | `max-w-[820px]` | 65–75 char reading width on lg |
| Legal (`/privacy`, `/terms`) | `max-w-[820px]` | Same as editorial |
| Design system | `max-w-6xl` | Reference page, not user-facing |

### Page padding

Always: `px-6 sm:px-8` minimum. Top padding accounts for the floating nav pill:
`pt-32 sm:pt-40`. Bottom: `pb-16 lg:pb-24`.

### Cards (editorial style)

Our cards do **not** look like SaaS dashboards. They:

- Use `rounded-2xl` (`--radius-2xl` = 32px)
- Use `border border-border-accent/15` or `border-border-muted` (faint outline only)
- Use `bg-background-accent/[0.04]` or `bg-background-primary` (almost-flat fill)
- Have a numeric eyebrow (`01`, `02`, `03`) in `font-display text-content-accent/70`
- Have a 32px-wide rule under the eyebrow: `h-px w-8 bg-content-accent/40`
- Have an h3 heading in `text-content-brand`
- Have body text in `text-content-primary/85`

This is the editorial-card pattern. Don't reinvent it per page.

---

## 5. Component conventions

### Client components

Mark with `"use client"` at top. Keep client surface area as small as
possible — page-level files should remain server components, with thin client
wrappers (e.g. `<RevealScope>`, `<TiltSpotlightCard>`) for interaction.

### GSAP imports

Always from `@/lib/gsap`. Never directly from `gsap`. The barrel registers all
plugins idempotently in one place.

```tsx
// Good
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

// Bad — plugin won't be registered, animation will silently no-op
import { gsap } from "gsap";
```

### Cleanup

Every GSAP effect MUST clean up:

- `useGSAP` hook captures everything inside its scope (preferred when possible)
- Manual `useEffect` → return `() => { trigger.kill(); split?.revert(); }`
- AbortController-owned event listeners (see `CursorDog/useCursorTracker.ts`)

A leaked ScrollTrigger or SplitText is a memory leak the user *will* feel
during long sessions.

---

## 6. Accessibility floor (non-negotiable)

| Item | Requirement |
|------|-------------|
| Contrast | 4.5:1 for body text. `text-content-primary` on `bg-background-brand` and `bg-background-primary` both meet this. |
| Focus rings | All interactive elements must have a visible focus ring. Use `focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2`. |
| Alt text | Decorative images: `alt=""`. Meaningful images: descriptive text. Logos: `aria-label` on the link, `alt=""` on the image. |
| Reduced motion | See rule 5 in §1. |
| Touch targets | 44×44px minimum for any tap target. |
| Keyboard | Every interaction reachable by keyboard, in source order. |

---

## 7. The checklist (run before every PR)

- [ ] No hex codes, rgba, hsl in component or page files (`grep -rE "rgba|#[0-9a-fA-F]{3,8}|rgb\(|hsl\(" components/ app/`)
- [ ] No off-scale spacing (`p-[7px]`, `gap-[15px]` etc.) outside one-off decorative SVG positioning
- [ ] All new motion respects `prefers-reduced-motion`
- [ ] All new motion uses transform/opacity only
- [ ] All clickable elements have `cursor-pointer` if not natively (`<a>`/`<button>` already do)
- [ ] All focus rings present and use `border-accent`
- [ ] Tested at 375 / 768 / 1024 / 1440 px viewport widths
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run lint` clean
- [ ] If new tokens were added, they appear in `/design-system` *first*, then are used

---

## 8. When the design system disagrees with what you want

The design system wins. If you genuinely need a new token, the path is:

1. Add it to `styles/tokens/*.css` (primitive) AND `app/globals.css` (semantic + `@theme inline`)
2. Render it in `app/design-system/page.tsx` so it's visible in the catalog
3. Then use it in your component

Adding a one-off inline color is faster but kills the system. Don't.

---

## Authoritative files

| File | Layer |
|------|-------|
| `styles/tokens/colors.css` | Primitives (97 color vars) |
| `styles/tokens/spacing.css` | Sizing (10 steps), radius, shadow |
| `styles/tokens/typography.css` | Type ramp, leading, tracking, weights |
| `app/globals.css` | Semantic aliases + `@theme inline` Tailwind registration |
| `app/design-system/page.tsx` | Live catalog (the "control center") |
| `docs/DESIGN-RULES.md` | This file — the rules |

Read all six before designing. Update all six together when the system evolves.
