import { Suspense } from "react";
import type { Metadata } from "next";
import { getFormContent, getSiteContent } from "@/lib/content";
import { Wizard } from "@/components/form/Wizard";

export const metadata: Metadata = { title: "Cómo viajas" };

export default async function FormPage() {
  const [site, form] = await Promise.all([getSiteContent(), getFormContent()]);
  return (
    <Suspense fallback={<div className="wiz" />}>
      <Wizard content={form} destinations={site.destinations} brand={site.brand.name} />
    </Suspense>
  );
}
