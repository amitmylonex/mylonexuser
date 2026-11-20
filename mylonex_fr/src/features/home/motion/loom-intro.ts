import { clampProgress, loomIntroFrame } from "./scroll-state";
import { metal, paintCones, clothSurface } from "./loom-materials";

import { guideY, paintFeed, warpTop } from "./loom-feed";

const panel = { x: 108, y: 137, width: 464, height: 314 };
const pickCount = 36;
const warpSpacing = 7;

function stroke(ctx: CanvasRenderingContext2D, x: number, y: number, toX: number, toY: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function paintMachine(ctx: CanvasRenderingContext2D, opacity: number) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.shadowColor = "#35476330";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;
  metal(ctx, 72, 55, 24, 431, true);
  metal(ctx, 584, 55, 24, 431, true);
  metal(ctx, 61, 60, 558, 23);
  metal(ctx, 66, 448, 548, 23);
  ctx.shadowColor = "transparent";
  metal(ctx, 64, guideY - 3, 552, 6);
  for (const x of [84, 596]) {
    for (const y of [72, 459]) {
      ctx.fillStyle = "#576880";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#dce5f0";
      stroke(ctx, x - 2, y + 2, x + 2, y - 2);
    }
  }
  ctx.restore();
}

function paintShuttle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  const wood = ctx.createLinearGradient(0, -8, 0, 8);
  wood.addColorStop(0, "#e7c89e");
  wood.addColorStop(.55, "#b78756");
  wood.addColorStop(1, "#785333");
  ctx.fillStyle = wood;
  ctx.beginPath();
  ctx.moveTo(-31, 0);
  ctx.quadraticCurveTo(-21, -9, -13, -8);
  ctx.lineTo(13, -8);
  ctx.quadraticCurveTo(23, -8, 31, 0);
  ctx.quadraticCurveTo(22, 7, 13, 7);
  ctx.lineTo(-13, 7);
  ctx.quadraticCurveTo(-24, 7, -31, 0);
  ctx.fill();
  ctx.fillStyle = "#604630";
  ctx.fillRect(-10, -3, 20, 6);
  ctx.fillStyle = "#ece6d5";
  ctx.fillRect(-7, -2, 14, 4);
  ctx.restore();
}

function paintWeave(ctx: CanvasRenderingContext2D, cloth: HTMLCanvasElement, weave: number, feed: number) {
  const { x, y, width, height } = panel;
  const picks = weave * pickCount;
  const row = Math.floor(picks);
  const phase = picks - row;
  const traverse = clampProgress(phase / .72);
  const strokeProgress = traverse * traverse * (3 - 2 * traverse);
  const beat = Math.sin(Math.PI * clampProgress((phase - .72) / .28)) ** 2;
  const rowHeight = height / pickCount;
  const pickY = y + rowHeight * row;
  const weftY = pickY + rowHeight * (.8 - beat * .42);
  const leftward = row % 2 === 1;
  const shuttleX = x + width * (leftward ? 1 - strokeProgress : strokeProgress);
  const shed = Math.sin(Math.PI * clampProgress(phase / .88)) * (leftward ? -3 : 3);

  ctx.save();
  ctx.globalAlpha *= clampProgress((feed - .85) / .15);
  const depth = clampProgress((feed - .85) / .15);
  ctx.lineWidth = .8;
  for (let i = 0; i <= width / warpSpacing; i++) {
    const warpX = x + i * warpSpacing;
    ctx.strokeStyle = i % 2 ? "#a8b4c6" : "#e3e8f2";
    ctx.beginPath();
    const end = warpTop + (height + y - warpTop) * depth;
    ctx.moveTo(warpX, warpTop);
    ctx.lineTo(warpX + (i % 2 ? shed : -shed) * depth, Math.min(end, weftY));
    ctx.lineTo(warpX, end);
    ctx.stroke();
    if (depth > .1 && i % 2 === 0) {
      ctx.beginPath();
      ctx.ellipse(warpX, 100 + (i % 4 ? shed : -shed), 1.35, 3, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = "#7788a0";
      ctx.stroke();
    }
  }
  ctx.restore();

  if (weave > 0 && weave < 1) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, pickY - y + rowHeight * clampProgress((phase - .72) / .28));
    ctx.clip();
    ctx.drawImage(cloth, x, y, width, height);
    ctx.restore();
  }

  metal(ctx, 96, 91, 488, 5);
  metal(ctx, 96, 105, 488, 5);
  {
    const reedY = Math.min(448, y + height * weave + 18 - beat * 13);
    ctx.strokeStyle = "#65748a98";
    ctx.lineWidth = .8;
    stroke(ctx, 90, 113, 99, reedY + 4);
    stroke(ctx, 590, 113, 581, reedY + 4);
    metal(ctx, 96, reedY, 488, 10);
    ctx.beginPath();
    for (let dent = 102; dent < 582; dent += 4) {
      ctx.moveTo(dent, reedY + 2);
      ctx.lineTo(dent, reedY + 8);
    }
    ctx.stroke();
  }
  if (weave > 0 && weave < 1) {
    const y = weftY;
    const start = Math.min(shuttleX, leftward ? x + width : x);
    const end = Math.max(shuttleX, leftward ? x + width : x);
    ctx.strokeStyle = "#637b9d";
    ctx.lineWidth = 2.4;
    stroke(ctx, start, y, end, y);
    ctx.strokeStyle = "#dce7f4";
    ctx.lineWidth = .85;
    stroke(ctx, start, y - .45, end, y - .45);
    for (let i = row % 2; i <= width / warpSpacing; i += 2) {
      const crossing = x + i * warpSpacing + (i % 2 ? shed : -shed);
      if (crossing < start || crossing > end) continue;
      ctx.strokeStyle = "#52678255";
      ctx.lineWidth = 3;
      stroke(ctx, crossing, y - 2, crossing, y + 3);
      ctx.strokeStyle = "#f4f6fa";
      ctx.lineWidth = 1.55;
      stroke(ctx, crossing, y - 3, crossing, y + 2);
    }
    paintShuttle(ctx, shuttleX, y);
  }
}

export function createLoomIntro(section: HTMLElement) {
  const canvas = section.querySelector("canvas");
  const texture = section.querySelector<HTMLImageElement>("[data-loom-texture]");
  const logo = section.querySelector<HTMLImageElement>("[data-loom-logo]");
  const ctx = canvas?.getContext("2d");
  if (!canvas || !ctx || !texture || !logo) return;
  const cones = paintCones();
  let cloth = clothSurface(texture, logo);
  let sources = 0;
  let width = 0, height = 0, ratio = 1;
  let last = -1;

  return {
    measure() {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      ratio = Math.min(window.devicePixelRatio || 1, 2, 1800 / Math.max(1, width));
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      last = -1;
      return height;
    },
    paint(frame: ReturnType<typeof loomIntroFrame>) {
      const loaded = Number(!!texture.naturalWidth) + 2 * Number(!!logo.naturalWidth);
      if (loaded !== sources) {
        cloth = clothSurface(texture, logo);
        sources = loaded;
        last = -1;
      }
      if (last === frame.progress || !width || !height || frame.progress === 1) return;
      last = frame.progress;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min((width - 20) / 680, (height - 94) / 668, 1.24);
      if (scale <= 0) return;
      const left = (width - 680 * scale) / 2;
      const bottomAligned = height - 55 - 664 * scale;
      const centered = (height - 668 * scale) / 2;
      const top = bottomAligned + (centered - bottomAligned) * frame.machine * .82;

      ctx.save();
      ctx.translate(left, top);
      ctx.scale(scale, scale);
      ctx.globalAlpha = 1 - frame.release;
      if (frame.machine > 0) {
        paintMachine(ctx, frame.machine * (1 - frame.release));
        ctx.save();
        ctx.globalAlpha *= frame.machine;
        paintWeave(ctx, cloth, frame.weave, frame.feed);
        ctx.restore();
      }
      const winding = frame.feed * 20 + frame.weave * 34;
      cones(ctx, winding);
      paintFeed(ctx, frame.feed, winding, panel.x, panel.width);
      ctx.restore();

      if (frame.weave === 1) {
        const zoom = 1 + (Math.max(width / panel.width, height / panel.height) * 1.14 / scale - 1) * frame.approach;
        const w = panel.width * scale * zoom;
        const h = panel.height * scale * zoom;
        const center = top + (panel.y + panel.height / 2) * scale;
        const y = center + (height / 2 - center) * frame.approach + Math.sin(frame.release * Math.PI) * 5 * scale;
        ctx.save();
        ctx.shadowColor = "#25375432";
        ctx.shadowBlur = 18 * frame.release;
        ctx.shadowOffsetY = 10 * frame.release;
        ctx.translate(width / 2, y);
        ctx.rotate(Math.sin(Math.PI * frame.release) * .011);
        ctx.drawImage(cloth, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    },
  };
}
