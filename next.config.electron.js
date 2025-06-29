/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // For Electron development, we keep the dev server running
  // Only use static export for production builds
  ...(process.env.ELECTRON_BUILD === 'true' && {
    output: 'export',
    trailingSlash: true,
    distDir: 'out',
  }),
};

module.exports = nextConfig;