"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Answers, AnswerValue, FormContent, SetAnswerInput } from "@/types/form";
import type { Destination } from "@/types/content";
import { KEYS, readJSON, removeKey, usePersistedState, writeJSON } from "@/lib/storage";
import { ArrowRight } from "@/components/ui/icons";
import { Brand } from "@/components/layout/Brand";
import { StepView } from "./StepView";
import { placeLabel } from "@/lib/geo/places";
import { STATIC_DEMO } from "@/lib/config";
import { buildPrompt } from "@/lib/prompt";
import type { EmailBrand } from "@/lib/email-shell";
import { clientConfirmationEmail } from "@/lib/email-templates";
import { emailJsConfigured, sendDemoMail } from "@/lib/email";
import { SuccessView } from "./SuccessView";

interface Props {
  content: FormContent;
  destinations: Destination[];
  brand: EmailBrand;
}

type Status = { kind: "idle" | "sending" | "missing" | "missingDestination" | "error" } | { kind: "done"; id: string; prompt?: string; payload: SolicitudPayload };
type SolicitudPayload = { destinos: { id: string; nombre: string }[]; respuestas: Answers; contacto: { nombre: string; email: string; telefono: string; canal: string; privacidad: true } };
const PROCESSING_MS = 2000;
const delay = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const CONTACT_KEYS = ["nombre", "email", "telefono", "canal", "privacidad"];
const hasDestination = (a: Answers) => Array.isArray(a.destinos) && a.destinos.length > 0;
const pad = (n: number) => String(n).padStart(2, "0");
const EMPTY: Answers = {};

/** Full-screen multi-step form. Answers persist in localStorage until they are sent. */
export function Wizard({ content, destinations, brand }: Props) {
  const params = useSearchParams();
  const steps = content.steps;
  const total = steps.length;
  const initial = Math.min(Math.max(Number(params.get("paso")) || 0, 0), total - 1);

  const [step, setStep] = useState(initial);
  const [answers, setAnswers, hydrated] = usePersistedState<Answers>(KEYS.form, EMPTY);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Once hydrated, merge the map selection into the stored answers, one time.
  const merged = useRef(false);
  useEffect(() => {
    if (!hydrated || merged.current) return;
    merged.current = true;
    const saved = readJSON<Answers>(KEYS.form, EMPTY);
    const selection = readJSON<string[]>(KEYS.selection, []);
    const next: Answers = { ...saved };
    const prev = Array.isArray(saved.destinos) ? (saved.destinos as string[]) : [];
    // One destination: the map choice wins over an older stored answer.
    if (selection.length || prev.length) next.destinos = (selection.length ? selection : prev).slice(0, 1);
    delete next.indeciso;
    writeJSON(KEYS.form, next);
  }, [hydrated, params]);

  // Keep the map list in sync when destinations are edited here.
  useEffect(() => {
    if (hydrated && merged.current) writeJSON(KEYS.selection, Array.isArray(answers.destinos) ? answers.destinos : []);
  }, [answers.destinos, hydrated]);

  const setAnswer = useCallback((id: string, input: SetAnswerInput) => {
    setAnswers((a: Answers) => {
      const next = { ...a };
      const value = typeof input === "function" ? input(a[id]) : input;
      const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
      if (empty) delete next[id];
      else next[id] = value as AnswerValue;
      return next;
    });
  }, [setAnswers]);

  const goTo = (n: number) => {
    setStep(n);
    setStatus({ kind: "idle" });
    window.scrollTo({ top: 0 });
  };

  const lastStep = step === total - 1;

  const submit = async () => {
    if (!hasDestination(answers)) {
      setStatus({ kind: "missingDestination" });
      return;
    }
    const nombre = String(answers.nombre ?? "").trim();
    const email = String(answers.email ?? "").trim();
    const telefono = String(answers.telefono ?? "").trim();
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || telefono.length < 6 || answers.privacidad !== true) {
      setStatus({ kind: "missing" });
      return;
    }
    setStatus({ kind: "sending" });
    const respuestas: Answers = {};
    for (const [k, v] of Object.entries(answers)) {
      if (!CONTACT_KEYS.includes(k) && k !== "destinos" && k !== "indeciso") respuestas[k] = v;
    }
    const ids = Array.isArray(answers.destinos) ? (answers.destinos as string[]) : [];
    const payload = {
      destinos: ids.map((id) => ({ id, nombre: destinations.find((d) => d.id === id)?.name ?? placeLabel(id) })),
      respuestas,
      contacto: { nombre, email, telefono, canal: "", privacidad: true as const },
    };
    // Plane "processing" screen for at least PROCESSING_MS while the request is sent.
    window.dispatchEvent(new CustomEvent("tb:veil", { detail: { hold: PROCESSING_MS } }));
    try {
      let id: string;
      let prompt: string | undefined;
      if (STATIC_DEMO) {
        // GitHub Pages demo: nothing leaves the browser; keep a local copy and offer the brief for download.
        const now = new Date();
        id = `demo_${now.toISOString().replace(/[:.]/g, "-")}`;
        prompt = buildPrompt(id, now.toISOString(), payload);
        const list = readJSON<unknown[]>("tb:demo-solicitudes", []);
        writeJSON("tb:demo-solicitudes", [...list, { id, createdAt: now.toISOString(), data: payload, prompt }]);
        await delay(PROCESSING_MS);
      } else {
        const [res] = await Promise.all([
          fetch("/api/solicitudes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }),
          delay(PROCESSING_MS),
        ]);
        const json = (await res.json()) as { ok: boolean; id?: string; prompt?: string };
        if (!res.ok || !json.ok || !json.id) throw new Error("save failed");
        id = json.id;
        prompt = json.prompt;
      }
      removeKey(KEYS.form);
      removeKey(KEYS.selection);
      removeKey(KEYS.places);
      // Branded confirmation to the client, from the browser, when EmailJS is configured.
      if (emailJsConfigured) {
        const mail = clientConfirmationEmail(id, payload, brand);
        sendDemoMail({ to: email, subject: mail.subject, text: mail.text, html: mail.html, replyTo: brand.email, fromName: brand.name }).catch(() => {});
      }
      setStatus({ kind: "done", id, prompt, payload });
      window.scrollTo({ top: 0 });
    } catch {
      setStatus({ kind: "error" });
    }
  };

  const next = () => {
    if (step === 0 && !hasDestination(answers)) {
      setStatus({ kind: "missingDestination" });
      return;
    }
    if (lastStep) void submit();
    else goTo(step + 1);
  };
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  useEffect(() => {
    if (steps.length === 1) return; // single-screen form: Enter never submits by accident
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
      e.preventDefault();
      nextRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  if (status.kind === "done") return <SuccessView content={content.success} id={status.id} brand={brand} prompt={status.prompt} payload={status.payload} demo={STATIC_DEMO} />;

  const current = steps[step];
  const destinoId = Array.isArray(answers.destinos) ? (answers.destinos as string[])[0] : undefined;
  const destinoLabel = destinoId ? (destinations.find((d) => d.id === destinoId)?.name ?? placeLabel(destinoId)) : "";
  // The destination is chosen on the map, never asked here: without one, send the visitor there first.
  const gate = hydrated && !destinoId;
  return (
    <div className="wiz">
      <header className="wiz-header">
        <div title={brand.name}>
          <Brand />
        </div>
        <div className="flex items-center gap-8">
          {total > 1 && (
            <span>
              {content.header.stepLabel} {pad(step + 1)} / {pad(total)}
            </span>
          )}
          <Link href="/" className="t-muted hover:text-white transition-colors">
            {content.header.exit}
          </Link>
        </div>
      </header>
      {total > 1 && (
        <div className="wiz-progress" aria-hidden>
          {steps.map((s, i) => (
            <span key={s.id} className={i <= step ? "is-done" : ""} />
          ))}
        </div>
      )}

      {gate ? (
        <div className="wiz-body wiz-gate">
          <div className="kicker">Antes de nada</div>
          <h2 className="t-h2 mt-5">
            ¿A dónde
            <br />
            nos vamos?
          </h2>
          <p className="t-body mt-6 max-w-[40ch]">Elige primero el destino en el mapa. Después volvemos aquí para contarte cómo lo montamos.</p>
          <Link href="/donde-nos-vamos" className="btn btn-primary btn-sm mt-8 self-start">
            Elegir el destino
            <ArrowRight className="btn-icon" />
          </Link>
        </div>
      ) : (
        <>
          {step === 0 && destinoId && (
            <div className="wiz-dest">
              <span className="kicker">Tu destino</span>
              <span className="wiz-dest-name">{destinoLabel}</span>
              <Link href="/donde-nos-vamos" className="link-arrow">
                Cambiarlo en el mapa
                <ArrowRight />
              </Link>
            </div>
          )}
          <StepView key={current.id} step={current} steps={steps} answers={answers} setAnswer={setAnswer} destinations={destinations} showSummary={lastStep && steps.length > 1} summary={content.summary} />
        </>
      )}

      {!gate && (
      <footer className="wiz-footer">
        {step === 0 ? (
          <Link href="/donde-nos-vamos" className="t-muted hover:text-white transition-colors">
            {content.nav.backToMap}
          </Link>
        ) : (
          <button type="button" onClick={() => goTo(step - 1)} className="t-muted hover:text-white transition-colors">
            {content.nav.back}
          </button>
        )}
        <div className="flex items-center gap-6 flex-wrap">
          {status.kind === "missing" && <span className="form-status normal-case tracking-normal">{content.nav.missing}</span>}
          {status.kind === "missingDestination" && <span className="form-status normal-case tracking-normal">{content.nav.missingDestination}</span>}
          {status.kind === "error" && <span className="form-status normal-case tracking-normal">{content.error}</span>}
          <span className="t-muted hidden md:inline">{content.nav.enterHint}</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={next} disabled={status.kind === "sending"}>
            {lastStep ? content.nav.submit : content.nav.next}
            <ArrowRight className="btn-icon" />
          </button>
        </div>
      </footer>
      )}
    </div>
  );
}
