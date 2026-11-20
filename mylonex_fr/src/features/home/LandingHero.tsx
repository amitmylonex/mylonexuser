import HeroText from "./HeroText";
import HeroActions from "./HeroActions";
import HeroFabricVisual from "./HeroFabricVisual";
import "./styles/hero.css";
import Link from "../../shared/components/SiteLink";

export default function LandingHero() {
  return (
    <section id="sourcing-hero" className="landing-hero" data-fabric-scene="hero" aria-labelledby="landing-title">
      <div className="landing-hero-scene">
        <div className="container-shell landing-hero-grid">
          <div className="landing-hero-copy">
            <HeroText />
            <HeroActions />
            <p className="hero-footnote">For garment brands, manufacturers, mills &amp; dealers.</p>
            <Link href="#textile-journey" className="hero-follow-link">Follow the fabric <span aria-hidden="true">↓</span></Link>
          </div>
          <HeroFabricVisual />
        </div>
        <div className="container-shell hero-process" aria-label="Your sourcing journey">
          <span>A better way from fibre to finished fabric.</span>
          <ol>
            <li><b>01</b> Discover materials</li>
            <li><b>02</b> Connect with suppliers</li>
            <li><b>03</b> Move to production</li>
          </ol>
        </div>
      </div>
    </section>
  );
}

