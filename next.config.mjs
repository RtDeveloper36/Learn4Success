/** @type {import('next').NextConfig} */
// Sub-folder for GitHub Pages project sites (empty for a custom domain, Netlify or localhost).
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? '').replace(/\/$/, '');

const nextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
