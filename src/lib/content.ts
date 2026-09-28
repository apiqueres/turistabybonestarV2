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

/**
 * Single entry point for page content.
 *
 * When the admin panel + backend exist, replace the bodies of these functions with
 * fetches to the API (e.g. `${process.env.API_URL}/content`) and keep the contracts.
 * Nothing else in the UI needs to change.
 */
export async function getSiteContent(): Promise<SiteContent> {
  return withBasePath(siteContent);
}

export async function getFormContent(): Promise<FormContent> {
  return formContent;
}
