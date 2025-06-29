/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Disable API routes for static export
  ...(process.env.NODE_ENV === 'production' && {
    distDir: 'out',
  }),
};

module.exports = nextConfig;
