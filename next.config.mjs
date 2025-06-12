/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  async rewrites() {
    return [
      {
        source: '/reset-password/confirm/auth/confirm', // The problematic path
        destination: '/reset-password/confirm',          // The correct page Next.js should serve
      },
      // You can add other rewrites here if needed
    ];
  },

  // Ensure experimental.serverActions is true if you are using Server Actions
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3001'],
      bodySizeLimit: '2mb'
    },
  },
};

export default nextConfig;
