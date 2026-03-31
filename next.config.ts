/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.vercel-blob.com https://vercel.com https://www.google-analytics.com",
              "connect-src 'self' https://*.mongodb.net https://api.vercel.com https://*.vercel-insights.com https://*.vercel-blob.com https://vercel.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net",
              "frame-src https://challenges.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
export default nextConfig;
