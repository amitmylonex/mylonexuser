export const conePositions = [90, 190, 290, 390, 490, 590];
export const yarnColors = ["#425cff", "#2c46df", "#70b84c", "#8ac85d", "#b6bdcc", "#dce0e8"];

export function yarnTakeoff(index: number, winding: number) {
  const angle = winding * .19 + index * 1.6;
  return { x: conePositions[index] + Math.sin(angle) * 23, y: 552 + Math.cos(angle) * 3 };
}

export function metal(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, upright = false,
) {
  const light = ctx.createLinearGradient(x, y, upright ? x + w : x, upright ? y : y + h);
  light.addColorStop(0, "#8c98aa");
  light.addColorStop(.23, "#f4f7fc");
  light.addColorStop(.53, "#bec8d7");
  light.addColorStop(1, "#657187");
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(w, h) / 3);
  ctx.fill();
}

function cone(ctx: CanvasRenderingContext2D, x: number, color: string, spin: number) {
  ctx.save();
  ctx.translate(x, 0);
  const shadow = ctx.createRadialGradient(0, 652, 1, 0, 652, 55);
  shadow.addColorStop(0, "#29375160");
  shadow.addColorStop(.55, "#29375132");
  shadow.addColorStop(1, "#29375100");
  ctx.save();
  ctx.translate(0, 652);
  ctx.scale(1, .28);
  ctx.translate(0, -652);
  ctx.fillStyle = shadow;
  ctx.fillRect(-55, 597, 110, 110);
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(-23, 551);
  ctx.bezierCurveTo(-22, 538, 22, 538, 23, 551);
  ctx.lineTo(37, 644);
  ctx.bezierCurveTo(25, 655, -25, 655, -37, 644);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = color;
  ctx.fillRect(-38, 536, 76, 118);
  const cylinder = ctx.createLinearGradient(-37, 0, 37, 0);
  cylinder.addColorStop(0, "#18274680");
  cylinder.addColorStop(.30, "#ffffff49");
  cylinder.addColorStop(.55, "#ffffff00");
  cylinder.addColorStop(.83, "#16244740");
  cylinder.addColorStop(1, "#111e3a8c");
  ctx.fillStyle = cylinder;
  ctx.fillRect(-38, 536, 76, 118);

  for (const direction of [-1, 1]) {
    for (const [offset, weight, color] of [[0, 1.25, "#14234036"], [.8, .7, "#ffffff58"], [1.5, .35, "#ffffff30"]] as const) {
      ctx.beginPath();
      for (let row = -14; row < 42; row++) {
        const y = 541 + row * 3.8 + direction * spin + offset;
        const drift = Math.sin(row * 2.34) * .44;
        ctx.moveTo(-42, y);
        ctx.bezierCurveTo(-20, y + direction * 7, 20, y + direction * 30 + drift, 42, y + direction * 38);
      }
      ctx.lineWidth = weight;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
  }
  ctx.lineWidth = .4;
  for (const color of ["#ffffff55", "#1b2c4a44"]) {
    ctx.beginPath();
    for (let i = 0; i < 240; i++) {
      const x = Math.sin(i * 84.37) * 38;
      const y = 542 + (i * 23.71) % 107;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 1.2, y - .7, x + 2.4, y + (color === "#ffffff55" ? .8 : -.8));
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "#a47d54";
  ctx.fillRect(-10, 540, 20, 10);
  ctx.beginPath();
  ctx.ellipse(0, 540, 10, 4.6, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "#d8bd95";
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, 539.8, 5.6, 2.4, 0, 0, 2 * Math.PI);
  ctx.fillStyle = "#3f352c";
  ctx.fill();
  ctx.restore();
}

export function paintCones() {
  const surface = document.createElement("canvas");
  surface.width = 680 * 2;
  surface.height = 170 * 2;
  const ctx = surface.getContext("2d");
  return (target: CanvasRenderingContext2D, spin: number) => {
    if (!ctx) return;
    ctx.setTransform(2, 0, 0, 2, 0, -510 * 2);
    ctx.clearRect(0, 510, 680, 170);
    conePositions.forEach((x, index) => cone(ctx, x, yarnColors[index], (spin + index * 1.25) % 3.8));
    target.drawImage(surface, 0, 510, 680, 170);
  };
}

export function clothSurface(texture: HTMLImageElement, logo: HTMLImageElement) {
  const surface = document.createElement("canvas");
  surface.width = 960;
  surface.height = 650;
  const ctx = surface.getContext("2d");
  if (!ctx) return surface;
  const { width, height } = surface;
  ctx.fillStyle = "#edeff3";
  ctx.fillRect(0, 0, width, height);
  if (texture.naturalWidth) {
    const crop = texture.naturalHeight * width / height;
    ctx.drawImage(texture, (texture.naturalWidth - crop) / 2, 0, crop, texture.naturalHeight, 0, 0, width, height);
  }
  if (logo.naturalWidth) {
    const h = 472;
    const w = h * logo.naturalWidth / logo.naturalHeight;
    ctx.drawImage(logo, (width - w) / 2, (height - h) / 2, w, h);
  }
  // Alternate the upper yarn at every crossing, including across the logo.
  const tile = document.createElement("canvas");
  tile.width = tile.height = 8;
  const yarn = tile.getContext("2d");
  if (yarn) {
    yarn.fillStyle = "#22334a25";
    yarn.fillRect(0, 3, 4, 1);
    yarn.fillRect(4, 7, 4, 1);
    yarn.fillRect(7, 0, 1, 4);
    yarn.fillRect(3, 4, 1, 4);
    yarn.fillStyle = "#ffffff50";
    yarn.fillRect(0, 1, 4, 1);
    yarn.fillRect(4, 5, 4, 1);
    yarn.fillRect(5, 0, 1, 4);
    yarn.fillRect(1, 4, 1, 4);
    const pattern = ctx.createPattern(tile, "repeat");
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
  }
  ctx.fillStyle = "#667dab88";
  ctx.fillRect(0, 0, 3, height);
  ctx.fillRect(width - 3, 0, 3, height);
  return surface;
}
