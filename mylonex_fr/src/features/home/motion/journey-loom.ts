import { clampProgress } from "./scroll-state";
import { mix, type JourneyBox } from "./journey-geometry";
import type { journeyFrame } from "./journey-state";

const warpCount = 29;
const weftCount = 19;
const yarn = ["#9ab5ec", "#628ee4", "#b9caeb", "#6e9ad9"];
const warpColor = (column: number) => column < 2 ? "#88d16e" : yarn[column % yarn.length];
const weftColor = (row: number) => yarn[(row + 1) % yarn.length];

function line(ctx: CanvasRenderingContext2D, x: number, y: number, toX: number, toY: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function feed(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  toX: number, toY: number, amount: number, vertical: boolean,
) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let step = 1; step <= 18; step++) {
    const t = amount * step / 18;
    const curve = t * t * (3 - 2 * t);
    ctx.lineTo(mix(x, toX, vertical ? curve : t), mix(y, toY, vertical ? t : curve));
  }
  ctx.stroke();
}

export function paintLoom(
  ctx: CanvasRenderingContext2D, box: JourneyBox, stageWidth: number, stageHeight: number,
  frame: ReturnType<typeof journeyFrame>,
) {
  const { x, y, width, height } = box;
  const dx = width / (warpCount - 1);
  const dy = height / (weftCount - 1);
  const weight = Math.min(dx, dy);
  const warpDepth = (column: number) => clampProgress((frame.warp - .64 - (column % 5) * .014) / .30);
  const weftDepth = (row: number) => clampProgress((frame.weave - row * .32 / (weftCount - 1)) / .68);
  ctx.save();
  ctx.lineCap = "round";

  for (let column = 0; column < warpCount; column++) {
    const endX = x + dx * column;
    const fraction = column / (warpCount - 1);
    const entrance = clampProgress(frame.warp / .64 - (column % 5) * .02);
    ctx.strokeStyle = warpColor(column);
    ctx.lineWidth = column < 2 ? 1 : .75;
    ctx.globalAlpha = .46 * frame.threads;
    if (entrance > 0) feed(ctx, stageWidth * mix(.04, .98, fraction), 0, endX, y, entrance, true);
    ctx.lineWidth = Math.max(.85, weight * .19);
    if (warpDepth(column) > 0) line(ctx, endX, y, endX, y + height * warpDepth(column));
  }

  for (let row = 0; row < weftCount; row++) {
    const endY = y + dy * row;
    const entrance = clampProgress(frame.weft * 1.65 - (row % 4) * .028);
    ctx.strokeStyle = weftColor(row);
    ctx.lineWidth = .8;
    ctx.globalAlpha = .56 * frame.threads;
    if (entrance > 0) feed(ctx, 0, stageHeight * mix(.04, .86, row / (weftCount - 1)), x, endY, entrance, false);
    ctx.lineWidth = Math.max(.85, weight * .2);
    if (weftDepth(row) > 0) line(ctx, x, endY, x + width * weftDepth(row), endY);
  }

  // Give the upper yarn a shadow on the lower one. The parity changes in both axes.
  for (let row = 0; row < weftCount; row++) {
    const endY = y + dy * row;
    const reachedX = width * weftDepth(row);
    for (let column = 0; column < warpCount && dx * column < reachedX; column++) {
      const endX = x + dx * column;
      const reachedY = height * warpDepth(column);
      if (dy * row >= reachedY) continue;

      const weftOver = (row + column) % 2 === 0;
      const half = (weftOver ? dx : dy) * .38;
      const remaining = weftOver ? reachedX - dx * column : reachedY - dy * row;
      const tail = Math.min(half, remaining);
      const segment = () => {
        if (weftOver) line(ctx, Math.max(x, endX - half), endY, endX + tail, endY);
        else line(ctx, endX, Math.max(y, endY - half), endX, endY + tail);
      };
      ctx.globalAlpha = frame.threads * .94;
      ctx.strokeStyle = "#0b1d36";
      ctx.lineWidth = Math.max(2.4, weight * .50);
      segment();
      ctx.strokeStyle = weftOver ? weftColor(row) : warpColor(column);
      ctx.lineWidth = Math.max(1.1, weight * .25);
      segment();
    }
  }
  ctx.restore();
}
