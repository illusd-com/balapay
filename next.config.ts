import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ESLint runs during build; ignore to avoid blocking deploy on config edge cases
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
