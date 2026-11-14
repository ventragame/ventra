import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const isExport = process.env.OUTPUT_EXPORT === 'true' || process.env.CAPACITOR_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  transpilePackages: ['@ventra/shared'],
  // Keep static Capacitor export working; Vercel can optimize images by viewport.
  images: { unoptimized: isExport },
  serverExternalPackages: ['@supabase/supabase-js'],
  // @sherpaw/asr@0.3.0 emits a bare new URL('asr.wasm', import.meta.url).
  // Resolve it to the package's emitted binary for both static Capacitor and
  // ordinary Next.js worker bundling (never enable global async WASM).
  webpack(config) {
    const configDir=dirname(fileURLToPath(import.meta.url));
    config.resolve.alias={
      ...config.resolve.alias,
      'asr.wasm':resolve(configDir,'../../node_modules/@sherpaw/asr/dist/asr.wasm')
    };
    return config;
  },
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

