import Image from "next/image";

/**
 * Two hero variants from the Figma file. Both use the same shared parts
 * (logo, nav, CTA, store buttons) but with different background +
 * character composition. Switch by importing whichever you want from
 * `app/page.tsx`.
 *
 *   SiteHeader        — Figma node 134:5659 (sky + field, man + jojo)
 *   SiteHeaderAlt     — Figma node 157:271  (autumn forest, girl + retriever)
 */

export function SiteHeader() {
  // Figma "Website / header image" (134:5659).
  //   Layer 1: header-bg.jpg (sky + field, 1732×2879 portrait)
  //   Layer 2: HTML controls (logo, nav pill, CTA)
  //   Layer 3: HTML headline (centered, dark)
  //   Layer 4: hero-illustration.png (man + jojo)
  //   Layer 5: HTML store buttons
  return (
    <header className="relative isolate w-full overflow-hidden bg-background-brand">
      <div
        className="relative w-full"
        style={{ aspectRatio: "1440 / 859" }}
      >
        {/* Portrait sky+field photo stretched to a landscape frame
            (matches the Figma source which uses object-fit: fill). The
            horizontal stretch is what gives the wide, low-horizon look. */}
        <Image
          src="/images/header-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-fill object-bottom"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-b from-transparent to-background-brand"
        />

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 px-6 pt-6 sm:px-12 sm:pt-10">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <Logo />
            <NavPill className="hidden md:flex" />
            <DownloadCta />
          </div>
        </div>

        {/* headline (centered) */}
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

        {/* man + jojo illustration */}
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

        {/* store buttons */}
        <div className="absolute inset-x-0 bottom-[6%] z-10 flex justify-center gap-3">
          <StoreButton variant="play" />
          <StoreButton variant="apple" />
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderAlt() {
  // Figma "Website / header image - alternative" (157:271).
  //   Layer 1: header-bg-alt.jpg (autumn forest, 2880×1920 landscape)
  //   Layer 2: HTML controls (logo, nav pill, CTA)
  //   Layer 3: headline + store buttons (left-aligned, white)
  //   Layer 4: golden-retriever.svg (centre-bottom)
  //   Layer 5: girl-2.svg (right-bottom)
  // Coordinates from the Figma 1440×859 frame are converted to %.
  // Hero is capped to viewport height (`max-h-[100svh]`) so the
  // bottom-anchored characters never get clipped on shorter viewports.
  return (
    <header className="relative isolate w-full overflow-hidden bg-background-brand">
      <div
        className="relative mx-auto w-full max-h-[100svh]"
        style={{ aspectRatio: "1440 / 859" }}
      >
        {/* 2880×1920 native landscape, 1.5:1 → 1.676:1 frame, cover crops
            a sliver from top/bottom. */}
        <Image
          src="/images/header-bg-alt.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-b from-transparent to-background-brand"
        />

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-20 px-6 pt-6 sm:px-12 sm:pt-10">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <Logo />
            <NavPill className="hidden md:flex" />
            <DownloadCta />
          </div>
        </div>

        {/* golden retriever, Figma footprint left=686/1440=47.6%,
            bottom=(859-603-191)/859=7.6%, w=227/1440=15.8%. Anchored
            from the bottom so it never clips on short viewports. */}
        <div className="absolute left-[47.6%] bottom-[7.6%] z-10 w-[15.8%]">
          <Image
            src="/images/golden-retriever.svg"
            alt=""
            width={227}
            height={191}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* girl, Figma footprint left=1008/1440=70%,
            bottom=(859-373-424)/859=7.2%, w=247/1440=17.2%. Bottom-anchored. */}
        <div className="absolute left-[70%] bottom-[7.2%] z-10 w-[17.2%]">
          <Image
            src="/images/girl-2.svg"
            alt="A person walking their dog"
            width={247}
            height={424}
            priority
            className="h-auto w-full"
          />
        </div>

        {/* headline + store buttons, Figma left=92/1440=6.4%,
            bottom anchor so the CTA never gets pushed below the fold.
            Original Figma top=395/859=46%; with the block ~330px tall
            inside an 859px frame, bottom is ≈15%. */}
        <div className="absolute left-[6.4%] bottom-[15%] z-20 flex flex-col items-start gap-6 sm:gap-8 lg:gap-10">
          <h1
            className="max-w-[612px] text-[32px] leading-tight tracking-tight text-white sm:text-[44px] md:text-[56px] lg:text-[67px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Find places that{" "}
            <em className="font-display italic">actually work</em> for you
            and your pup
          </h1>
          <div className="flex flex-wrap gap-3">
            <StoreButton variant="play" />
            <StoreButton variant="apple" />
          </div>
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
      className="flex h-[59px] w-[178px] items-center gap-2 overflow-hidden rounded-md border border-[#a6a6a6] bg-black px-3 transition-opacity hover:opacity-90"
    >
      <Image
        src={iconSrc}
        alt=""
        width={variant === "play" ? 31 : 30}
        height={36}
        className="h-[30px] w-auto shrink-0"
      />
      <div className="flex min-w-0 flex-col text-white">
        <span className="text-[12px] leading-tight">{eyebrow}</span>
        <span className="truncate text-[20px] font-medium leading-tight tracking-tight">
          {main}
        </span>
      </div>
    </a>
  );
}
