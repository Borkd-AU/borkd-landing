import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  // pt-0: the gap above the divider is owned entirely by the
  // WaitlistSection's pb so it matches the gap *above* "Sydney first"
  // (Steps end → title). Adding footer pt on top of that pb made the
  // bottom whitespace ~1.75× the top. pb-12 keeps the page's final
  // breathing room.
  return (
    <footer className="w-full bg-background-brand px-6 pt-0 pb-12 sm:px-12 md:px-[235px]">
      <div className="mx-auto flex max-w-[1205px] flex-col items-center gap-8 border-t border-border-muted pt-12">
        <p className="text-center font-display italic text-content-secondary text-lg sm:text-xl">
          Good places, found.
        </p>

        {/* Footer nav — text links on one row, social icons on another.
            Previously a single flex-wrap row that broke unpredictably on
            iPhone widths (e.g. 17 Pro Max, ~440 CSS px) by orphaning a
            single social icon to its own line. Splitting into two
            semantic groups makes the wrap deterministic across devices
            and gives mobile users a clearer hierarchy: navigation, then
            social. On sm+ the two groups can merge inline. */}
        <nav
          aria-label="Footer"
          className="flex w-full flex-col items-center gap-3 text-sm text-content-secondary sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2"
        >
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:gap-x-6">
            <li>
              <Link href="/about" className="hover:text-content-primary">
                About
              </Link>
            </li>
            <li>
              <Link href="/for-venues" className="hover:text-content-primary">
                For venues
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-content-primary">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-content-primary">
                Terms
              </Link>
            </li>
          </ul>

          <ul className="flex items-center justify-center gap-5 sm:gap-6">
            <li>
              <a
                href="https://www.instagram.com/borkdapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Borkd on Instagram"
                className="inline-flex h-5 w-5 items-center justify-center hover:text-content-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.tiktok.com/@borkdapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Borkd on TikTok"
                className="inline-flex h-5 w-5 items-center justify-center hover:text-content-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005.8 20.1a6.34 6.34 0 0010.86-4.43V8.66a8.16 8.16 0 004.79 1.52V6.69a4.85 4.85 0 01-1.86 0z" />
                </svg>
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/borkdapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Borkd on Facebook"
                className="inline-flex h-5 w-5 items-center justify-center hover:text-content-primary"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link
            href="/"
            aria-label="Borkd home"
            className="grid h-12 w-12 place-items-center rounded-full bg-background-accent transition-opacity hover:opacity-90"
          >
            <Image
              src="/images/illustration/vector6-logo.svg"
              alt=""
              width={26}
              height={22}
              className="h-[22px] w-[26px]"
            />
          </Link>

          <div className="flex flex-col items-center gap-1 text-sm text-content-secondary sm:flex-row sm:gap-4">
            <a
              href="mailto:info@borkd.app"
              className="hover:text-content-primary"
            >
              info@borkd.app
            </a>
            <span className="hidden sm:inline" aria-hidden="true">
              ·
            </span>
            <span>Sydney, AU</span>
          </div>

          <p className="text-sm tracking-tight text-content-secondary">
            &copy; {year} Borkd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
