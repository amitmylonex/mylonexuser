import { clampProgress } from "./scroll-state";

export function journeyProgress(scrollY: number, start: number, end: number) {
  return clampProgress((scrollY - start) / Math.max(1, end - start));
}

function ramp(value: number, start: number, end: number) {
  return clampProgress((value - start) / (end - start));
}

function ease(value: number, start: number, end: number) {
  const t = ramp(value, start, end);
  return t * t * (3 - 2 * t);
}

const arrivals = [[.55, .63], [.71, .79], [.86, .94]] as const;

export function journeyFrame(value: number) {
  const progress = clampProgress(value);
  const pieces = arrivals.map(([start, end]) => ({
    travel: ease(progress, start, end),
    reveal: ease(progress, end - .022, end),
  }));
  return {
    progress,
    warp: ramp(progress, 0, .16),
    weft: ramp(progress, .02, .16),
    weave: ramp(progress, .115, .265),
    threads: 1 - .91 * ease(progress, .275, .35),
    cloth: ease(progress, .275, .335),
    ripple: ease(progress, .29, .37),
    phase: (progress - .29) * 52,
    drop: ease(progress, .385, .445),
    split: ease(progress, .46, .505),
    pieces,
    stage: pieces.reduce((active, piece, index) => piece.reveal >= .98 ? index : active, -1),
  };
}
