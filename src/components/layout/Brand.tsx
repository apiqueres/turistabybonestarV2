import { asset } from "@/lib/config";
import Link from "next/link";

interface Props {
  /** "dark" = black mark for light backgrounds (default); "light" = white mark for dark images. */
  tone?: "dark" | "light";
  href?: string | null;
  className?: string;
}

/**
 * Emblem (globe, plane and camera) + the lettering cropped from the logo ("TURISTA by Bonestar's Bistro").
 * The full logo lives in the loader, the veil and the emails.
 */
export function Brand({ tone = "dark", href = "/", className = "" }: Props) {
  const variant = tone === "light" ? "dark" : "light";
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-mark" src={asset(`/brand/logo-mark-${variant}-192.png`)} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand-word" src={asset(`/brand/logo-word-${variant}-384.png`)} alt={href === null ? "Turista by Bonestar's Bistro" : ""} />
    </>
  );
  const cls = `brand ${tone === "light" ? "on-dark" : ""} ${className}`;
  if (href === null) return <div className={cls}>{inner}</div>;
  return (
    <Link href={href} className={cls} aria-label="TuristaByBonestar, inicio">
      {inner}
    </Link>
  );
}
