"use client";

import type { Answers, FormContent, FormStep, SetAnswer } from "@/types/form";
import type { Destination } from "@/types/content";
import { QuestionField } from "./QuestionField";
import { Summary } from "./Summary";

interface Props {
  step: FormStep;
  steps: FormStep[];
  answers: Answers;
  setAnswer: SetAnswer;
  destinations: Destination[];
  showSummary: boolean;
  summary: FormContent["summary"];
}

export function StepView({ step, steps, answers, setAnswer, destinations, showSummary, summary }: Props) {
  return (
    <div className="wiz-body wiz-step">
      <div className="grid gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-20">
        <div>
          <div className="kicker">{step.kicker}</div>
          <h2 className="t-h2 mt-5">
            {step.title[0]}
            <br />
            {step.title[1]}
          </h2>
          <p className="t-body mt-6 max-w-[40ch]">{step.text}</p>
          {step.hint && <div className="kicker mt-6">{step.hint}</div>}
          {showSummary && <Summary steps={steps} answers={answers} destinations={destinations} content={summary} />}
        </div>
        <div className="flex flex-col gap-12">
          {step.questions.map((q) => (
            <QuestionField key={q.id} question={q} answers={answers} setAnswer={setAnswer} destinations={destinations} />
          ))}
        </div>
      </div>
    </div>
  );
}
