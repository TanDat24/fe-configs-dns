import type { NextConfig } from "next";

/**
 * Khi mở `next dev` qua tunnel (ngrok, Cloudflare Quick Tunnel, …), trình duyệt có
 * origin là host tunnel, không phải localhost. Từ Next.js 15+, các request tới
 * `/_next/*` (kể cả WebSocket HMR) bị chặn nếu host đó không nằm trong allowlist.
 *
 * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
 */
const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.loca.lt",
    "*.localtunnel.me",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
