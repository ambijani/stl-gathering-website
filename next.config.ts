/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.vercel-insights.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob:;
              connect-src 'self' https://*.mongodb.net https://api.vercel.com https://*.vercel-insights.com;
              frame-src https://challenges.cloudflare.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\n/g, ""),
          },
        ],
      },
    ];
  },
};
export default nextConfig;
