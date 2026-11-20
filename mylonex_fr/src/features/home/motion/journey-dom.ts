import { paintCloth } from "./journey-cloth";
import { FABRIC_EDGE, STRIP_STAGGER, loomBox, lowerBox, minimumWaitingStageHeight, mix, mixBox, panelBox, type JourneyBox } from "./journey-geometry";
import { paintLoom } from "./journey-loom";
import { journeyFrame, journeyProgress } from "./journey-state";
import { clampProgress } from "./scroll-state";

/** Uses the landing coordinator's scroll frame, resize and visibility lifecycle. */
export function createJourneyMotion(root: HTMLElement) {
  const section = root.querySelector<HTMLElement>("#textile-journey");
  const scene = section?.querySelector<HTMLElement>(".journey-scene");
  const story = section?.querySelector<HTMLElement>(".journey-story-copy");
  const stage = section?.querySelector<HTMLElement>(".journey-visual");
  const texture = stage?.querySelector<HTMLImageElement>(".journey-texture");
  const label = stage?.querySelector<HTMLElement>(".journey-swatch-label");
  const loom = stage?.querySelector<HTMLCanvasElement>(".journey-loom")?.getContext("2d");
  if (!section || !scene || !story || !stage || !texture || !label || !loom) return null;

  const cards = Array.from(stage.querySelectorAll<HTMLElement>(".journey-spec-card"));
  const layers = Array.from(stage.querySelectorAll<HTMLCanvasElement>(".journey-piece"), canvas => canvas.getContext("2d"));
  if (cards.length !== 3 || layers.length !== 3 || !layers.every(layer => layer !== null)) return null;

  let bleed = 0;
  let copyWidth = 0;
  let stackOffset = 7;
  let width = 0;
  let height = 0;
  let start = 0;
  let end = 0;
  let previous = -1;
  let cardSize: JourneyBox = { x: 0, y: 0, width: 0, height: 0 };
  const pixels = (value: number) => `${value.toFixed(2)}px`;
  const reset = () => {
    delete section.dataset.journeyMotion;
    delete section.dataset.storyStage;
    cards.forEach(card => { card.inert = false; });
    previous = -1;
  };
  texture.addEventListener("error", reset);

  return {
    measure() {
      if (root.dataset.scrollMotion !== "on" || (texture.complete && texture.currentSrc && !texture.naturalWidth)) return;
      const header = root.querySelector("header")?.firstElementChild?.getBoundingClientRect().height ?? 63;
      const top = Math.ceil(header) + 1;
      section.style.setProperty("--journey-header", pixels(top));
      section.dataset.journeyMotion = "on";

      // Measure the pinned layout before deriving the travel distance or restoring scroll.
      start = section.getBoundingClientRect().top + window.scrollY + section.clientTop - top;
      // The drawing can cross the grid gap into the copy column. The cards stay in the stage.
      bleed = Math.max(0, Math.round(stage.getBoundingClientRect().left - story.getBoundingClientRect().left));
      stage.style.setProperty("--journey-art-bleed", pixels(bleed));
      width = stage.clientWidth;
      copyWidth = story.offsetWidth;
      stackOffset = bleed && width >= 420 ? 12 : 7;
      stage.style.removeProperty("--journey-card-height");
      cardSize = { x: 0, y: 0, width: cards[0].offsetWidth, height: Math.max(...cards.map(card => card.offsetHeight)) };
      stage.style.setProperty("--journey-card-height", pixels(cardSize.height));
      stage.style.setProperty("--journey-stage-min", pixels(bleed ? 0 : minimumWaitingStageHeight(cardSize.height, stackOffset)));
      height = stage.clientHeight;
      end = start + section.clientHeight - scene.offsetHeight;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      for (const layer of [loom, ...layers]) {
        const canvas = layer.canvas;
        const rasterWidth = Math.round((width + bleed) * dpr);
        const rasterHeight = Math.round(height * dpr);
        if (canvas.width !== rasterWidth || canvas.height !== rasterHeight) {
          canvas.width = rasterWidth;
          canvas.height = rasterHeight;
        }
        layer.setTransform(dpr, 0, 0, dpr, bleed * dpr, 0);
      }
      previous = -1;
      // Initial paint happens here too, before the intersection observer reports the chapter.
      this.update(window.scrollY);
    },
    update(scrollY: number) {
      if (section.dataset.journeyMotion !== "on" || !width || !height) return;
      const progress = journeyProgress(scrollY, start, end);
      if (progress === previous) return;
      const prior = previous < 0 ? null : journeyFrame(previous);
      previous = progress;
      const frame = journeyFrame(progress);
      const weave = loomBox(width, height);
      const front = panelBox(width, height, cardSize, stackOffset);
      const lower = lowerBox(weave, height, bleed, copyWidth, front);
      const swatch = mixBox(weave, lower, frame.drop);
      const loomRipple = Math.min(15, width * .027) * frame.ripple;
      const ripple = mix(loomRipple, Math.min(loomRipple * .63, lower.height * .08), frame.drop);
      const gap = Math.min(11, lower.height * .14);
      const stackDepth = (pose: typeof frame, index: number) =>
        pose.pieces.slice(index + 1).reduce((depth, next) => depth + next.reveal, 0);

      if (!frame.split || !prior?.split) {
        loom.clearRect(-bleed, 0, width + bleed, height);
        paintLoom(loom, weave, width, height, frame);
        if (!frame.split) {
          paintCloth(loom, texture, swatch, { from: 0, to: 1, phase: frame.phase, ripple, opacity: frame.cloth });
        }
      }
      label.style.setProperty("--journey-label-opacity", String(frame.cloth * (1 - frame.split)));
      label.style.setProperty("--journey-label-x", pixels(swatch.x + 12));
      label.style.setProperty("--journey-label-y", pixels(swatch.y + swatch.height - 23));
      section.style.setProperty("--journey-thread-meter", String(clampProgress(progress / .335)));
      section.style.setProperty("--journey-fabric-meter", String(clampProgress((progress - .335) / .605)));

      frame.pieces.forEach(({ travel, reveal }, index) => {
        const layer = layers[index];
        const card = cards[index];
        card.inert = index !== frame.stage;
        const depth = stackDepth(frame, index);
        if (prior && ((!frame.split && !prior.split) ||
          (travel === 1 && prior.pieces[index].travel === 1 && depth === stackDepth(prior, index)))) return;
        layer.clearRect(-bleed, 0, width + bleed, height);
        const from = index / 3;
        const to = (index + 1) / 3;
        const waiting = {
          x: lower.x + index * STRIP_STAGGER * frame.split,
          y: lower.y + lower.height * from + (index - 1) * gap * frame.split,
          width: lower.width,
          height: lower.height / 3,
        };
        const landed = { ...front, x: front.x + depth * stackOffset, y: front.y - depth * stackOffset };
        const piece = mixBox(waiting, landed, travel);
        // Peel away as a strip, then unfold after crossing towards the preview.
        const expansion = clampProgress((travel - .35) / .65);
        piece.width = mix(waiting.width, landed.width, expansion);
        piece.height = mix(waiting.height, landed.height, expansion);
        piece.y -= Math.sin(travel * Math.PI) * Math.min(52, width * .12);

        if (frame.split) {
          paintCloth(layer, texture, piece, { from, to, phase: frame.phase, ripple: ripple * (1 - expansion), opacity: 1 });
        }
        card.style.setProperty("--journey-card-x", pixels(piece.x + FABRIC_EDGE));
        card.style.setProperty("--journey-card-y", pixels(piece.y + FABRIC_EDGE));
        card.style.setProperty("--journey-card-scale-x", String(Math.max(.01, (piece.width - 2 * FABRIC_EDGE) / cardSize.width)));
        card.style.setProperty("--journey-card-scale-y", String(Math.max(.01, (piece.height - 2 * FABRIC_EDGE) / cardSize.height)));
        card.style.setProperty("--journey-card-opacity", String(reveal));
        card.style.setProperty("--journey-card-light", String(1 - .17 * Math.min(depth, 1)));
      });
      section.dataset.storyStage = String(frame.stage);
    },
    reset,
    destroy() {
      reset();
      texture.removeEventListener("error", reset);
      for (const element of [section, stage, label, ...cards]) {
        [...element.style].filter(key => key.startsWith("--journey-") && key !== "--journey-fabric")
          .forEach(key => element.style.removeProperty(key));
      }
    },
  };
}
