const isExport = process.env.OUTPUT_EXPORT === 'true' || process.env.CAPACITOR_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ['@ventra/shared'],
  // Keep static Capacitor export working; Vercel can optimize images by viewport.
  images: { unoptimized: isExport },
  serverExternalPackages: ['@supabase/supabase-js'],
  ...(isExport ? { output: 'export', trailingSlash: true } : {}),
  async headers() {
    if (isExport) return [];
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

