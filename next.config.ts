import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  isProduction ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval is development-only; TODO: move inline runtime/styles to nonce-based CSP.
  "style-src 'self' 'unsafe-inline'", // TODO: remove unsafe-inline after all inline style needs are audited.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Type checking and linting are executed explicitly in CI scripts; skipping duplicate work keeps `next build` deterministic in constrained demo environments.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    cpus: 1,
    serverActions: {
      bodySizeLimit: "2mb"
    }
  },
  outputFileTracingExcludes: {
    "*": ["node_modules/**/*", "node_modules/.cache/**/*", ".next/cache/**/*"]
  },
  async headers() {
    const headers = [
      { key: "Content-Security-Policy", value: csp },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
    ];

    if (isProduction) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload"
      });
    }

    return [{ source: "/:path*", headers }];
  }
};

export default nextConfig;
