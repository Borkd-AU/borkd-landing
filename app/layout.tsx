import type { Metadata, Viewport } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Borkd — Dog-friendly, made certain.",
  description:
    "Think Google Maps, but made for your dog's unique needs. Borkd cuts through the guesswork — so every outing is one you can actually look forward to.",
  metadataBase: new URL("https://www.borkd.app"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body className="bg-background-primary text-content-primary font-sans">
        {children}
      </body>
    </html>
  );
}
