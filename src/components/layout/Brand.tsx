import { asset } from "@/lib/config";
import Link from "next/link";

interface Props {
  /** "dark" = black mark for light backgrounds (default); "light" = white mark for dark images. */
  tone?: "dark" | "light";
  href?: string | null;
  className?: string;
  /** Logo completo (emblema con la palabra TURISTA integrada) en vez de emblema + texto. */
  full?: boolean;
}

/**
 * Emblem (globe, plane and camera) + the lettering cropped from the logo ("TURISTA by Bonestar's Bistro").
 * The full logo lives in the loader, the veil and the emails.
 */
export function Brand({ tone = "dark", href = "/", className = "", full = false }: Props) {
  const variant = tone === "light" ? "dark" : "light";
  const inner = full ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset(`/brand/logo-full-${variant}-512.png`)} alt="Turista by Bonestar" />
  ) : (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-mark" src={asset(`/brand/logo-mark-${variant}-192.png`)} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-word" src={asset(`/brand/logo-word-${variant}-384.png`)} alt={href === null ? "Turista by Bonestar's Bistro" : ""} />
    </>
  );
  const cls = `brand ${full ? "brand-full" : ""} ${tone === "light" ? "on-dark" : ""} ${className}`;
  if (href === null) return <div className={cls}>{inner}</div>;
  return (
    <Link href={href} className={cls} aria-label="TuristaByBonestar, inicio">
      {inner}
    </Link>
  );
}
