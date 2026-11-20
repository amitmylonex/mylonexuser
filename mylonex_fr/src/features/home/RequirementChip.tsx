import { useEffect, useState } from "react";
import "./styles/ai-sourcing.css";

type RequirementChipProps = {
  label: string;
  value: string;
  delay: number;
  triggerAnimation: boolean;
};

export default function RequirementChip({ label, value, delay, triggerAnimation }: RequirementChipProps) {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (triggerAnimation) {
      const timer = setTimeout(() => {
        setAnimateIn(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [triggerAnimation, delay]);

  return (
    <div className={`requirement-chip flex flex-col items-start gap-1 cursor-default ${animateIn ? "animate-in" : ""}`}>
      <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}
