import type { ReactNode } from "react";
import { useIntersectionObserver } from "./useIntersectionObserver";

interface FadeInProps {
  children: ReactNode;
  delay?: "none" | "100" | "200" | "300";
  direction?: "up" | "none";
  className?: string;
  triggerOnce?: boolean;
}

export default function FadeIn({
  children,
  delay = "none",
  direction = "up",
  className = "",
  triggerOnce = true,
}: FadeInProps) {
  const [ref, isInView] = useIntersectionObserver({ triggerOnce, threshold: 0.15 });

  const delayClass = delay !== "none" ? `motion-delay-${delay}` : "";
  const directionClass = direction === "up" ? "motion-slide-up" : "";

  return (
    <div
      ref={ref as any}
      data-in-view={isInView}
      className={`motion-fade-in ${directionClass} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
