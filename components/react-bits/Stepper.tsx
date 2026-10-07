"use client";
// Adapted from React Bits Stepper, commit 2ec034e. See LICENSE.md / PROVENANCE.md.
import { useId, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

export interface DemoStep { title: string; description: string; content: ReactNode }
export default function Stepper({ steps }: { steps: DemoStep[] }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pointerAction, setPointerAction] = useState(false);
  const reduce = useReducedMotion();
  const id = useId();
  const step = steps[currentStep];
  const updateStep = (next: number, detail: number) => { setPointerAction(detail > 0); setDirection(next > currentStep ? 1 : -1); setCurrentStep(Math.max(0, Math.min(steps.length - 1, next))); };
  return <div className="gr-stepper" data-react-bits="Stepper">
    <ol className="gr-step-list" aria-label="앱 사용 과정">
      {steps.map((item, index) => <li key={item.title}>
        <button type="button" aria-current={currentStep === index ? "step" : undefined} aria-controls={id} onClick={event => updateStep(index, event.detail)}>
          <span className="gr-step-number">{String(index + 1).padStart(2, "0")}</span><span>{item.title}</span>
        </button>
      </li>)}
    </ol>
    <div className="gr-step-body" id={id}>
      <div className="gr-step-explanation">
        <h3>{step.title}</h3><p>{step.description}</p>
        <div className="gr-step-controls">
          <button type="button" className="gr-icon-button" disabled={currentStep === 0} onClick={event => updateStep(currentStep - 1, event.detail)} aria-label="이전 단계"><ArrowLeft size={18} /></button>
          <button type="button" className="gr-button gr-button-dark" onClick={event => updateStep(currentStep === steps.length - 1 ? 0 : currentStep + 1, event.detail)}>
            {currentStep === steps.length - 1 ? <>다시 보기 <RotateCcw size={16} /></> : <>다음 단계 <ArrowRight size={16} /></>}
          </button>
        </div>
        <span className="gr-sr-only" role="status">{currentStep + 1} / {steps.length}단계: {step.title}</span>
      </div>
      <div className="gr-step-stage">
          <motion.div key={currentStep} initial={reduce || !pointerAction ? false : { transform: `translateX(${direction * 8}px)` }} animate={{ transform: "translateX(0px)" }} transition={{ duration: reduce || !pointerAction ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}>
            {step.content}
          </motion.div>
      </div>
    </div>
    <noscript><ol>{steps.map(item => <li key={item.title}><strong>{item.title}</strong><p>{item.description}</p></li>)}</ol></noscript>
  </div>;
}
