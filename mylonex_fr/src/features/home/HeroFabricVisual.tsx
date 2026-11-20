import Image from "../../shared/components/SiteImage";
const heroImage = "/images/landing/mylonex-blue-green-hero.webp";
const fabricDetail = "/images/landing/mylonex-blue-woven-outer.webp";
import { usePointerTilt } from "./motion/usePointerTilt";
import FabricRibbon from "./FabricRibbon";

export default function HeroFabricVisual() {
  const tilt = usePointerTilt<HTMLDivElement>(2.5);

  return (
    <div className="hero-fabric-scene">
      <FabricRibbon variant="hero" />
      <div className="hero-fabric-mat" aria-hidden="true" />
      <div className="hero-fabric-photo" {...tilt} aria-label="Curated textile fabric rolls and swatch samples">
        <Image
          src={heroImage}
          alt="Curated textile fabric rolls and swatch samples"
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 90vw"
          className="object-cover"
        />
      </div>
      <div className="hero-fabric-detail">
        <div className="hero-detail-image">
          <Image
            src={fabricDetail}
            alt="Close view of blue textile textures and woven edges"
            fill
            sizes="150px"
            className="object-cover"
          />
        </div>
        <span>It starts with<br /><strong>the right material.</strong></span>
      </div>
      <span className="hero-image-note">A closer connection to textiles</span>
    </div>
  );
}
