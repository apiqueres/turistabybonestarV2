/**
 * Content model of the site (four routes: inicio, mapa, formulario, contacto).
 * Fed today from `src/data/site.ts`; the future admin/backend returns this same shape
 * through `getSiteContent()` in `src/lib/content.ts`.
 */

export interface Media {
  src: string;
  alt: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface NavLink extends Link {
  /** Route path used to mark the active link. */
  key: string;
  /** Highlighted in gold (e.g. Ofertas). */
  accent?: boolean;
}

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

export interface Step {
  number: string;
  title: [string, string];
  text: string;
}

export interface Destination {
  /** ISO 3166-1 numeric code as string; matches the world-atlas country id. */
  id: string;
  slug: string;
  name: string;
  code: string;
  region: string;
  lon: number;
  lat: number;
  tagline: string;
  bestSeason: string;
  duration: string;
  idealFor: string;
  /** Small highlight such as "Viaje estrella" or "Puentes". */
  badge?: string;
  includes: string[];
  image: Media;
  featured?: boolean;
}

export interface Offer {
  id: string;
  title: string;
  /** Destination slug the offer belongs to (for the link to its card). */
  destinationId: string;
  price: string;
  priceNote: string;
  dates: string;
  duration: string;
  text: string;
  includes: string[];
  image: Media;
  badge?: string;
  active: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  stats: [Stat, Stat];
  image: Media;
}

export interface SiteContent {
  brand: {
    name: string;
    tagline: string;
    city: string;
    phone: string;
    whatsapp: string;
    /** Name of the WhatsApp community and, when available, its invite link. */
    communityName: string;
    communityUrl: string;
    email: string;
    hours: string;
    instagram: string;
    year: number;
  };
  nav: {
    links: NavLink[];
    cta: Link;
  };
  home: {
    hero: {
      kicker: string;
      word: string;
      subtitle: [string, string];
      primary: Link;
      secondary: Link;
      video: { mp4: string; poster: string };
    };
    method: { kicker: string; steps: Step[] };
    destinations: { kicker: string; title: [string, string]; link: Link };
    about: {
      kicker: string;
      title: string[];
      meta: string;
      image: Media;
      paragraph: string;
      stats: [Stat, Stat];
      partners: string[];
    };
    dimensions: { kicker: string; text: string; items: { label: string; step: number }[] };
    pain: { kicker: string; statement: [string, string]; items: string[]; answer: string; quote: string; author: string; meta: string };
    team: { title: string; members: TeamMember[] };
    closing: { kicker: string; title: [string, string]; image: Media; primary: Link; secondary: Link };
  };
  map: {
    kicker: string;
    title: string;
    text: string;
    rule: { label: string; hint: [string, string] };
    search: { placeholder: string; hint: string };
    legend: [string, string];
    list: { label: string; empty: string; cta: string; ctaHref: string; needOne: string };
    recurrent: { kicker: string; title: [string, string]; text: string };
    add: string;
    remove: string;
  };
  contact: {
    kicker: string;
    title: string;
    text: string;
    formKicker: string;
    fields: { name: string; email: string; phone: string; message: string; messagePlaceholder: string; privacy: string; submit: string };
    success: { title: string; text: string };
    mapNudge: { text: string; cta: Link };
  };
  footer: {
    sections: string;
    contact: string;
    legal: string;
    legalLinks: Link[];
    credits: Link;
  };
  offers: {
    kicker: string;
    title: [string, string];
    text: string;
    community: { kicker: string; title: string; text: string; cta: string };
    empty: string;
    cta: string;
  };
  destinations: Destination[];
  offersList: Offer[];
}
