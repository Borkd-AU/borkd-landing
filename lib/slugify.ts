/**
 * Slugify a heading text for use as a stable URL fragment id. Lowercase,
 * non-alphanumerics collapsed to "-", leading/trailing "-" trimmed, max
 * 60 chars. The same function is used at server-render time to assign
 * `id=""` on legal-page h2s, AND at runtime in ReadingShell so the
 * desktop/mobile TOC can build its href list from the same identifiers.
 *
 * Keeping this in one place (instead of two copies) means a future
 * change to the id format updates both producer and consumer at once.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
