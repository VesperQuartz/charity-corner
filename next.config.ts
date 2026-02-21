import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pos", // Your new index path
        permanent: true, // Use true for 301 redirect, false for 302
      },
    ];
  },
  output: "standalone",
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  serverExternalPackages: ["pino", "pino-pretty", "hono-pino/debug-log"],
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
    authInterrupts: true,
    typedEnv: true,
    optimizeCss: true,
  },
  reactCompiler: true,
  allowedDevOrigins: ["mrlectus.local"],
  cacheComponents: true,
};

export default nextConfig;
