import Image from "next/image";
import Link from "next/link";

/**
 * Two hero variants from the Figma file. Both use the same shared parts
 * (logo, nav, CTA, store buttons) but with different background +
 * character composition. Switch by importing whichever you want from
 * `app/page.tsx`.
 *
 *   SiteHeader        — Figma node 134:5659 (sky + field, man + jojo)
 *   SiteHeaderAlt     — Figma node 157:271  (autumn forest, girl + retriever)
 *
 * The top bar (logo + nav + Download CTA) is rendered separately as
 * `FloatingTopBar` so it stays pinned to the top of the viewport on
 * scroll instead of disappearing with the hero.
 */

export function FloatingTopBar() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-12 sm:pt-10">
      <div className="pointer-events-auto mx-auto flex max-w-[1440px] items-center justify-between gap-3 sm:gap-4">
        <Logo />
        <NavMenuMobile className="md:hidden" />
        <NavPill className="hidden md:flex" />
        <DownloadCta />
      </div>
    </div>
  );
}

const navItems: Array<{ label: string; href: string; external?: boolean }> = [
  { label: "home", href: "/" },
  { label: "about", href: "/about" },
  { label: "for venues", href: "/for-venues" },
  { label: "contact", href: "mailto:info@borkd.app", external: true },
];

export function SiteHeader() {
  // Figma "Website / header image" (134:5659).
  //   Layer 1: header-bg.jpg (sky + field, 1732×2879 portrait)
  //   Layer 2: HTML controls (logo, nav pill, CTA)
  //   Layer 3: HTML headline (centered, dark)
  //   Layer 4: hero-illustration.png (man + jojo)
  //   Layer 5: HTML store buttons
  return (
    <header className="relative isolate w-full overflow-hidden bg-background-brand">
      <div className="relative h-[100svh] min-h-[640px] w-full lg:h-auto lg:min-h-0 lg:max-h-[100svh] lg:[aspect-ratio:1440/859]">
        {/* On mobile/tablet the source PNG is portrait so `cover` fits
            naturally without horizontal stretch. On desktop the Figma
            frame is landscape, so the portrait source is stretched (fill)
            to preserve the original wide low-horizon look. */}
        <Image
          src="/images/header-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-center lg:object-fill lg:object-bottom"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-b from-transparent to-background-brand lg:h-[18%]"
        />

        {/* Headline (centred) */}
        <div className="absolute inset-x-4 top-[10%] z-10 flex justify-center sm:inset-x-8 sm:top-[12%] lg:inset-x-0 lg:top-[14%] lg:px-6">
          <h1
            className="max-w-[978px] text-center leading-tight tracking-tight text-bark-600 text-[clamp(28px,7vw,48px)] lg:text-[clamp(48px,5vw,67px)]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Find places that{" "}
            <em className="font-display italic">actually work</em> for you
            and your pup
          </h1>
        </div>

        {/* Man + jojo illustration. Mobile/tablet sits roughly mid-stage. */}
        <div className="absolute inset-x-0 top-[38%] z-10 flex justify-center px-6 sm:top-[40%] lg:top-[42%]">
          <Image
            src="/images/hero-illustration.png"
            alt="A person walking with their dog jojo"
            width={526}
            height={355}
            priority
            sizes="(max-width: 640px) 260px, (max-width: 1024px) 420px, 526px"
            className="h-auto w-[clamp(220px,55vw,360px)] lg:w-[clamp(360px,40vw,526px)]"
          />
        </div>

        {/* Store buttons */}
        <div className="absolute inset-x-0 bottom-[8%] z-10 flex flex-col items-center px-6 lg:bottom-[6%]">
          <div className="flex flex-wrap justify-center gap-3">
            <StoreButton variant="play" />
            <StoreButton variant="apple" />
          </div>
          <p className="mt-4 text-center text-sm text-content-secondary sm:text-base">
            Not in stores yet. We&rsquo;re starting in Sydney —{" "}
            <a
              href="#waitlist"
              className="underline underline-offset-4 hover:text-content-primary"
            >
              get on the waitlist
            </a>
            .
          </p>
        </div>
      </div>
    </header>
  );
}

export function SiteHeaderAlt() {
  // Figma "Website / header image - alternative" (157:271).
  //   Layer 1: header-bg-alt.png (autumn forest, 1440×859 — Steph's
  //            colour-graded export from Figma, layer download)
  //   Layer 2: HTML controls (logo, nav pill, CTA)
  //   Layer 3: headline + store buttons (left-aligned, white)
  //   Layer 4: golden-retriever.svg (centre-bottom)
  //   Layer 5: girl-2.svg (right-bottom)
  // Two layouts share one DOM:
  //   • Mobile (<sm): 100svh portrait stage. Headline centred at the top,
  //     characters anchored bottom-left/bottom-right at ~38% / ~46% of
  //     the viewport so they read at a usable size on a 390px screen.
  //   • Desktop (≥sm): the original Figma 1440×859 frame, expressed as
  //     percentage coordinates so it scales fluidly. Capped to 100svh
  //     so bottom-anchored elements never clip on shorter viewports.
  return (
    <header className="relative isolate w-full overflow-hidden bg-background-brand">
      <div className="relative mx-auto h-[100svh] min-h-[640px] w-full lg:h-auto lg:min-h-0 lg:max-h-[100svh] lg:[aspect-ratio:1440/859]">
        {/* 1440×859 native landscape (Steph's graded export), cover
            crops to fit. */}
        <Image
          src="/images/header-bg-alt.png"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
        />

        {/* Golden retriever.
            Mobile/tablet: width tracks viewport but height capped to 22vh
            so the dog never grows tall enough to crowd the headline on a
            short landscape viewport (e.g. 768×600).
            Desktop (Figma ≥lg): left 47.6%, bottom 7.6%, w 15.8%. */}
        <div className="absolute left-[6%] bottom-[6%] z-10 max-h-[22vh] w-[38%] max-w-[260px] lg:left-[47.6%] lg:bottom-[7.6%] lg:max-h-none lg:w-[15.8%] lg:max-w-none">
          <Image
            src="/images/golden-retriever.svg"
            alt=""
            width={227}
            height={191}
            priority
            className="h-full w-full object-contain object-bottom lg:h-auto"
          />
        </div>

        {/* Girl.
            Mobile/tablet: max-h-[40vh] so the figure stays in the lower
            half of a short viewport instead of pushing past the headline.
            Desktop (Figma ≥lg): left 70%, bottom 7.2%, w 17.2%. */}
        <div className="absolute right-[2%] bottom-[5%] z-10 max-h-[40vh] w-[46%] max-w-[300px] lg:left-[70%] lg:right-auto lg:bottom-[7.2%] lg:max-h-none lg:w-[17.2%] lg:max-w-none">
          <Image
            src="/images/girl-2.svg"
            alt="A person walking their dog"
            width={247}
            height={424}
            priority
            className="h-full w-full object-contain object-bottom lg:h-auto"
          />
        </div>

        {/* Headline + store buttons.
            Mobile/tablet: pinned to the top half (after the floating top
            bar) with extra top padding so it never overlaps with the
            characters in the bottom half on short viewports. Headline
            uses clamp() so it scales smoothly with viewport width.
            Desktop (Figma ≥lg): left 6.4%, bottom-anchored ~15%. */}
        <div className="absolute inset-x-4 top-[14%] z-20 flex flex-col items-center gap-4 text-center sm:inset-x-8 sm:top-[16%] sm:gap-6 lg:inset-x-auto lg:left-[6.4%] lg:top-auto lg:bottom-[15%] lg:items-start lg:gap-10 lg:text-left">
          <h1
            className="max-w-[612px] leading-tight tracking-tight text-white text-[clamp(28px,7vw,44px)] lg:text-[clamp(44px,5vw,67px)]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Find places that{" "}
            <em className="font-display italic">actually work</em> for you
            and your pup
          </h1>
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <StoreButton variant="play" />
              <StoreButton variant="apple" />
            </div>
            <p className="text-center text-sm text-white/85 sm:text-base lg:text-left">
              Not in stores yet. We&rsquo;re starting in Sydney —{" "}
              <a
                href="#waitlist"
                className="underline underline-offset-4 hover:text-white"
              >
                get on the waitlist
              </a>
              .
            </p>
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
      className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-background-accent shadow-md transition-opacity hover:opacity-90 sm:h-[57px] sm:w-[57px]"
    >
      <Image
        src="/images/illustration/vector6-logo.svg"
        alt=""
        width={30}
        height={26}
        className="h-[20px] w-[23px] sm:h-[26px] sm:w-[30px]"
      />
    </a>
  );
}

function NavPill({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Primary"
      className={`items-center rounded-full bg-black/30 px-6 py-3 backdrop-blur-sm ${className}`}
    >
      <ul className="flex items-center gap-6 text-[18px] tracking-tight text-white">
        {navItems.map(({ label, href, external }) =>
          external ? (
            <li key={label}>
              <a
                href={href}
                className="transition-opacity hover:opacity-80"
              >
                {label}
              </a>
            </li>
          ) : (
            <li key={label}>
              <Link
                href={href}
                className="transition-opacity hover:opacity-80"
              >
                {label}
              </Link>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}

/**
 * Mobile hamburger menu. Uses native <details>/<summary> so the toggle
 * works without converting this file to a client component for one
 * piece of trivial state. The panel is absolute-positioned so opening
 * it doesn't shift the layout. Closes naturally when the user taps a
 * link (because the navigation re-renders the page).
 */
function NavMenuMobile({ className = "" }: { className?: string }) {
  return (
    <details className={`group relative ${className}`}>
      <summary
        aria-label="Open menu"
        className="grid h-[44px] w-[44px] cursor-pointer list-none place-items-center rounded-full bg-black/30 text-white shadow-md backdrop-blur-sm transition-opacity hover:opacity-90 [&::-webkit-details-marker]:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="group-open:hidden"
        >
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className="hidden group-open:block"
        >
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      </summary>
      <nav
        aria-label="Primary"
        className="absolute left-1/2 top-full mt-2 min-w-[200px] -translate-x-1/2 rounded-2xl bg-black/85 p-3 shadow-lg backdrop-blur-md"
      >
        <ul className="flex flex-col gap-1 text-[16px] tracking-tight text-white">
          {navItems.map(({ label, href, external }) =>
            external ? (
              <li key={label}>
                <a
                  href={href}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-white/10"
                >
                  {label}
                </a>
              </li>
            ) : (
              <li key={label}>
                <Link
                  href={href}
                  className="block rounded-md px-3 py-2 transition-colors hover:bg-white/10"
                >
                  {label}
                </Link>
              </li>
            )
          )}
        </ul>
      </nav>
    </details>
  );
}

function DownloadCta() {
  return (
    <Link
      href="/#waitlist"
      className="inline-flex h-[40px] shrink-0 items-center rounded-full bg-background-accent px-4 text-content-contrast shadow-md transition-opacity hover:opacity-90 sm:h-[48px] sm:px-5"
    >
      <em className="font-display text-[16px] italic tracking-tight sm:text-[20px]">
        <span className="sm:hidden">Join</span>
        <span className="hidden sm:inline">Join waitlist</span>
      </em>
    </Link>
  );
}

function StoreButton({
  variant,
  disabled = true,
}: {
  variant: "play" | "apple";
  disabled?: boolean;
}) {
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

  const baseClasses =
    "flex h-[59px] w-[178px] items-center gap-2 overflow-hidden rounded-md border border-[#a6a6a6] bg-black px-3";

  const inner = (
    <>
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
    </>
  );

  if (disabled) {
    // Decorative placeholder — the caption underneath ("Not in stores yet…")
    // is the real interactive surface, so we hide this from AT entirely.
    return (
      <div
        aria-hidden="true"
        className={`${baseClasses} cursor-not-allowed select-none opacity-60`}
      >
        {inner}
      </div>
    );
  }

  return (
    <a
      href={href}
      aria-label={aria}
      className={`${baseClasses} transition-opacity hover:opacity-90`}
    >
      {inner}
    </a>
  );
}
