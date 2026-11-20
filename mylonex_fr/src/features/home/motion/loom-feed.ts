import { clampProgress } from "./scroll-state";
import { conePositions, yarnColors, yarnTakeoff } from "./loom-materials";

type Point = { x: number; y: number };

export const guideY = 510;
export const warpTop = 82;

function curve(points: Point[], control1: Point, control2: Point, end: Point) {
  const start = points[points.length - 1];
  for (let step = 1; step <= 14; step++) {
    const t = step / 14;
    const u = 1 - t;
    points.push({
      x: u ** 3 * start.x + 3 * u * u * t * control1.x + 3 * u * t * t * control2.x + t ** 3 * end.x,
      y: u ** 3 * start.y + 3 * u * u * t * control1.y + 3 * u * t * t * control2.y + t ** 3 * end.y,
    });
  }
}

function trace(points: Point[], progress: number) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let remaining = lengths.reduce((sum, length) => sum + length, 0) * progress;
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < lengths.length; i++) {
    const from = points[i], to = points[i + 1];
    const amount = Math.min(1, remaining / lengths[i]);
    path.lineTo(from.x + (to.x - from.x) * amount, from.y + (to.y - from.y) * amount);
    remaining -= lengths[i];
    if (remaining <= 0) break;
  }
  return path;
}

export function paintFeed(ctx: CanvasRenderingContext2D, feed: number, winding: number, warpStart: number, warpWidth: number) {
  ctx.save();
  ctx.lineCap = "round";
  conePositions.forEach((x, index) => {
    const start = yarnTakeoff(index, winding);
    const side = index < 3 ? 48 + index * 7 : 632 - (5 - index) * 7;
    const inlet = warpStart + (index + .5) * warpWidth / conePositions.length;
    const lift = Math.sin(winding * .24 + index) * (4 - feed * 2.5);
    const balloon = [start];
    curve(balloon, { x: start.x + lift, y: 539 }, { x: x + lift, y: 522 }, { x, y: guideY });
    const route = [{ x, y: guideY }];
    curve(route, { x, y: 469 }, { x: side, y: 495 }, { x: side, y: 419 });
    curve(route, { x: side + lift, y: 340 }, { x: side + lift * .6, y: 176 }, { x: side, y: 108 });
    curve(route, { x: side, y: 53 }, { x: inlet, y: 64 }, { x: inlet, y: warpTop });
    const progress = clampProgress((feed - index * .016) / (.86 - index * .016));
    const paths = [trace(balloon, 1), trace(route, progress)];
    for (const path of paths) {
      ctx.setLineDash([]);
      ctx.lineWidth = 2.25;
      ctx.strokeStyle = "#35496a50";
      ctx.stroke(path);
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = yarnColors[index];
      ctx.stroke(path);
      ctx.lineWidth = .45;
      ctx.strokeStyle = "#fcfdff8c";
      ctx.setLineDash([2, 3.5]);
      ctx.lineDashOffset = -winding * .35;
      ctx.stroke(path);
    }
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(x, guideY, 4.5, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8292aa";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, guideY, 4.5, 3.45, 5.7);
    ctx.lineWidth = .9;
    ctx.strokeStyle = "#f6f9ff";
    ctx.stroke();
  });
  ctx.restore();
}
