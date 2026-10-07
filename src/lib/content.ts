import type { SiteContent } from "@/types/content";
import type { FormContent } from "@/types/form";
import { siteContent } from "@/data/site";
import { formContent } from "@/data/form";
import { BASE_PATH } from "./config";

/** Deep-copies `value` prefixing every "/media/…" or "/brand/…" string with the base path (GitHub Pages). */
function withBasePath<T>(value: T): T {
  if (!BASE_PATH) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return /^\/(media|brand)\//.test(v) ? BASE_PATH + v : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
    return v;
  };
  return walk(value) as T;
}

/** Etiqueta de caché de todo el contenido editable; el admin la invalida al guardar. */
export const CONTENT_TAG = "content";

const hasDatabase = () => Boolean(process.env.DATABASE_URL);

/**
 * Lee de la base de datos y fusiona sobre los estáticos (así un bloque que falte
 * o un despliegue sin migrar nunca deja la web sin contenido). Cacheado por etiqueta.
 */
async function loadFromDatabase(): Promise<{ site: SiteContent; form: FormContent }> {
  const [{ unstable_cache }, { listDestinations }, { listOffers }, { getFormSteps }, { getSettings }] = await Promise.all([
    import("next/cache"),
    import("./repo/destinos"),
    import("./repo/ofertas"),
    import("./repo/form"),
    import("./repo/settings"),
  ]);
  const cached = unstable_cache(
    async () => {
      const [destinations, offersList, steps, settings] = await Promise.all([listDestinations(), listOffers(), getFormSteps(), getSettings()]);
      const home = { ...siteContent.home };
      const site: SiteContent = { ...siteContent, home, destinations, offersList };
      for (const [key, data] of Object.entries(settings)) {
        if (data == null) continue;
        if (key.startsWith("home.")) (home as unknown as Record<string, unknown>)[key.slice(5)] = data;
        else (site as unknown as Record<string, unknown>)[key] = data;
      }
      const form: FormContent = steps ? { ...formContent, steps } : formContent;
      return { site, form };
    },
    ["site-content"],
    { tags: [CONTENT_TAG], revalidate: 600 },
  );
  return cached();
}

/**
 * Single entry point for page content. Sin DATABASE_URL (demo en Pages, desarrollo sin BD)
 * devuelve los estáticos de src/data; con ella, lo que haya editado el admin.
 */
export async function getSiteContent(): Promise<SiteContent> {
  if (!hasDatabase()) return withBasePath(siteContent);
  try {
    return withBasePath((await loadFromDatabase()).site);
  } catch (err) {
    console.error("[content] no se pudo leer la base de datos; se usan los estáticos", err);
    return withBasePath(siteContent);
  }
}

export async function getFormContent(): Promise<FormContent> {
  if (!hasDatabase()) return formContent;
  try {
    return (await loadFromDatabase()).form;
  } catch (err) {
    console.error("[content] no se pudo leer la base de datos; se usan los estáticos", err);
    return formContent;
  }
}
