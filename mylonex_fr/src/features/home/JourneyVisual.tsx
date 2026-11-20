import Image from "../../shared/components/SiteImage";
import type { CSSProperties, ReactNode } from "react";
const fabric = "/images/landing/mylonex-blue-woven-outer.webp";

export default function JourneyVisual({ children }: { children: ReactNode }) {
  return (
    <div className="journey-visual" style={{ "--journey-fabric": `url("${fabric}")` } as CSSProperties}>
      <div className="journey-visual-orbit" aria-hidden="true" />
      <Image src={fabric} alt="" sizes="(max-width: 767px) 384px, 640px" loading="eager" className="journey-texture" />
      <canvas className="journey-loom" aria-hidden="true" />
      <span className="journey-swatch-label" aria-hidden="true">Material in focus</span>
      {children}
      <div className="journey-visual-caption" aria-hidden="true">
        <span>Thread</span><i /><span>Fabric</span><i /><span>Connection</span>
      </div>
    </div>
  );
}
