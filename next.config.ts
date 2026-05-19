import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow `quality={90}` on next/image — Next 16 only ships the
    // default 75 unless explicitly opted-in.
    qualities: [75, 90],
    // Serve the hero (and every other image) as AVIF/WebP. AVIF first —
    // it's ~20-30% smaller than WebP for these photographic backdrops —
    // with WebP as the fallback for browsers that don't take AVIF.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
