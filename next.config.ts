import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  reactStrictMode: false,
  // Ensure you're using the App Router
  experimental: {
    // Any experimental features you're using
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: 'https://apsqens5mwlzhadv.public.blob.vercel-storage.com/models/:path*',
      },
    ];
  },
};

export default nextConfig;
