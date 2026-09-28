import Link from "next/link";
import type { SiteContent } from "@/types/content";
import { Brand } from "./Brand";

interface Props {
  brand: SiteContent["brand"];
  nav: SiteContent["nav"];
  data: SiteContent["footer"];
}

export function Footer({ brand, nav, data }: Props) {
  return (
    <footer data-section className="rule bg-bg">
      <div className="gutter py-16 grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Brand />
          <p className="t-body mt-6">
            {brand.tagline}
            <br />
            {brand.city}.
          </p>
        </div>
        <div>
          <div className="t-small t-muted mb-5">{data.sections}</div>
          <ul className="flex flex-col gap-2">
            {nav.links.map((l) => (
              <li key={l.key}>
                <Link href={l.href} className="hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="t-small t-muted mb-5">{data.contact}</div>
          <ul className="flex flex-col gap-2">
            <li>
              <a href={`mailto:${brand.email}`} className="hover:text-accent transition-colors">
                {brand.email}
              </a>
            </li>
            <li>
              <a href={`tel:${brand.phone.replace(/\s+/g, "")}`} className="hover:text-accent transition-colors">
                {brand.phone}
              </a>
            </li>
            <li>
              <a href={brand.instagram} target="_blank" rel="noreferrer" className="hover:text-accent transition-colors">
                Instagram
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="t-small t-muted mb-5">{data.legal}</div>
          <ul className="flex flex-col gap-2">
            {[...data.legalLinks, data.credits].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-accent transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="t-small t-muted mt-8">
            © {brand.year} {brand.name}
          </div>
        </div>
      </div>
    </footer>
  );
}
