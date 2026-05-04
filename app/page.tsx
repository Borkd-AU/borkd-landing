/**
 * Public landing page — borkd.app
 *
 * Implementation in progress. Designs in Figma:
 *   https://www.figma.com/design/P5N6692rAq190n9d9MzVwu
 *     /Design-playground?node-id=137-2757
 *
 * The internal design-token reference lives at /design-system.
 */

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-3 text-xs uppercase tracking-wider text-content-tertiary">
        Borkd
      </p>
      <h1 className="text-5xl tracking-tight sm:text-7xl">
        Something good is{" "}
        <em className="font-display text-content-accent">coming</em>.
      </h1>
      <p className="mt-6 max-w-md text-lg text-content-secondary">
        Find places that actually work for you and your pup.
      </p>
    </main>
  );
}
