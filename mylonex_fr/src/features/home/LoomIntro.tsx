import Image from "../../shared/components/SiteImage";
const pearl = "/images/landing/mylonex-pearl-woven-inner.webp";

export default function LoomIntro() {
  return (
    <section className="landing-loom-intro" data-fabric-scene="loom-intro" aria-label="From thread to fabric">
      <div className="loom-intro-stage">
        <canvas aria-hidden="true" />
        <div hidden>
          <Image data-loom-texture src={pearl} alt="" loading="eager" />
          <Image data-loom-logo src="/images/mylonex-logo.png" width={1680} height={1440} alt="" loading="eager" />
        </div>
        <a className="loom-skip" href="#sourcing-hero" onClick={event => {
          const hero = document.getElementById("sourcing-hero");
          const title = document.getElementById("landing-title");
          if (!hero || !title) return;
          event.preventDefault();
          window.scrollTo({ top: hero.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
          title.setAttribute("tabindex", "-1");
          title.focus({ preventScroll: true });
        }}>Skip to website <span aria-hidden="true">↓</span></a>
        <p className="loom-cue" aria-hidden="true">Scroll to follow the thread <span>↓</span></p>
      </div>
    </section>
  );
}
