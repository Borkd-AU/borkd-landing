import Image from "next/image";

/**
 * Section 2 — Cream background with an Instagram-post composite on the
 * left and a quote + supporting paragraph on the right.
 */
export function QuoteSection() {
  return (
    <section
      id="about"
      className="relative w-full bg-background-brand px-6 py-16 sm:px-12 md:py-20 lg:px-[235px] lg:py-[80px]"
    >
      <div className="mx-auto flex max-w-[1205px] flex-col items-center gap-12 lg:flex-row lg:gap-[80px]">
        {/* Instagram post composite */}
        <div className="relative aspect-[516/833] w-full max-w-[420px] shrink-0 overflow-hidden rounded-2xl bg-cloud-500 sm:max-w-[460px] lg:max-w-[516px]">
          <Image
            src="/images/instagram-post.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 516px"
            className="object-cover"
          />
          <div className="absolute bottom-[5%] left-[8%] w-[58%]">
            <Image
              src="/images/girl-at-cafe.svg"
              alt="A woman at a café with her dog"
              width={297}
              height={315}
              sizes="(max-width: 768px) 50vw, 297px"
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Quote + body */}
        <div className="flex flex-col items-start gap-4">
          <p
            className="leading-tight tracking-tight text-content-brand text-[clamp(24px,5vw,40px)]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            <em className="font-display italic">
              &ldquo;Dog-friendly&rdquo;
            </em>{" "}
            shouldn&rsquo;t be a gamble.
          </p>
          <p
            className="leading-normal tracking-tight text-content-primary text-[clamp(16px,2.4vw,20px)]"
            style={{ fontVariationSettings: "'opsz' 14" }}
          >
            A water bowl by the back door isn&rsquo;t the same as truly
            welcome. Borkd cuts through the guesswork — so every outing is
            one you can actually look forward to.
          </p>
        </div>
      </div>
    </section>
  );
}
