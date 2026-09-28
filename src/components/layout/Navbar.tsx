"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Link as LinkT, NavLink } from "@/types/content";
import { Close, Menu } from "@/components/ui/icons";
import { Brand } from "./Brand";

interface Props {
  brand: string;
  links: NavLink[];
  cta: LinkT;
}

export function Navbar({ brand, links, cta }: Props) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const isActive = (key: string) => (key === "/" ? pathname === "/" : pathname.startsWith(key));
  // Already on the target route: scroll to the top instead of doing nothing.
  const scrollIfSame = (href: string) => (e: React.MouseEvent) => {
    if (pathname === href) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`nav ${scrolled ? "is-scrolled" : ""}`}>
        <div className="nav-logo" title={brand}>
          <Brand />
        </div>
        <nav className="nav-links" aria-label="Principal">
          {links.map((l) => (
            <Link key={l.key} href={l.href} className={`nav-link ${isActive(l.key) ? "is-active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        {pathname === "/" && (
          <div className="nav-cta">
            <Link href={cta.href} className="btn btn-primary btn-sm" onClick={scrollIfSame(cta.href)}>
              {cta.label}
            </Link>
          </div>
        )}
        <button
          className="nav-burger"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <Close width={22} height={22} /> : <Menu width={22} height={22} />}
        </button>
      </header>
      <div className={`nav-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        {links.map((l) => (
          <Link key={l.key} href={l.href} onClick={() => setOpen(false)} className={isActive(l.key) ? "text-accent" : ""}>
            {l.label}
          </Link>
        ))}
        {pathname === "/" && (
          <Link href={cta.href} onClick={() => setOpen(false)} className="btn btn-primary self-start mt-4">
            {cta.label}
          </Link>
        )}
      </div>
    </>
  );
}
