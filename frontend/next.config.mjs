/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // API rewrites — resolves to backend container hostname in Docker, overridden by Caddy in production
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:5001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
