import type { NextConfig } from "next";

// DEPLOY_TARGET=pages → static export for GitHub Pages (no API routes, forms in demo mode).
// Otherwise → standalone server for the VPS (Docker).
const isPages = process.env.DEPLOY_TARGET === "pages";
const isDev = process.env.NODE_ENV === "development";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Política de seguridad de contenido básica: la web solo carga recursos propios, salvo los
// enlaces/consultas a WhatsApp y al buscador de lugares (Nominatim). En desarrollo Next necesita eval.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://nominatim.openstreetmap.org https://wa.me https://chat.whatsapp.com",
  "frame-src 'self' blob: about:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  output: isPages ? "export" : "standalone",
  basePath: basePath || undefined,
  trailingSlash: isPages,
  images: isPages ? { unoptimized: true } : { formats: ["image/avif", "image/webp"] },
  // Imágenes subidas desde el admin: en el VPS las sirve Nginx (alias /uploads/); sin Nginx
  // (desarrollo, Docker solo) las sirve el Route Handler /api/uploads/*.
  rewrites: isPages ? undefined : async () => [{ source: "/uploads/:path*", destination: "/api/uploads/:path*" }],
  headers: isPages
    ? undefined
    : async () => [
        { source: "/(.*)", headers: securityHeaders },
        // El panel nunca se incrusta en otra página.
        { source: "/admin/:path*", headers: [{ key: "X-Frame-Options", value: "DENY" }, { key: "Content-Security-Policy", value: `${csp}; frame-ancestors 'none'` }] },
      ],
};

export default nextConfig;
