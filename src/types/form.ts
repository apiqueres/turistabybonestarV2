/** Declarative schema of the "Cómo viajas" wizard. Answers are keyed by question id. */

export interface Option {
  id: string;
  label: string;
  text?: string;
}

export type Question =
  | { id: string; kind: "multi"; label?: string; max?: number; layout: "cards" | "chips"; options: Option[] }
  | { id: string; kind: "single"; label?: string; layout: "cards" | "chips"; options: Option[] }
  | { id: string; kind: "text"; label: string; placeholder?: string; multiline?: boolean; inputType?: "text" | "email" | "tel"; required?: boolean }
  | { id: string; kind: "date"; label: string }
  | { id: string; kind: "number"; label: string; min: number; max: number }
  | { id: string; kind: "toggle"; label: string; required?: boolean }
  | { id: string; kind: "destinations" };

export interface FormStep {
  id: string;
  kicker: string;
  title: [string, string];
  text: string;
  hint?: string;
  questions: Question[];
}

export type AnswerValue = string | string[] | number | boolean;
export type Answers = Record<string, AnswerValue>;
export type SetAnswerInput = AnswerValue | undefined | ((prev: AnswerValue | undefined) => AnswerValue | undefined);
export type SetAnswer = (id: string, input: SetAnswerInput) => void;

export interface FormContent {
  header: { stepLabel: string; exit: string };
  nav: { back: string; backToMap: string; next: string; enterHint: string; missing: string; missingDestination: string; submit: string };
  steps: FormStep[];
  summary: { title: string; empty: string };
  success: { kicker: string; title: [string, string]; text: string; reference: string; home: Link; map: Link };
  error: string;
}

interface Link {
  label: string;
  href: string;
}
