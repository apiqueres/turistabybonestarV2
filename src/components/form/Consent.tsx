import { Fragment } from "react";

const PRIVACY_RE = /(pol[ií]tica de privacidad)/i;

/** Texto de la casilla de consentimiento con «política de privacidad» enlazada (se abre aparte para no perder el formulario). */
export function ConsentLabel({ text }: { text: string }) {
  const parts = text.split(PRIVACY_RE);
  return (
    <>
      {parts.map((part, i) =>
        PRIVACY_RE.test(part) ? (
          <a key={i} href="/privacidad" target="_blank" rel="noopener" className="text-accent underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
