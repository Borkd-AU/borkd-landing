import { ThemeToggle } from "@/components/theme-toggle";

const palettes = [
  { name: "Cloud", role: "cream off-white — page surface", key: "cloud" },
  { name: "Bark", role: "warm brown — text & foreground", key: "bark" },
  { name: "Zoomies", role: "electric blue — primary brand", key: "zoomies" },
  { name: "Puddle", role: "lavender — support", key: "puddle" },
  { name: "Snoot", role: "soft pink — support", key: "snoot" },
  { name: "Walkies", role: "warm yellow — support", key: "walkies" },
  { name: "Moss", role: "green — support", key: "moss" },
] as const;

const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Static class strings so Tailwind's compile-time scanner picks them up.
const semanticPairs = [
  { bg: "bg-primary",   fg: "text-primary-foreground",   bgLabel: "bg-primary",   fgLabel: "text-primary-foreground" },
  { bg: "bg-secondary", fg: "text-secondary-foreground", bgLabel: "bg-secondary", fgLabel: "text-secondary-foreground" },
  { bg: "bg-accent",    fg: "text-accent-foreground",    bgLabel: "bg-accent",    fgLabel: "text-accent-foreground" },
  { bg: "bg-muted",     fg: "text-muted-foreground",     bgLabel: "bg-muted",     fgLabel: "text-muted-foreground" },
  { bg: "bg-success",   fg: "text-success-foreground",   bgLabel: "bg-success",   fgLabel: "text-success-foreground" },
  { bg: "bg-warning",   fg: "text-warning-foreground",   bgLabel: "bg-warning",   fgLabel: "text-warning-foreground" },
  { bg: "bg-danger",    fg: "text-danger-foreground",    bgLabel: "bg-danger",    fgLabel: "text-danger-foreground" },
  { bg: "bg-info",      fg: "text-info-foreground",      bgLabel: "bg-info",      fgLabel: "text-info-foreground" },
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
      {/* === Header === */}
      <header className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">
            Borkd · Design system
          </p>
          <h1 className="text-5xl tracking-tight text-foreground sm:text-7xl">
            Calm, but{" "}
            <em className="font-display text-primary">bold</em>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Single source of truth for every colour, font and surface.
            Edit{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
              styles/tokens/
            </code>{" "}
            and the whole site updates.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* === Typography demo === */}
      <section className="mb-20">
        <SectionTitle eyebrow="Typography" title="Two typefaces, perfectly paired" />
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Body — DM Sans
            </p>
            <p className="font-sans text-3xl tracking-tight text-foreground">
              Clean, geometric, always readable.
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              Used for body copy, UI labels, and most headings. Geometric sans
              with friendly proportions.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-8">
            <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
              Display — Instrument Serif
            </p>
            <p className="font-display text-4xl text-foreground">
              Character &amp; contrast.
            </p>
            <p className="mt-3 text-base text-muted-foreground">
              Reserved for emphasis — italic accents on a sans baseline.
              Used sparingly to add personality.
            </p>
          </div>
        </div>
      </section>

      {/* === Semantic tokens === */}
      <section className="mb-20">
        <SectionTitle
          eyebrow="Semantic"
          title="Tokens components actually consume"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {semanticPairs.map(({ bg, fg, bgLabel, fgLabel }) => (
            <div
              key={bg}
              className={`flex flex-col gap-1 rounded-xl p-4 ${bg} ${fg}`}
            >
              <span className="text-xs uppercase tracking-wider opacity-70">
                {bgLabel}
              </span>
              <span className="text-sm font-medium">{fgLabel}</span>
            </div>
          ))}
        </div>
      </section>

      {/* === Component primitives demo === */}
      <section className="mb-20">
        <SectionTitle
          eyebrow="Primitives"
          title="Buttons, surfaces, focus rings"
        />
        <div className="flex flex-wrap items-center gap-4">
          <button className="inline-flex items-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            Primary action
          </button>
          <button className="inline-flex items-center rounded-full bg-secondary px-6 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:opacity-90">
            Secondary
          </button>
          <button className="inline-flex items-center rounded-full border border-border bg-surface-elevated px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            Ghost
          </button>
          <button className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:opacity-90">
            Accent
          </button>
        </div>
      </section>

      {/* === Full palette grid === */}
      <section>
        <SectionTitle eyebrow="Primitives" title="Six families, eleven shades" />
        <div className="space-y-6">
          {palettes.map(({ name, role, key }) => (
            <div key={key}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-lg font-medium text-foreground">{name}</h3>
                <p className="text-sm text-muted-foreground">{role}</p>
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
                {shades.map((shade) => (
                  <Swatch key={shade} family={key} shade={shade} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-24 border-t border-border pt-8 text-sm text-muted-foreground">
        Edit{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
          styles/tokens/colors.css
        </code>{" "}
        — every swatch above re-renders.
      </footer>
    </main>
  );
}

function SectionTitle({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl tracking-tight text-foreground">{title}</h2>
    </div>
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
        className="aspect-square rounded-lg border border-border"
        style={{ backgroundColor: `var(--${family}-${shade})` }}
        aria-hidden
      />
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{shade}</span>
      </div>
    </div>
  );
}
