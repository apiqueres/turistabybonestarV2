import type { NextConfig } from "next";

// DEPLOY_TARGET=pages → static export for GitHub Pages (no API routes, forms in demo mode).
// Otherwise → standalone server for the VPS (Docker).
const isPages = process.env.DEPLOY_TARGET === "pages";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  basePath: basePath || undefined,
  trailingSlash: isPages,
  images: isPages ? { unoptimized: true } : { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
