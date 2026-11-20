export function clampProgress(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function heroProgress(scrollY: number, top: number, height: number, viewport: number, isSticky: boolean) {
  if (!isSticky) {
    return clampProgress((scrollY - top) / 220);
  }
  const travel = Math.max(1, height - viewport);
  return clampProgress((scrollY - top) / travel);
}

export function heroZipperFrame(value: number) {
  const progress = clampProgress(value);
  const unzip = clampProgress((progress - 0.12) / 0.34);
  const unwrap = clampProgress((progress - 0.44) / 0.34);
  const ribbonHandoff = clampProgress((progress - 0.72) / 0.28);
  const cueOpacity = clampProgress(1 - progress / 0.06);

  return {
    progress,
    unzip,
    unwrap,
    ribbonHandoff,
    cueOpacity,
    sliderY: 6 + unzip * 86,
    flapRotateLeft: unwrap * -76,
    flapRotateRight: unwrap * 76,
    flapShiftX: unwrap * 160,
    logoOpacity: clampProgress((unwrap - 0.05) / 0.65),
    logoScale: 0.92 + unwrap * 0.08,
    logoY: (1 - unwrap) * 16,
  };
}

export function sceneProgress(scrollY: number, top: number, height: number, viewport: number) {
  return clampProgress((scrollY + viewport * .8 - top) / (height + viewport * .6));
}

export function stickyProgress(scrollY: number, top: number, height: number, viewport: number) {
  return clampProgress((scrollY - top + 88) / Math.max(1, height - viewport + 88));
}

export function loomIntroFrame(value: number) {
  const progress = clampProgress(value);
  const phase = (from: number, to: number) => clampProgress((progress - from) / (to - from));
  const handoff = phase(.9, 1);
  return {
    progress,
    machine: phase(.035, .19),
    feed: phase(.045, .31),
    weave: phase(.31, .76),
    release: phase(.78, .88),
    approach: phase(.8, .96) ** 1.65,
    handoff,
    cue: 1 - phase(.025, .15),
  };
}
