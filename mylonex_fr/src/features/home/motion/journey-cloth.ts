import type { JourneyBox } from "./journey-geometry";

type ClothSurface = {
  from: number;
  to: number;
  phase: number;
  ripple: number;
  opacity: number;
};

export function paintCloth(
  ctx: CanvasRenderingContext2D, image: HTMLImageElement, box: JourneyBox, surface: ClothSurface,
) {
  if (!image.naturalWidth || surface.opacity <= 0) return;
  const { x, y, width, height } = box;
  const { from, to, phase, ripple, opacity } = surface;
  // Sample the left selvedge and crop the second selvedge from the source photograph.
  const sourceWidth = image.naturalWidth * .974;
  const sourceY = image.naturalHeight * from;
  const sourceHeight = image.naturalHeight * (to - from);
  ctx.save();
  ctx.globalAlpha = opacity;
  if (ripple < .05) {
    ctx.drawImage(image, 0, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    ctx.restore();
    return;
  }

  const strips = Math.ceil(width / 4);
  const step = width / strips;
  const surfaceY = (u: number, v: number) => {
    const wave = Math.sin(u * 8.2 - phase + v * .7);
    const curl = ((u - .5) * 2) ** 4 * Math.cos(phase + u * 4.4);
    return ripple * (wave * (.66 + v * .27) + curl * (v - .3));
  };

  // Each narrow strip follows the projected surface and carries the same UVs as the flat cloth.
  // Fractional overlap closes raster seams between adjacent, slightly sheared strips.
  for (let strip = 0; strip < strips; strip++) {
    const u = strip / strips;
    const nextU = (strip + 1) / strips;
    const top = surfaceY(u, from);
    const bottom = surfaceY(u, to);
    const slope = (surfaceY(nextU, from) - top) / step;
    const stripWidth = Math.min(step + .65, width - strip * step);
    const shade = Math.cos((u + nextU) * 4.1 - phase + (from + to) * .35);
    ctx.save();
    ctx.transform(1, slope, 0, (height + bottom - top) / height, x + strip * step, y + top);
    ctx.drawImage(image, u * sourceWidth, sourceY, stripWidth / width * sourceWidth, sourceHeight,
      0, 0, stripWidth, height);
    ctx.globalAlpha = opacity * Math.abs(shade) * Math.min(.17, ripple * .012);
    ctx.fillStyle = shade > 0 ? "#c7d9ff" : "#050d28";
    ctx.fillRect(0, 0, step, height);
    ctx.restore();
  }

  ctx.strokeStyle = "#a5dc9f70";
  ctx.lineWidth = .7;
  ctx.setLineDash([2, 3]);
  for (const [edge, v] of [[3, from], [height - 3, to]]) {
    ctx.beginPath();
    for (let strip = 0; strip <= strips; strip++) {
      const u = strip / strips;
      ctx.lineTo(x + 3 + u * (width - 6), y + edge + surfaceY(u, v));
    }
    ctx.stroke();
  }
  ctx.restore();
}
