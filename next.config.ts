import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Preserve links already stored in Neon or legacy catalog data.
    return [
      {
        source: "/media/hero-services.jpg",
        destination: "/media/services/hero-services.jpg",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;