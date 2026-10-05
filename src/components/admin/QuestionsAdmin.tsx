"use client";

import { Fragment, useState } from "react";
import { useFormSteps } from "@/lib/admin/data";
import { StepEditor, KIND } from "./StepEditor";
import { Pager, paginate } from "./Pager";

/** Wizard steps as a paginated table; each row opens its editor inline. */
export function QuestionsAdmin() {
  const { steps, save, reset, dirty, hydrated } = useFormSteps();
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const { rows, current } = paginate(steps, page);

  if (!hydrated) return null;
  return (
    <>
      <div className="admin-head">
        <div>
          <div className="kicker">Administración</div>
          <h1 className="t-h2 mt-2">Preguntas</h1>
        </div>
        <div className="flex gap-3 items-center">
          {msg && <span className="form-status">{msg}</span>}
          {dirty && <button type="button" className="btn btn-secondary btn-sm" onClick={() => { reset(); setMsg("Restablecidas las preguntas originales."); }}>Restablecer</button>}
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>Paso</th><th>Título</th><th>Preguntas</th><th>Tipos</th><th>Opciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const index = steps.indexOf(s);
              const isOpen = s.id === openId;
              const kinds = Array.from(new Set(s.questions.map((q) => KIND[q.kind]))).join(", ");
              const options = s.questions.reduce((n, q) => n + (q.kind === "multi" || q.kind === "single" ? q.options.length : 0), 0);
              return (
                <Fragment key={s.id}>
                  <tr className={`is-clickable ${isOpen ? "is-open" : ""}`} onClick={() => setOpenId(isOpen ? null : s.id)} aria-expanded={isOpen}>
                    <td className="kicker">{String(index + 1).padStart(2, "0")}</td>
                    <td>
                      <div>{s.title.join(" ")}</div>
                      <div className="t-muted">{s.kicker}</div>
                    </td>
                    <td>{s.questions.length}</td>
                    <td>{kinds}</td>
                    <td>{options || "—"}</td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={5}>
                        <StepEditor step={s} onChange={(next) => save(steps.map((x) => (x.id === s.id ? next : x)))} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        <Pager total={steps.length} page={current} onPage={(p) => { setPage(p); setOpenId(null); }} />
      </div>
    </>
  );
}
