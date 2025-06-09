/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img-cdn.stationd.blog",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
    ],
  },
  transpilePackages: ["jose"],
  serverExternalPackages: ["bcrypt"],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Enable experimental features
  experimental: {
    // These features are now stable in Next.js 13
    serverActions: {},
  },
  // Add logging for cache debugging
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Middlewares need absolute URLs
  async rewrites() {
    return {
      beforeFiles: [
        // Add redirects as needed
      ],
    };
  },
};

module.exports = nextConfig;
