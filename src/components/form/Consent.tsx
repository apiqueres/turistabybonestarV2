import { Fragment } from "react";

const PRIVACY_RE = /(pol[ií]tica de privacidad)/i;

/** Texto de la casilla de consentimiento con «política de privacidad» enlazada (se abre aparte para no perder el formulario). */
export function ConsentLabel({ text }: { text: string }) {
  const parts = text.split(PRIVACY_RE);
  return (
    <>
      {parts.map((part, i) =>
        PRIVACY_RE.test(part) ? (
          <a key={i} href="/privacidad" target="_blank" rel="noopener" className="underline">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Capa informativa básica (art. 11 LOPDGDD) que acompaña a la casilla de consentimiento. */
export function ConsentInfo({ purpose }: { purpose: string }) {
  return (
    <p className="t-small t-muted mt-3 max-w-[60ch]">
      Responsable: CAMELOTSUECA, S.L. (TuristaByBonestar). Finalidad: {purpose}. Derechos: acceso, rectificación, supresión y
      los demás que recoge la{" "}
      <a href="/privacidad" target="_blank" rel="noopener" className="underline">
        política de privacidad
      </a>
      , escribiendo a contacto@turistabybonestar.com.
    </p>
  );
}
