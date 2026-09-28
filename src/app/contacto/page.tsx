import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { SiteShell } from "@/components/layout/SiteShell";
import { SectionLabel } from "@/components/layout/SectionLabel";
import { ContactForm } from "@/components/contact/ContactForm";
import { ArrowRight } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const { contact, brand } = await getSiteContent();
  const rows: [string, string, string?][] = [
    ["Correo", brand.email, `mailto:${brand.email}`],
    ["Teléfono", brand.phone, `tel:${brand.phone.replace(/\s+/g, "")}`],
    ["WhatsApp", brand.whatsapp, `https://wa.me/${brand.whatsapp.replace(/\D/g, "")}`],
    ["Dónde estamos", brand.city],
    ["Horario", brand.hours],
  ];

  return (
    <SiteShell>
      <section data-section className="section">
        <SectionLabel name="Contacto" />
        <div className="section-inner gutter cols-2">
          <div className="md:pr-16">
            <div className="kicker">{contact.kicker}</div>
            <h1 className="t-hero mt-6" style={{ fontSize: "clamp(64px, 9vw, 140px)" }}>
              {contact.title}
            </h1>
            <p className="t-body mt-8 max-w-[44ch] text-[17px]">{contact.text}</p>
            <dl className="rule mt-12">
              {rows.map(([k, v, href]) => (
                <div key={k} className="rule-b py-4 flex justify-between gap-6 t-small">
                  <dt className="kicker">{k}</dt>
                  <dd className="text-right">{href ? <a href={href} className="hover:text-accent transition-colors">{v}</a> : v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="md:pl-16 pt-12 md:pt-0">
            <ContactForm content={contact} />
          </div>
        </div>
      </section>
      <section data-section className="section section--short section--alt">
        <div className="gutter py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <p className="t-lines" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
            {contact.mapNudge.text}
          </p>
          <Link href={contact.mapNudge.cta.href} className="btn btn-primary btn-sm">
            {contact.mapNudge.cta.label}
            <ArrowRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
