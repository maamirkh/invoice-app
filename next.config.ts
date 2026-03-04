import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['jsdom', 'canvas'],
};

export default nextConfig;
