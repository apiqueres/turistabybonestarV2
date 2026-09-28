import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { SiteShell } from "@/components/layout/SiteShell";
import { MapExperience } from "@/components/map/MapExperience";

export const metadata: Metadata = { title: "¿Dónde nos vamos?" };

export default async function MapPage() {
  const content = await getSiteContent();
  return (
    <SiteShell>
      <Suspense fallback={<div className="section" />}>
        <MapExperience content={content.map} destinations={content.destinations} />
      </Suspense>
    </SiteShell>
  );
}
