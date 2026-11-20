/** Keep a journey position in its own history entry before hydration changes layout. */
export function createJourneyRestoration(root: HTMLElement, shouldRestore: boolean) {
  const saved = window.history.state?.myloJourneyScroll;
  let pending = shouldRestore && saved?.href === window.location.href
    && typeof saved.y === "number" && Number.isFinite(saved.y) && saved.y >= 0 ? saved.y : null;

  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const save = () => {
    const section = root.querySelector<HTMLElement>("#textile-journey");
    const bounds = section?.getBoundingClientRect();
    const nearby = bounds && bounds.top < window.innerHeight && bounds.bottom > 0;
    const position = nearby && root.dataset.scrollMotion === "on"
      ? { href: window.location.href, y: window.scrollY } : null;
    const current = window.history.state?.myloJourneyScroll;
    if (position ? current?.href === position.href && current?.y === position.y : !current) return;
    try {
      window.history.replaceState({ ...window.history.state, myloJourneyScroll: position }, "");
    } catch (error) {
      console.warn("Unable to preserve the textile journey scroll position.", error);
    }
  };
  // Write after scrolling settles. Some browsers snapshot history before pagehide on reload.
  const scheduleSave = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 150);
  };
  const saveJourneyLink = (event: MouseEvent) => {
    const link = event.target instanceof Element && event.target.closest("#textile-journey a");
    if (link && root.contains(link)) save();
  };
  window.addEventListener("click", saveJourneyLink, true);
  window.addEventListener("scroll", scheduleSave, { passive: true });
  window.addEventListener("pagehide", save);

  return {
    hasPendingPosition: pending !== null,
    restore() {
      if (pending === null) return;
      // Use the saved enhanced-layout coordinate, not an interim SSR coordinate.
      window.scrollTo({ top: pending, behavior: "instant" });
      pending = null;
    },
    destroy() {
      clearTimeout(saveTimer);
      window.removeEventListener("click", saveJourneyLink, true);
      window.removeEventListener("scroll", scheduleSave);
      window.removeEventListener("pagehide", save);
    },
  };
}
