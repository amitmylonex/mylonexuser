import JourneyPreviews from "./JourneyPreviews";
import JourneyVisual from "./JourneyVisual";
import "./styles/textile-journey.css";
import "./styles/journey-motion.css";

export default function TextileJourney() {
  return (
    <section id="textile-journey" className="textile-journey" data-fabric-scene="journey" aria-labelledby="journey-title">
      <div className="journey-scene">
        <div className="container-shell journey-layout">
          <div className="journey-story-copy">
            <p className="landing-eyebrow">Follow the fabric / 01</p>
            <h2 id="journey-title" className="landing-hero-text">
              <span className="journey-heading-line">One thread.</span>{" "}
              <span className="journey-heading-line journey-heading-accent">A world of possibility.</span>
            </h2>
            <p className="journey-introduction">A clearer path from what you imagine to the material you need.</p>
            <p className="journey-continuation">Thread → fabric → sourcing → sample → production → delivery → satisfaction.</p>
          </div>
          <JourneyVisual>
            <JourneyPreviews />
          </JourneyVisual>
        </div>
      </div>
    </section>
  );
}
