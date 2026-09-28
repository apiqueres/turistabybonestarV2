import type { ReactNode } from "react";
import { Brand } from "./Brand";

/** Minimal dark layout for the legal pages linked from the footer. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen gutter py-24">
      <div className="mb-16">
        <Brand />
      </div>
      <h1 className="t-h2 mb-10">{title}</h1>
      <div className="t-body max-w-[64ch] flex flex-col gap-6">{children}</div>
    </main>
  );
}
