import Image from "next/image";

/**
 * Top-of-page hero — 859px tall on desktop, fluid on mobile.
 * Background photo behind a Borkd logo, nav pill, CTA, hero copy,
 * and the man + jojo illustration with app store buttons.
 */
export function SiteHeader() {
  return (
    <header className="relative isolate w-full overflow-hidden">
      <div className="relative h-[640px] w-full sm:h-[859px]">
        {/* Background — landscape photo */}
        <Image
          src="/images/header-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-bottom"
        />

        {/* Top bar — logo · nav · CTA */}
        <div className="absolute inset-x-0 top-0 z-10 px-6 pt-[40px] sm:px-12 sm:pt-[61px]">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between">
            <Logo />
            <NavPill className="hidden md:flex" />
            <DownloadCta />
          </div>
        </div>

        {/* Hero block — headline · illustration · store buttons */}
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-start px-6 pt-[120px] sm:pt-[143px]">
          <h1
            className="max-w-[978px] text-center font-sans text-[40px] leading-tight tracking-tight text-bark-600 sm:text-[56px] md:text-[67px]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            Find places that{" "}
            <em className="font-display not-italic-fallback italic">
              actually work
            </em>{" "}
            for you and your pup
          </h1>

          <div className="mt-8 sm:mt-[32px]">
            <Image
              src="/images/hero-illustration.png"
              alt="A person walking with their dog jojo"
              width={526}
              height={355}
              priority
              sizes="(max-width: 640px) 320px, 526px"
              className="h-auto w-[320px] sm:w-[420px] md:w-[526px]"
            />
          </div>

          <div className="mt-6 flex gap-3">
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
      className="grid h-[57px] w-[57px] place-items-center rounded-full bg-background-accent"
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
      className={`items-center gap-4 rounded-full bg-background-secondary px-6 py-3 ${className}`}
    >
      <ul className="flex items-center gap-4 text-[20px] tracking-tight text-content-contrast">
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
      className="inline-flex h-[48px] items-center gap-2 rounded-full bg-background-accent px-4 text-[20px] tracking-tight text-content-contrast transition-opacity hover:opacity-90"
    >
      <em className="font-display italic">Download now</em>
    </a>
  );
}

function StoreButton({ variant }: { variant: "play" | "apple" }) {
  if (variant === "play") {
    return (
      <a
        href="#play"
        aria-label="Get it on Google Play"
        className="flex h-[50px] w-[151px] items-center gap-2 overflow-hidden rounded-md border border-[#a6a6a6] bg-black px-2.5"
      >
        <Image
          src="/images/store/playstore-icon.svg"
          alt=""
          width={26}
          height={30}
          className="h-[30px] w-[26px]"
        />
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-[10px] uppercase text-white">
            Get it on
          </span>
          <Image
            src="/images/store/playstore-text.svg"
            alt="Google Play"
            width={93}
            height={19}
            className="h-[19px] w-[93px]"
          />
        </div>
      </a>
    );
  }
  return (
    <a
      href="#apple"
      aria-label="Download on the App Store"
      className="flex h-[50px] w-[151px] items-center gap-2 overflow-hidden rounded-md border border-[#a6a6a6] bg-black px-2.5"
    >
      <Image
        src="/images/store/apple-icon.svg"
        alt=""
        width={25}
        height={30}
        className="h-[30px] w-[25px]"
      />
      <div className="flex flex-col text-white">
        <span className="text-[11px] leading-tight">Download on the</span>
        <span className="text-[20px] font-medium leading-tight tracking-tight">
          App Store
        </span>
      </div>
    </a>
  );
}
