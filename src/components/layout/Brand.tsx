import { asset } from "@/lib/config";
import Link from "next/link";

interface Props {
  /** "dark" = black mark for light backgrounds (default); "light" = white mark for dark images. */
  tone?: "dark" | "light";
  href?: string | null;
  className?: string;
}

/** Logo + wordmark "TURISTA by BONESTAR". */
export function Brand({ tone = "dark", href = "/", className = "" }: Props) {
  const inner = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset(`/brand/logo-${tone === "light" ? "white" : "black"}-512.png`)} alt="" />
      <span className="brand-name">
        Turista<span>by</span>Bonestar
      </span>
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
