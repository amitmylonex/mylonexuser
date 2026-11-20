export type JourneyBox = { x: number; y: number; width: number; height: number };

export function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

export function mixBox(from: JourneyBox, to: JourneyBox, progress: number): JourneyBox {
  return {
    x: mix(from.x, to.x, progress),
    y: mix(from.y, to.y, progress),
    width: mix(from.width, to.width, progress),
    height: mix(from.height, to.height, progress),
  };
}

export function loomBox(width: number, height: number): JourneyBox {
  const clothWidth = Math.min(width * .68, height * .88);
  return { x: (width - clothWidth) * .57, y: height * .20, width: clothWidth, height: clothWidth * .68 };
}

export const FABRIC_EDGE = 4;
export const STRIP_STAGGER = 6;
const WAITING_BOTTOM = 34;
const WAITING_GAP = 14;
const MIN_WAITING_HEIGHT = 18;
// The split adds up to .14 of the swatch height, and the ripple adds up to .14 more.
const WAITING_TOP_ALLOWANCE = 1.28;

export function minimumWaitingStageHeight(cardHeight: number, stackOffset: number) {
  return Math.ceil(2 * stackOffset + 2 + cardHeight + 2 * FABRIC_EDGE +
    WAITING_GAP + MIN_WAITING_HEIGHT * WAITING_TOP_ALLOWANCE + WAITING_BOTTOM);
}

export function lowerBox(loom: JourneyBox, height: number, bleed: number, copyWidth: number, panel: JourneyBox): JourneyBox {
  const bottom = height - WAITING_BOTTOM;
  const mobileRoom = (bottom - panel.y - panel.height - WAITING_GAP) / WAITING_TOP_ALLOWANCE;
  const swatchHeight = bleed ? loom.height * .59 : Math.min(loom.height * .64, mobileRoom);
  const x = bleed ? 12 - bleed : 4;
  const preferredWidth = loom.width * Math.max(.43, swatchHeight / loom.height);
  // Reserve room for the last strip's stagger and the antialiased edge.
  const desktopRight = Math.min(copyWidth - bleed, panel.x - 24);
  const width = bleed ? Math.min(preferredWidth, desktopRight - x - 2 * STRIP_STAGGER - 1) : preferredWidth;
  return { x, y: bottom - swatchHeight, width, height: swatchHeight };
}

export function panelBox(width: number, height: number, card: JourneyBox, stackOffset: number): JourneyBox {
  const panelWidth = card.width + 2 * FABRIC_EDGE;
  const panelHeight = card.height + 2 * FABRIC_EDGE;
  const narrow = stackOffset < 10;
  return {
    x: width - panelWidth - 2 * stackOffset - 2,
    y: Math.max(2 * stackOffset + 2, (height - panelHeight - (narrow ? 140 : 30)) * .42),
    width: panelWidth,
    height: panelHeight,
  };
}
