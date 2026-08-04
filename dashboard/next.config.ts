import type { NextConfig } from "next";

const devOrigins = ["localhost:3000", "127.0.0.1:3000", "localhost", "127.0.0.1"];
if (process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL);
    const host = url.host; // e.g. "10.10.3.29:3000"
    const hostname = url.hostname; // e.g. "10.10.3.29"
    if (host && !devOrigins.includes(host)) {
      devOrigins.push(host);
    }
    if (hostname && !devOrigins.includes(hostname)) {
      devOrigins.push(hostname);
    }
  } catch (e) {}
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: devOrigins,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

