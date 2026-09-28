import type { Answers, FormContent, FormStep } from "@/types/form";
import type { Destination } from "@/types/content";
import { countryName } from "./DestinationsStep";

interface Props {
  steps: FormStep[];
  answers: Answers;
  destinations: Destination[];
  content: FormContent["summary"];
}

/** Compact recap of everything answered so far, shown next to the last step. */
export function Summary({ steps, answers, destinations, content }: Props) {
  const rows: [string, string][] = [];
  const sel = Array.isArray(answers.destinos) ? (answers.destinos as string[]) : [];
  const names = sel.map((id) => destinations.find((d) => d.id === id)?.name ?? countryName(id));
  if (names.length) rows.push(["Ubicaciones", names.join(", ")]);

  for (const step of steps.slice(1, -1)) {
    for (const q of step.questions) {
      const v = answers[q.id];
      if (v === undefined || v === "" || (Array.isArray(v) && !v.length)) continue;
      const label = ("label" in q && q.label) || step.kicker.replace(/^\d+\s—\s/, "");
      let text: string;
      if (q.kind === "multi" && Array.isArray(v)) text = v.map((id) => q.options.find((o) => o.id === id)?.label ?? id).join(", ");
      else if (q.kind === "single" && typeof v === "string") text = q.options.find((o) => o.id === v)?.label ?? v;
      else if (typeof v === "boolean") text = v ? "Sí" : "No";
      else text = String(v);
      rows.push([label, text]);
    }
  }

  return (
    <div className="rule mt-10 pt-8">
      <div className="kicker mb-5 text-white">{content.title}</div>
      {rows.length === 0 ? (
        <div className="t-small t-muted">{content.empty}</div>
      ) : (
        <dl className="summary">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
