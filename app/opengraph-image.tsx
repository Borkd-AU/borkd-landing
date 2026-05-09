import { ImageResponse } from "next/og";

// Holding OG image — solid Zoomies brand background with "Borkd" wordmark
// and the canonical sign-off. Satori (next/og) doesn't have access to
// system fonts; without an explicit fonts buffer it uses its bundled
// default. We rely on that default rather than naming Georgia/etc and
// risking a silent fallback. A brand-tuned static PNG (Instrument Serif)
// is a follow-up.

export const alt = "Borkd — Good places, found.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#3A39FF",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            fontSize: 168,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          Borkd
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 40,
            fontStyle: "italic",
            opacity: 0.92,
            letterSpacing: "-0.01em",
          }}
        >
          Good places, found.
        </div>
      </div>
    ),
    size
  );
}
