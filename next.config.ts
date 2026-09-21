/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp's native linux binary isn't picked up by Next's file tracing by default,
  // which breaks it at runtime on Vercel (routes that compress report photos).
  outputFileTracingIncludes: {
    "/api/admin/report": ["./node_modules/@img/sharp-linux-x64/**/*", "./node_modules/@img/sharp-libvips-linux-x64/**/*"],
    "/api/cron/monthly-report": ["./node_modules/@img/sharp-linux-x64/**/*", "./node_modules/@img/sharp-libvips-linux-x64/**/*"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.vercel-insights.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.vercel-blob.com https://vercel.com https://www.google-analytics.com",
              "connect-src 'self' https://*.mongodb.net https://api.vercel.com https://*.vercel-insights.com https://*.vercel-blob.com https://vercel.com https://*.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://www.google.com/recaptcha/",
              "frame-src https://challenges.cloudflare.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};
export default nextConfig;
