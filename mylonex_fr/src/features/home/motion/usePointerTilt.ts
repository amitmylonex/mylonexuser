import { useEffect, useRef, type PointerEvent } from "react";

/** Event-driven tilt: no render loop, and never active for touch or reduced motion. */
export function usePointerTilt<T extends HTMLElement>(degrees = 2) {
  const ref = useRef<T>(null);
  const enabled = useRef(false);

  const reset = () => {
    ref.current?.style.removeProperty("transform");
  };

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => {
      enabled.current = query.matches;
      if (!query.matches) ref.current?.style.removeProperty("transform");
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const onPointerMove = (event: PointerEvent<T>) => {
    if (!enabled.current || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    ref.current.style.transform = `perspective(1200px) rotateX(${-y * degrees}deg) rotateY(${x * degrees}deg)`;
  };

  return { ref, onPointerMove, onPointerLeave: reset, onPointerCancel: reset };
}
