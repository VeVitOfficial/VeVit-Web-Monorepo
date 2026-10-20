import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // "credentialless" (ne "require-corp"): dovolí SharedArrayBuffer pro
  // ffmpeg.wasm média nástroje (Fáze 1, bod 6 zadání), bez CORP hlaviček
  // nerozbije Cloudflare Turnstile ani Google Fonts, které dnes fungují bez nich.
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // Stripe.js and wallets (docs.stripe.com/security/guide); GoPay and Packeta are added in later phases.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com https://*.js.stripe.com https://pay.google.com",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co https://api.pwnedpasswords.com https://challenges.cloudflare.com https://api.stripe.com https://*.js.stripe.com https://pay.google.com https://google.com/pay",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "frame-src 'self' blob: https://challenges.cloudflare.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://pay.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests"
    ].join("; ")
  }
];

// Payment pages differ from the global policy: Stripe's Google Pay popup needs window.opener (COOP)
// and its frames are not COEP-tagged. Card fields live only on these pages.
const paymentPageHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none" },
  { key: "Cache-Control", value: "no-store" }
];

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [];
try {
  if (process.env.SUPABASE_URL) {
    const url = new URL(process.env.SUPABASE_URL);
    remotePatterns.push({ protocol: "https", hostname: url.hostname, pathname: "/storage/v1/object/public/**" });
  }
} catch {
  // Invalid deployment configuration is reported by the runtime health route.
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/:locale(cs|en|de|es|uk|fr|sk)?/store/checkout/platba", headers: paymentPageHeaders },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/tools/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/edu/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  }
};

export default nextConfig;
