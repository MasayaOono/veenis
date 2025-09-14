/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ビルド中（Vercel含む）は ESLint エラーを無視して続行
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;

export default nextConfig;
