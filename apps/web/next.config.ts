import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  transpilePackages: [
    "@kunda/config",
    "@kunda/db",
    "@kunda/types",
    "@kunda/validators",
  ],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
