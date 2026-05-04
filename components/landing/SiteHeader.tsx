import Image from "next/image";

/**
 * Top-of-page hero. Built from real components on top of a single
 * landscape photograph — exactly the layering the Figma file uses:
 *
 *   Layer 1: header-bg.png (sky + field)        ← background
 *   Layer 2: HTML controls (logo, nav pill, CTA) ← top bar
 *   Layer 3: HTML headline                       ← centered text
 *   Layer 4: hero-illustration.png (man + jojo)  ← above the field
 *   Layer 5: HTML store buttons                  ← bottom CTAs
 *
 * The illustration PNG is exported from Figma with a transparent
 * background (no baked-in field) so it sits naturally on top of
 * whatever sits behind it.
 */
export function SiteHeader() {
  return (
    <header className="relative isolate w-full overflow-hidden bg-background-brand">
      <div
        className="relative w-full"
        style={{ aspectRatio: "1024 / 611" }}
      >
        {/* Layer 1 — landscape photo. The Figma source is portrait
            (617×1024), so covering a 1.676:1 frame zooms the field in.
            Anchoring near the top keeps sky + tree line visible while
            the cream wash below blends the bottom into section 2. */}
        <Image
          src="/images/header-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_70%]"
        />
        {/* A soft cream wash near the top so the warm Bark headline
            stays legible against the busy tree line behind it. */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-cloud-50/70 via-cloud-50/35 to-transparent"
        />
        {/* Bottom blend into the cream section that follows. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-b from-transparent to-background-brand"
        />

        {/* Layer 2 — top bar */}
        <div className="absolute inset-x-0 top-0 z-20 px-6 pt-6 sm:px-12 sm:pt-10">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <Logo />
            <NavPill className="hidden md:flex" />
            <DownloadCta />
          </div>
        </div>

        {/* Layer 3 — headline (centered) */}
        <div className="absolute inset-x-0 top-[14%] z-10 flex justify-center px-6">
          <h1
            className="max-w-[978px] text-center text-[32px] leading-tight tracking-tight text-bark-600 sm:text-[48px] md:text-[60px] lg:text-[67px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Find places that{" "}
            <em className="font-display italic">actually work</em> for you
            and your pup
          </h1>
        </div>

        {/* Layer 4 — man + jojo illustration */}
        <div className="absolute inset-x-0 top-[42%] z-10 flex justify-center px-6">
          <Image
            src="/images/hero-illustration.png"
            alt="A person walking with their dog jojo"
            width={526}
            height={355}
            priority
            sizes="(max-width: 640px) 280px, (max-width: 1024px) 420px, 526px"
            className="h-auto w-[280px] sm:w-[360px] md:w-[460px] lg:w-[526px]"
          />
        </div>

        {/* Layer 5 — store buttons */}
        <div className="absolute inset-x-0 bottom-[6%] z-10 flex justify-center gap-3">
          <StoreButton variant="play" />
          <StoreButton variant="apple" />
        </div>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <a
      href="#top"
      aria-label="Borkd"
      className="grid h-[57px] w-[57px] shrink-0 place-items-center rounded-full bg-background-accent shadow-md transition-opacity hover:opacity-90"
    >
      <Image
        src="/images/illustration/vector6-logo.svg"
        alt=""
        width={30}
        height={26}
        className="h-[26px] w-[30px]"
      />
    </a>
  );
}

function NavPill({ className = "" }: { className?: string }) {
  const items = [
    { label: "about", href: "#about" },
    { label: "contact", href: "#contact" },
    { label: "shop", href: "#shop" },
  ];
  return (
    <nav
      aria-label="Primary"
      className={`items-center rounded-full bg-black/30 px-6 py-3 backdrop-blur-sm ${className}`}
    >
      <ul className="flex items-center gap-6 text-[18px] tracking-tight text-white">
        {items.map(({ label, href }) => (
          <li key={label}>
            <a href={href} className="transition-opacity hover:opacity-80">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function DownloadCta() {
  return (
    <a
      href="#download"
      className="inline-flex h-[48px] shrink-0 items-center rounded-full bg-background-accent px-5 text-content-contrast shadow-md transition-opacity hover:opacity-90"
    >
      <em className="font-display text-[20px] italic tracking-tight">
        Download now
      </em>
    </a>
  );
}

function StoreButton({ variant }: { variant: "play" | "apple" }) {
  const iconSrc =
    variant === "play"
      ? "/images/store/playstore-icon.svg"
      : "/images/store/apple-icon.svg";
  const eyebrow = variant === "play" ? "Get it on" : "Download on the";
  const main = variant === "play" ? "Google Play" : "App Store";
  const aria =
    variant === "play"
      ? "Get it on Google Play"
      : "Download on the App Store";
  const href = variant === "play" ? "#play" : "#apple";

  return (
    <a
      href={href}
      aria-label={aria}
      className="flex h-[50px] w-[151px] items-center gap-2 overflow-hidden rounded-md border border-[#a6a6a6] bg-black px-2.5 transition-opacity hover:opacity-90"
    >
      <Image
        src={iconSrc}
        alt=""
        width={variant === "play" ? 26 : 25}
        height={30}
        className="h-[26px] w-auto shrink-0"
      />
      <div className="flex min-w-0 flex-col text-white">
        <span className="text-[10px] leading-tight">{eyebrow}</span>
        <span className="truncate text-[18px] font-medium leading-tight tracking-tight">
          {main}
        </span>
      </div>
    </a>
  );
}
