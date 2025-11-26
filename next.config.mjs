/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Skip API routes during static export (they don't work in static builds anyway)
  async generateBuildId() {
    return 'static-build';
  },
};

export default nextConfig;

