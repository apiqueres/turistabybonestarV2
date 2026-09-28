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
import { countryName } from "./DestinationsStep";
import { STATIC_DEMO } from "@/lib/config";
import { buildPrompt } from "@/lib/prompt";
import { SuccessView } from "./SuccessView";

interface Props {
  content: FormContent;
  destinations: Destination[];
  brand: string;
}

type Status = { kind: "idle" | "sending" | "missing" | "missingDestination" | "error" } | { kind: "done"; id: string; prompt?: string };
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
    if (selection.length || prev.length) next.destinos = Array.from(new Set([...prev, ...selection]));
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
    window.dispatchEvent(new CustomEvent("tb:fly", { detail: n + 1 }));
  };

  const lastStep = step === total - 1;

  const submit = async () => {
    if (!hasDestination(answers)) {
      setStatus({ kind: "missingDestination" });
      return;
    }
    const nombre = String(answers.nombre ?? "").trim();
    const email = String(answers.email ?? "").trim();
    if (nombre.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || answers.privacidad !== true) {
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
      destinos: ids.map((id) => ({ id, nombre: destinations.find((d) => d.id === id)?.name ?? countryName(id) })),
      respuestas,
      contacto: { nombre, email, telefono: String(answers.telefono ?? ""), canal: String(answers.canal ?? ""), privacidad: true as const },
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
        const json = (await res.json()) as { ok: boolean; id?: string };
        if (!res.ok || !json.ok || !json.id) throw new Error("save failed");
        id = json.id;
      }
      removeKey(KEYS.form);
      removeKey(KEYS.selection);
      setStatus({ kind: "done", id, prompt });
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "BUTTON" || tag === "A") return;
      e.preventDefault();
      nextRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (status.kind === "done") return <SuccessView content={content.success} id={status.id} brand={brand} prompt={status.prompt} />;

  const current = steps[step];
  return (
    <div className="wiz">
      <header className="wiz-header">
        <div title={brand}>
          <Brand />
        </div>
        <div className="flex items-center gap-8">
          <span>
            {content.header.stepLabel} {pad(step + 1)} / {pad(total)}
          </span>
          <Link href="/" className="t-muted hover:text-white transition-colors">
            {content.header.exit}
          </Link>
        </div>
      </header>
      <div className="wiz-progress" aria-hidden>
        {steps.map((s, i) => (
          <span key={s.id} className={i <= step ? "is-done" : ""} />
        ))}
      </div>

      <StepView key={current.id} step={current} steps={steps} answers={answers} setAnswer={setAnswer} destinations={destinations} showSummary={lastStep} summary={content.summary} />

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
    </div>
  );
}
