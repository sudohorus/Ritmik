import type { NextConfig } from 'next';

const nextConfig: NextConfig & { eslint?: { ignoreDuringBuilds?: boolean } } = {
  reactStrictMode: true,
  devIndicators: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;