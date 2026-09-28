import { getSiteContent } from "@/lib/content";
import { SiteShell } from "@/components/layout/SiteShell";
import { Hero } from "@/components/sections/Hero";
import { Method } from "@/components/sections/Method";
import { DestinationsGrid } from "@/components/sections/DestinationsGrid";
import { About } from "@/components/sections/About";
import { Dimensions } from "@/components/sections/Dimensions";
import { Table } from "@/components/sections/Table";
import { Team } from "@/components/sections/Team";
import { Closing } from "@/components/sections/Closing";

export default async function Home() {
  const content = await getSiteContent();
  const { home } = content;

  return (
    <SiteShell>
      <Hero data={home.hero} />
      <Method data={home.method} />
      <DestinationsGrid data={home.destinations} items={content.destinations} />
      <About data={home.about} />
      <Dimensions data={home.dimensions} />
      <Table data={home.table} />
      <Team data={home.team} />
      <Closing data={home.closing} />
    </SiteShell>
  );
}
