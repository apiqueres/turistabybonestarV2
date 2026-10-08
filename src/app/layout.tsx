import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { Loader } from "@/components/motion/Loader";
import { RouteTransition } from "@/components/motion/RouteTransition";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { connection } from "next/server";
import { getSiteContent } from "@/lib/content";
import { STATIC_DEMO } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Editorial serif for headlines and a monospaced face for labels, in the spirit of the brand mark.
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "TuristaByBonestar — Gestión de viajes a medida",
    template: "%s — TuristaByBonestar",
  },
  description:
    "Tú eliges el mundo, nosotros lo ordenamos. Agencia de viajes a medida en Sueca, Valencia: destinos, preferencias y un gestor que monta el viaje entero.",
  openGraph: {
    title: "TuristaByBonestar — Gestión de viajes a medida",
    description: "Tú eliges el mundo, nosotros lo ordenamos.",
    images: ["/media/hero-poster.webp"],
    locale: "es_ES",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Con servidor, las páginas se renderizan por petición (los datos van cacheados por etiqueta
  // en content.ts); en la demo estática de Pages se exportan en el build.
  if (!STATIC_DEMO) await connection();
  const { brand } = await getSiteContent();
  return (
    <html lang="es" className={`${inter.variable} ${serif.variable} ${mono.variable} is-loading`}>
      <body>
        <Loader />
        <RouteTransition />
        {children}
        <WhatsAppFab phone={brand.whatsapp} communityName={brand.communityName} communityUrl={brand.communityUrl} />
        <CookieBanner />
      </body>
    </html>
  );
}
