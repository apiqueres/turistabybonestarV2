import { asset } from "@/lib/config";

/** Top-left label of each block: small logo + section name (14px). */
export function SectionLabel({ name, tone = "dark" }: { name: string; tone?: "dark" | "light" }) {
  return (
    <div className={`section-label ${tone === "light" ? "on-dark" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(`/brand/logo-${tone === "light" ? "white" : "black"}-96.png`)} alt="" />
      <span>{name}</span>
    </div>
  );
}
