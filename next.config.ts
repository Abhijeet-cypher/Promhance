import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // http://promhance.com/* → https://www.promhance.com/*
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'promhance.com' }],
        destination: 'https://www.promhance.com/:path*',
        permanent: true,
      },
      // http://www.promhance.com/* → https://www.promhance.com/*
      {
        source: '/:path*',
        has: [
          { type: 'host', value: 'www.promhance.com' },
          { type: 'header', key: 'x-forwarded-proto', value: 'http' },
        ],
        destination: 'https://www.promhance.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
