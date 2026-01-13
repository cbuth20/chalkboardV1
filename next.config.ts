import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Disable ESLint error overlay in development
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors blocking builds
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
