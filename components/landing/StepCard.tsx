/**
 * Reusable step card used inside StepsSection's horizontal track.
 *
 * Card width is the single source of truth for the focus viewport
 * mask in StepsSection — exported as `STEP_CARD_WIDTH_CLASSES` so the
 * mask and card never drift apart.
 */
export const STEP_CARD_WIDTH_CLASSES =
  "w-[82vw] max-w-[753px] sm:w-[60vw] lg:w-[clamp(280px,30vw,460px)] lg:max-w-[460px]";

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
    <div
      className={`flex shrink-0 flex-col gap-4 ${STEP_CARD_WIDTH_CLASSES}`}
    >
      <span className="inline-flex w-fit items-center justify-center rounded-full bg-background-accent px-4 py-1">
        <span className="font-display text-[20px] tracking-tight text-content-contrast sm:text-[22px]">
          Step {number}
        </span>
      </span>
      <h3 className="font-display italic leading-snug tracking-tight text-content-brand text-[clamp(22px,4.5vw,30px)]">
        {title}
      </h3>
      <p
        className="leading-normal tracking-tight text-content-primary text-[clamp(16px,2.4vw,20px)]"
        style={{ fontVariationSettings: "'opsz' 14" }}
      >
        {body}
      </p>
    </div>
  );
}
