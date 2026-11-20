import { useEffect, useRef } from "react";
import { clampProgress, heroProgress, heroZipperFrame, loomIntroFrame, sceneProgress } from "./scroll-state";
import { createJourneyMotion } from "./journey-dom";
import { createJourneyRestoration } from "./journey-restoration";
import { createLoomIntro } from "./loom-intro";

type Scene = { element: HTMLElement; top: number; height: number; kind: string };

export default function LandingScrollCoordinator() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = marker.current?.closest<HTMLElement>(".landing-root");
    if (!root || !window.IntersectionObserver || !window.ResizeObserver) return;
    const motion = window.matchMedia("(min-width: 1024px) and (min-height: 740px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const journey = createJourneyMotion(root);
    const scenes: Scene[] = Array.from(root.querySelectorAll<HTMLElement>("[data-fabric-scene]"))
      .map(element => ({ element, top: 0, height: 0, kind: element.dataset.fabricScene || "" }));
    const intro = scenes.find(scene => scene.kind === "loom-intro");
    const loom = intro && createLoomIntro(intro.element);
    const header = root.querySelector<HTMLElement>(":scope > header");
    let stageHeight = 0;
    const near = new Set<HTMLElement>();
    let frame = 0;
    let needsMeasure = true;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const restoration = createJourneyRestoration(root, !reducedMotion.matches);
    let anchorPending = !restoration.hasPendingPosition && navigation?.type !== "reload" && navigation?.type !== "back_forward";
    let viewport = window.innerHeight;
    let disposed = false;

    const measure = () => {
      const scrollY = window.scrollY;
      viewport = window.innerHeight;
      journey?.measure();
      scenes.forEach(scene => {
        const bounds = scene.element.getBoundingClientRect();
        scene.top = bounds.top + scrollY;
        scene.height = bounds.height;
      });
      stageHeight = loom?.measure() ?? 0;
      needsMeasure = false;
    };

    const update = () => {
      frame = 0;
      if (disposed || document.hidden) return;
      if (needsMeasure) measure();
      restoration.restore();
      if (anchorPending) {
        anchorPending = false;
        let id = window.location.hash.slice(1);
        try { id = decodeURIComponent(id); } catch { id = ""; }
        const target = id ? document.getElementById(id) : null;
        if (target && root.contains(target)) {
          // Honor fresh anchors after enhancement; preserve reload/Back scroll restoration.
          const margin = target.id === "sourcing-hero" ? 0 : parseFloat(getComputedStyle(target).scrollMarginTop) || 88;
          window.scrollTo({ top: Math.max(0, target.getBoundingClientRect().top + window.scrollY - margin), behavior: "instant" });
        }
      }
      if (reducedMotion.matches) return;
      const y = window.scrollY;
      const isDesktopMotion = motion.matches;
      if (intro && loom && stageHeight) {
        const travel = Math.max(1, intro.height - stageHeight);
        const state = loomIntroFrame(clampProgress((y - intro.top) / travel));
        const mode = state.progress === 1 ? "done" : state.handoff > 0 ? "handoff" : "active";
        root.dataset.loomIntro = mode;
        if (header) header.inert = mode !== "done";
        root.style.setProperty("--loom-opacity", String(1 - state.handoff));
        root.style.setProperty("--loom-handoff", String(state.handoff));
        root.style.setProperty("--loom-cue", String(state.cue));
        root.style.setProperty("--loom-hero-offset", `${Math.min(0, y - intro.top - travel)}px`);
        loom.paint(state);
      }
      scenes.forEach(scene => {
        if (scene.kind === "loom-intro" || !near.has(scene.element)) return;
        if (scene.kind === "journey") {
          journey?.update(y);
          return;
        }
        const style = scene.element.style;
        if (scene.kind === "hero") {
          const hp = heroProgress(y, scene.top, scene.height, viewport, isDesktopMotion);
          const state = heroZipperFrame(hp);
          style.setProperty("--hero-progress", hp.toFixed(4));
          style.setProperty("--zipper-unzip", state.unzip.toFixed(4));
          style.setProperty("--zipper-slider-y", `${state.sliderY.toFixed(2)}%`);
          style.setProperty("--fabric-unwrap", state.unwrap.toFixed(4));
          style.setProperty("--cue-opacity", state.cueOpacity.toFixed(3));
          style.setProperty("--logo-reveal-opacity", state.logoOpacity.toFixed(3));
          style.setProperty("--logo-reveal-scale", state.logoScale.toFixed(3));
          style.setProperty("--logo-reveal-y", `${state.logoY.toFixed(1)}px`);
          style.setProperty("--ribbon-handoff", state.ribbonHandoff.toFixed(4));
          style.setProperty("--flap-rotate-l", `${state.flapRotateLeft.toFixed(1)}deg`);
          style.setProperty("--flap-rotate-r", `${state.flapRotateRight.toFixed(1)}deg`);
          style.setProperty("--flap-shift-x", `${state.flapShiftX.toFixed(1)}px`);
        }
        if (!isDesktopMotion) return;
        const p = sceneProgress(y, scene.top, scene.height, viewport);
        style.setProperty("--scene-progress", p.toFixed(4));
        style.setProperty("--ribbon-y", `${(p - .5) * -110}px`);
        style.setProperty("--ribbon-turn", `${(p - .5) * 14}deg`);
        style.setProperty("--image-parallax", `${(p - .5) * -30}px`);
        style.setProperty("--fan-shift", `${(1 - p) * 12}px`);
      });
    };

    const schedule = () => {
      if (!disposed && !document.hidden && !frame) frame = requestAnimationFrame(update);
    };
    const invalidate = () => { needsMeasure = true; schedule(); };
    const hashchange = () => { anchorPending = true; invalidate(); };
    const setMode = () => {
      const isReduced = reducedMotion.matches;
      root.dataset.scrollMotion = !isReduced ? "on" : "off";
      root.dataset.desktopMotion = motion.matches ? "on" : "off";
      if (!isReduced && loom && !root.dataset.loomIntro) root.dataset.loomIntro = "active";
      if (isReduced) {
        journey?.reset();
        cancelAnimationFrame(frame);
        frame = 0;

        delete root.dataset.loomIntro;
        if (header) header.inert = false;
      }
      invalidate();
    };
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else invalidate();
    };
    const intersection = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          near.add(element);
          element.dataset.sceneNear = "true";
        } else {
          near.delete(element);
          delete element.dataset.sceneNear;
        }
      });
      schedule();
    }, { rootMargin: "200px 0px" });
    const revealTargets = root.querySelectorAll<HTMLElement>("[data-fabric-scene] h2, .passport-specs");
    const reveals = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.detailSeen = "true";
        reveals.unobserve(entry.target);
      });
    }, { threshold: .2 });
    revealTargets.forEach(element => reveals.observe(element));
    const resize = new ResizeObserver(invalidate);
    scenes.forEach(scene => { intersection.observe(scene.element); resize.observe(scene.element); });
    resize.observe(root);
    motion.addEventListener("change", setMode);
    reducedMotion.addEventListener("change", setMode);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    window.addEventListener("hashchange", hashchange);
    window.addEventListener("pageshow", invalidate);
    root.addEventListener("load", invalidate, true);
    document.addEventListener("visibilitychange", visibility);
    document.fonts?.addEventListener("loadingdone", invalidate);
    document.fonts?.ready.then(() => { if (!disposed) invalidate(); });
    setMode();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      intersection.disconnect();
      reveals.disconnect();
      revealTargets.forEach(element => { delete element.dataset.detailSeen; });
      resize.disconnect();
      journey?.destroy();
      restoration.destroy();
      motion.removeEventListener("change", setMode);
      reducedMotion.removeEventListener("change", setMode);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("hashchange", hashchange);
      window.removeEventListener("pageshow", invalidate);
      root.removeEventListener("load", invalidate, true);
      document.removeEventListener("visibilitychange", visibility);
      document.fonts?.removeEventListener("loadingdone", invalidate);
      delete root.dataset.scrollMotion;
      delete root.dataset.loomIntro;
      if (header) header.inert = false;
      ["--loom-opacity", "--loom-handoff", "--loom-cue", "--loom-hero-offset"].forEach(property => root.style.removeProperty(property));
      scenes.forEach(({ element }) => {
        delete element.dataset.sceneNear;
        delete element.dataset.storyStage;
        ["--scene-progress", "--ribbon-y", "--ribbon-turn", "--image-parallax", "--fan-shift",
          "--hero-progress", "--zipper-unzip", "--zipper-slider-y", "--fabric-unwrap",
          "--cue-opacity", "--logo-reveal-opacity", "--logo-reveal-scale", "--logo-reveal-y",
          "--ribbon-handoff", "--flap-rotate-l", "--flap-rotate-r", "--flap-shift-x"].forEach(property => element.style.removeProperty(property));
      });
    };
  }, []);

  return <span ref={marker} hidden />;
}
