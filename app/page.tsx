/**
 * Token system showcase — 1:1 mirror of the Borkd Design System Figma file.
 *
 * Edit any token in styles/tokens/colors.css or the @theme block in
 * app/globals.css and every swatch + every consuming component re-renders.
 */

const primitives = [
  { name: "Cloud",    role: "cream off-white",   key: "cloud",    shades: 11 },
  { name: "Bark",     role: "warm brown",        key: "bark",     shades: 11 },
  { name: "Zoomies",  role: "electric blue",     key: "zoomies",  shades: 11 },
  { name: "Moss",     role: "green",             key: "moss",     shades: 11 },
  { name: "Walkies",  role: "warm yellow",       key: "walkies",  shades: 11 },
  { name: "Snoot",    role: "soft pink",         key: "snoot",    shades: 11 },
  { name: "Puddle",   role: "lavender",          key: "puddle",   shades: 11 },
  { name: "Black",    role: "#131218 + alpha",   key: "black",    shades: 5  },
  { name: "White",    role: "#FFFFFF + alpha",   key: "white",    shades: 5  },
  { name: "Positive", role: "success — teal",    key: "positive", shades: 5  },
  { name: "Negative", role: "error — crimson",   key: "negative", shades: 5  },
] as const;

const shades11 = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const shades5  = [100, 200, 300, 400, 500] as const;

// Static class strings — Tailwind needs literal class names at build time.
const contentTokens = [
  { cls: "text-content-primary",    label: "content.primary",    refs: "Black/500" },
  { cls: "text-content-brand",      label: "content.brand",      refs: "Bark/500" },
  { cls: "text-content-contrast",   label: "content.contrast",   refs: "White/500" },
  { cls: "text-content-secondary",  label: "content.secondary",  refs: "Black/400" },
  { cls: "text-content-tertiary",   label: "content.tertiary",   refs: "Black/300" },
  { cls: "text-content-accent",     label: "content.accent",     refs: "Zoomies/500" },
  { cls: "text-content-positive",   label: "content.positive",   refs: "Positive/300" },
  { cls: "text-content-negative",   label: "content.negative",   refs: "Negative/300" },
] as const;

const backgroundTokens = [
  { cls: "bg-background-primary",         label: "background.primary",         refs: "White/500" },
  { cls: "bg-background-brand",           label: "background.brand",           refs: "Cloud/500" },
  { cls: "bg-background-secondary",       label: "background.secondary",       refs: "Black/200" },
  { cls: "bg-background-tertiary",        label: "background.tertiary",        refs: "Black/100" },
  { cls: "bg-background-overlay",         label: "background.overlay",         refs: "Black/200" },
  { cls: "bg-background-contrast",        label: "background.contrast",        refs: "White/500" },
  { cls: "bg-background-accent",          label: "background.accent",          refs: "Zoomies/500" },
  { cls: "bg-background-accent-muted",    label: "background.accentMuted",     refs: "Zoomies/100" },
  { cls: "bg-background-positive",        label: "background.positive",        refs: "Positive/300" },
  { cls: "bg-background-positive-muted",  label: "background.positiveMuted",   refs: "Positive/100" },
  { cls: "bg-background-negative",        label: "background.negative",        refs: "Negative/300" },
  { cls: "bg-background-negative-muted",  label: "background.negativeMuted",   refs: "Negative/100" },
] as const;

const borderTokens = [
  { cls: "border-border-primary", label: "border.primary", refs: "Black/500" },
  { cls: "border-border-muted",   label: "border.muted",   refs: "Black/200" },
  { cls: "border-border-accent",  label: "border.accent",  refs: "Zoomies/500" },
] as const;

const sizeTokens = [
  { name: "XXXSmall", px: 4 },
  { name: "XXSmall",  px: 8 },
  { name: "XSmall",   px: 12 },
  { name: "Small",    px: 16 },
  { name: "Medium",   px: 24 },
  { name: "Large",    px: 32 },
  { name: "XLarge",   px: 40 },
  { name: "XXLarge",  px: 48 },
  { name: "XXXLarge", px: 64 },
  { name: "XXXXLarge", px: 80 },
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <header className="mb-20">
        <p className="mb-3 text-xs uppercase tracking-wider text-content-tertiary">
          Borkd · Design system · 1:1 Figma mirror
        </p>
        <h1 className="text-5xl tracking-tight sm:text-7xl">
          Calm, but{" "}
          <em className="font-display text-content-accent">bold</em>.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-content-secondary">
          Edit{" "}
          <code className="rounded bg-background-secondary px-1.5 py-0.5 font-mono text-sm text-content-primary">
            styles/tokens/colors.css
          </code>{" "}
          or the semantic mapping in{" "}
          <code className="rounded bg-background-secondary px-1.5 py-0.5 font-mono text-sm text-content-primary">
            app/globals.css
          </code>{" "}
          and every consumer of the Tailwind utilities below updates
          immediately. Source of truth: Figma → Variables → Primitives /
          Semantics (97 + 33).
        </p>
      </header>

      {/* ─── Typography ─────────────────────────────────────────── */}
      <Section eyebrow="Typography" title="Two typefaces, perfectly paired">
        <div className="grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-border-muted bg-background-primary p-8">
            <p className="mb-2 text-xs uppercase tracking-wider text-content-tertiary">
              Body — DM Sans
            </p>
            <p className="font-sans text-3xl tracking-tight text-content-primary">
              Clean, geometric, always readable.
            </p>
            <p className="mt-3 text-base text-content-secondary">
              Used for body copy, UI labels, and most headings.
            </p>
          </article>
          <article className="rounded-2xl border border-border-muted bg-background-primary p-8">
            <p className="mb-2 text-xs uppercase tracking-wider text-content-tertiary">
              Display — Instrument Serif
            </p>
            <p className="font-display text-4xl text-content-primary">
              Character &amp; contrast.
            </p>
            <p className="mt-3 text-base text-content-secondary">
              Reserved for emphasis — italic accents on a sans baseline.
            </p>
          </article>
        </div>
      </Section>

      {/* ─── content/* ──────────────────────────────────────────── */}
      <Section eyebrow="Semantics · content" title="Text & icon colors">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {contentTokens.map((t) => (
            <div
              key={t.label}
              className="flex flex-col gap-2 rounded-xl border border-border-muted bg-background-primary p-4"
            >
              <p className={`text-xl font-semibold ${t.cls}`}>Aa</p>
              <div className="flex flex-col gap-0.5">
                <code className="font-mono text-xs text-content-primary">
                  {t.label}
                </code>
                <code className="font-mono text-[10px] text-content-tertiary">
                  → {t.refs}
                </code>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── background/* ───────────────────────────────────────── */}
      <Section eyebrow="Semantics · background" title="Surface colors">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {backgroundTokens.map((t) => (
            <div
              key={t.label}
              className={`flex h-28 flex-col justify-end gap-0.5 rounded-xl border border-border-muted p-3 ${t.cls}`}
            >
              <code className="font-mono text-[11px] text-content-primary">
                {t.label}
              </code>
              <code className="font-mono text-[10px] text-content-tertiary">
                → {t.refs}
              </code>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── border/* ───────────────────────────────────────────── */}
      <Section eyebrow="Semantics · border" title="Outlines & dividers">
        <div className="grid gap-3 sm:grid-cols-3">
          {borderTokens.map((t) => (
            <div
              key={t.label}
              className={`flex h-24 flex-col justify-end gap-0.5 rounded-xl border-2 bg-background-primary p-3 ${t.cls}`}
            >
              <code className="font-mono text-[11px] text-content-primary">
                {t.label}
              </code>
              <code className="font-mono text-[10px] text-content-tertiary">
                → {t.refs}
              </code>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── size/* ─────────────────────────────────────────────── */}
      <Section eyebrow="Semantics · size" title="Spacing scale">
        <div className="space-y-2 rounded-2xl border border-border-muted bg-background-primary p-6">
          {sizeTokens.map((t) => (
            <div key={t.name} className="flex items-center gap-4">
              <code className="w-28 shrink-0 font-mono text-xs text-content-secondary">
                {t.name}
              </code>
              <div
                className="h-3 rounded-sm bg-background-accent"
                style={{ width: `${t.px}px` }}
                aria-hidden
              />
              <code className="font-mono text-xs text-content-tertiary">
                {t.px}px
              </code>
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Component primitives demo ──────────────────────────── */}
      <Section eyebrow="Composition" title="Components consuming semantic tokens">
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center rounded-full bg-background-accent px-6 py-3 text-sm font-medium text-content-contrast transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background-primary">
            Primary action
          </button>
          <button className="inline-flex items-center rounded-full bg-content-primary px-6 py-3 text-sm font-medium text-content-contrast transition-opacity hover:opacity-90">
            Secondary
          </button>
          <button className="inline-flex items-center rounded-full border border-border-primary bg-background-primary px-6 py-3 text-sm font-medium text-content-primary transition-colors hover:bg-background-secondary">
            Ghost
          </button>
          <button className="inline-flex items-center rounded-full bg-background-accent-muted px-6 py-3 text-sm font-medium text-content-accent transition-opacity hover:opacity-90">
            Accent muted
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-background-positive-muted px-3 py-1 text-xs font-medium text-content-positive">
            Verified
          </span>
          <span className="inline-flex items-center rounded-full bg-background-negative-muted px-3 py-1 text-xs font-medium text-content-negative">
            Action required
          </span>
          <span className="inline-flex items-center rounded-full bg-background-accent-muted px-3 py-1 text-xs font-medium text-content-accent">
            Beta
          </span>
        </div>
      </Section>

      {/* ─── Primitive palette grids ────────────────────────────── */}
      <Section
        eyebrow="Primitives"
        title="Eleven families · 97 tokens"
        description="Raw scales — referenced by Semantics above. Use directly only when no semantic token applies."
      >
        <div className="space-y-6">
          {primitives.map(({ name, role, key, shades }) => (
            <div key={key}>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-base font-medium text-content-primary">
                  {name}
                </h3>
                <p className="text-xs text-content-tertiary">{role}</p>
              </div>
              <div
                className={`grid gap-2 ${shades === 11 ? "grid-cols-6 sm:grid-cols-11" : "grid-cols-5"}`}
              >
                {(shades === 11 ? shades11 : shades5).map((shade) => (
                  <Swatch key={shade} family={key} shade={shade} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <footer className="mt-24 border-t border-border-muted pt-8">
        <p className="text-sm text-content-tertiary">
          Source of truth:{" "}
          <code className="font-mono text-content-secondary">
            styles/tokens/colors.css
          </code>{" "}
          ·{" "}
          <code className="font-mono text-content-secondary">
            app/globals.css
          </code>
        </p>
      </footer>
    </main>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-16">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wider text-content-tertiary">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl tracking-tight text-content-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-content-secondary">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  family,
  shade,
}: {
  family: string;
  shade: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="aspect-square rounded-lg border border-border-muted"
        style={{ backgroundColor: `var(--${family}-${shade})` }}
        aria-hidden
      />
      <code className="font-mono text-[10px] text-content-secondary">
        {shade}
      </code>
    </div>
  );
}
