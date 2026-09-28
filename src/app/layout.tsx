import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Loader } from "@/components/motion/Loader";
import { PlaneTransition } from "@/components/motion/PlaneTransition";
import { RouteTransition } from "@/components/motion/RouteTransition";

const inter = Inter({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-inter",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} is-loading`}>
      <body>
        <Loader />
        <PlaneTransition />
        <RouteTransition />
        {children}
      </body>
    </html>
  );
}
