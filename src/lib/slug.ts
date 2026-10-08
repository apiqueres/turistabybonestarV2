/** "Islas griegas" → "islas-griegas": the slug a destination or an offer gets from its name. */
export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
