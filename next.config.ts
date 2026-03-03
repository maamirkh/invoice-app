import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3', 'jsdom', 'canvas'],
};

export default nextConfig;
