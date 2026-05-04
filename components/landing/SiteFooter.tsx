import Image from "next/image";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full bg-background-brand px-6 py-12 sm:px-12 md:px-[235px]">
      <div className="mx-auto flex max-w-[1205px] flex-col items-center gap-4 border-t border-border-muted pt-12 sm:flex-row sm:justify-between">
        <a
          href="#top"
          aria-label="Borkd"
          className="grid h-12 w-12 place-items-center rounded-full bg-background-accent"
        >
          <Image
            src="/images/illustration/vector6-logo.svg"
            alt=""
            width={26}
            height={22}
            className="h-[22px] w-[26px]"
          />
        </a>
        <p className="text-sm tracking-tight text-content-secondary">
          &copy; {year} Borkd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
