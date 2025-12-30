import type { NextConfig } from 'next';

const nextConfig: NextConfig & { eslint?: { ignoreDuringBuilds?: boolean } } = {
  reactStrictMode: true,
  devIndicators: false,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'buffer/': 'buffer',
    };
    return config;
  },
  experimental: {
    // @ts-expect-error
    turbo: {
      resolveAlias: {
        'buffer/': 'buffer',
      },
    },
  },
};

export default nextConfig;