import type { ReactNode } from "react";
import { slugify } from "@/lib/slugify";

interface Props {
  /** Plain text used both as the rendered heading AND the slug source. */
  children: string;
  className?: string;
  /** Optional override — pass an explicit id when the auto-slug clashes. */
  id?: string;
}

/**
 * Server-renderable h2 with a stable slug id. Used on long-form legal
 * pages (/privacy, /terms) so direct hash links and no-JS visitors land
 * on the right section pre-hydration. ReadingShell prefers the
 * server-rendered id and only falls back to runtime slugify when this
 * component isn't used.
 *
 * Children must be a plain string — needed for slugify and to satisfy
 * the no-JS contract (no descendant Component renders before hydration
 * is meaningless for static HTML anyway, but enforcing string here
 * makes the slug source trivially auditable).
 *
 * className lets callers keep the existing visual treatment; defaults
 * to the legal-page h2 style.
 */
export function SectionHeading({
  children,
  className = "text-2xl tracking-tight text-content-brand sm:text-3xl",
  id,
}: Props): ReactNode {
  return (
    <h2 id={id ?? slugify(children)} className={className}>
      {children}
    </h2>
  );
}
