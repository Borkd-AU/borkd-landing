/**
 * Reusable step card used inside StepsSection's horizontal track.
 * Width is fixed at the Figma value (753px) on desktop so all three cards
 * line up in a single 2420px-wide row that GSAP scrolls horizontally.
 */
export function StepCard({
  number,
  title,
  body,
}: {
  number: 1 | 2 | 3;
  title: string;
  body: string;
}) {
  return (
    <div className="flex w-[88vw] max-w-[753px] shrink-0 flex-col gap-4 md:w-[753px]">
      <span className="inline-flex w-fit items-center justify-center rounded-full bg-background-accent px-4 py-1">
        <span className="font-display text-[22px] tracking-tight text-content-contrast">
          Step {number}
        </span>
      </span>
      <h3
        className="font-display text-[26px] italic leading-snug tracking-tight text-content-brand sm:text-[30px]"
      >
        {title}
      </h3>
      <p
        className="text-[18px] leading-normal tracking-tight text-content-primary sm:text-[20px]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        {body}
      </p>
    </div>
  );
}
