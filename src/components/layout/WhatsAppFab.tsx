"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface Props {
  phone: string;
  communityName: string;
  /** Invite link of the WhatsApp community. Empty → ask to join via a message to the agency. */
  communityUrl: string;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 1.8a8.2 8.2 0 0 1 0 16.4 8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 0 1 12 3.8zm-3.3 4.4c-.2 0-.5 0-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.2 5 4.4 2.5 1 3 .8 3.5.7.5 0 1.7-.7 2-1.4.2-.7.2-1.2.1-1.3-.1-.2-.3-.2-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.3.2-.6.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4 0-.5.3-.9l.5-.7c.1-.2.1-.4 0-.6l-.9-2.3c-.2-.6-.5-.5-.7-.5z" />
  </svg>
);

/** Floating WhatsApp button: opens two options, the agency chat and the private community. */
export function WhatsAppFab({ phone, communityName, communityUrl }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const digits = phone.replace(/\D/g, "");
  const chat = `https://wa.me/${digits}?text=${encodeURIComponent("Hola, me gustaría organizar un viaje con vosotros.")}`;
  const community = communityUrl || `https://wa.me/${digits}?text=${encodeURIComponent(`Hola, quiero unirme a la comunidad «${communityName}».`)}`;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className={`wa ${open ? "is-open" : ""}`}>
      <div className="wa-menu" role="menu" aria-hidden={!open}>
        <a className="wa-item" role="menuitem" href={chat} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          <span className="wa-item-title">Escribir a la agencia</span>
          <span className="wa-item-sub">{phone}</span>
        </a>
        <a className="wa-item" role="menuitem" href={community} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
          <span className="wa-item-title">Abrir la comunidad</span>
          <span className="wa-item-sub">{communityName}</span>
        </a>
      </div>
      <button type="button" className="wa-btn" aria-expanded={open} aria-label={open ? "Cerrar WhatsApp" : "Contactar por WhatsApp"} onClick={() => setOpen((v) => !v)}>
        <WhatsAppIcon />
      </button>
    </div>
  );
}
