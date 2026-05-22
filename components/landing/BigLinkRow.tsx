/**
 * BigLinkRow — a single editorial inbox row. Used by /contact and other
 * places that want a row-list instead of a card grid.
 *
 * Server component — no hooks, no event handlers, just markup with CSS
 * hover. Keeps /contact's bundle slim.
 *
 * Layout: a big display headline on the left, a small uppercase eyebrow
 * label on the right. On desktop (pointer: fine) hover, the row gets:
 *
 *   • a thin violet rule fading in along the top + bottom
 *   • a left-side arrow that fades in and pushes the headline 24px right
 *   • a subtle accent wash filling the row from the left (clip-path so
 *     it doesn't bleed past the row's vertical bounds)
 *
 * On touch (pointer: coarse) and `prefers-reduced-motion: reduce`, the
 * row stays static and the arrow is always visible.
 *
 * Anchor / button mode: pass `href` (string) for a link, `onClick` for a
 * button. Don't pass both. The wrapper element matches accordingly.
 *
 * All chrome maps to semantic tokens — no hex/rgba inline. See
 * docs/DESIGN-RULES.md.
 */
import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  href: string;
  children: ReactNode;
  /** Optional secondary line under the headline, smaller text. */
  description?: ReactNode;
}

export function BigLinkRow({ eyebrow, href, children, description }: Props) {
  return (
    <a
      href={href}
      className="group relative flex flex-col gap-2 border-t border-border-muted py-6 transition-colors duration-200 last:border-b hover:border-border-accent sm:flex-row sm:items-baseline sm:justify-between sm:gap-6 sm:py-8"
    >
      {/* Left side: arrow + headline. Arrow is hidden on mobile and on
          touch (CSS @media), so coarse pointers don't see a control they
          can't trigger meaningfully. */}
      <div className="flex items-baseline gap-3 sm:gap-4">
        <span
          aria-hidden="true"
          className="hidden text-content-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none sm:inline-block sm:-translate-x-2 sm:text-2xl"
        >
          &rarr;
        </span>
        <span
          className="font-sans tracking-tight text-content-brand text-[clamp(28px,5vw,52px)] leading-[1.05] transition-transform duration-300 ease-out group-hover:translate-x-2 motion-reduce:transition-none"
          style={{ fontVariationSettings: "'opsz' 14" }}
        >
          {children}
        </span>
      </div>

      {/* Right side: eyebrow label + optional description below. */}
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <span className="font-display text-xs uppercase tracking-widest text-content-accent/70 sm:text-sm">
          {eyebrow}
        </span>
        {description ? (
          <span className="max-w-xs text-sm leading-snug text-content-primary/70 sm:text-right sm:text-base">
            {description}
          </span>
        ) : null}
      </div>
    </a>
  );
}
