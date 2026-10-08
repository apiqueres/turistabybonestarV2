import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content";
import { Navbar } from "./Navbar";
import { PromoBar } from "./PromoBar";
import { Footer } from "./Footer";

/** Navbar + main + footer used by every route except the full-screen wizard. */
export async function SiteShell({ children }: { children: ReactNode }) {
  const content = await getSiteContent();
  return (
    <>
      <Navbar brand={content.brand.name} links={content.nav.links} cta={content.nav.cta} />
      <PromoBar offer={content.promo} />
      <main>{children}</main>
      <Footer brand={content.brand} nav={content.nav} data={content.footer} />
    </>
  );
}
