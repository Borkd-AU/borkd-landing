import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow `quality={90}` on next/image — Next 16 only ships the
    // default 75 unless explicitly opted-in.
    qualities: [75, 90],
  },
};

export default nextConfig;
