import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img-cdn.stationd.blog",
      },
    ],
  },
  transpilePackages: ["jose"],
};

export default nextConfig;
