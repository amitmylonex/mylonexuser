import Image from "../../shared/components/SiteImage";
import type { FabricCardItem } from "./FabricCard";
import { usePointerTilt } from "./motion/usePointerTilt";
import "./styles/material-identity.css";

type MaterialPassportProps = { fabric?: FabricCardItem };

export default function MaterialPassport({ fabric }: MaterialPassportProps) {
  const tilt = usePointerTilt<HTMLDivElement>(1.5);
  const name = fabric?.fabricName || "Your material, in one place";
  const image = fabric?.imageUrls?.[0];
  const specs = [
    ["Composition", fabric?.compositionText],
    ["Weave", fabric?.weaveType],
    ["Weight", fabric?.gsm ? `${fabric.gsm} GSM` : null],
    ["Width", fabric?.widthInches ? `${fabric.widthInches}"` : null],
    ["Production", fabric?.productionCycle?.replaceAll("_", " ")],
  ].filter(([, value]) => value);

  return (
    <div className="material-passport" {...tilt}>
      <header className="passport-heading">
        <p>Example material passport</p>
        <h3>A material. A clearer picture.</h3>
        <p className="passport-example-note">Concept preview{fabric ? " · using public catalog details" : ""}</p>
      </header>
      <div className="passport-visual">
        {image ? (
          <Image src={image} alt={name} fill sizes="(max-width: 767px) 90vw, 500px" className="object-cover" />
        ) : (
          <div className="passport-no-image"><span>Material photograph</span><p>No image supplied{fabric ? " for this listing" : ""}.</p></div>
        )}
      </div>
      <div className="passport-code-banner">
        <span>Material reference</span>
        <strong>{fabric?.mylonexCode || "Not assigned"}</strong>
      </div>
      <div className="passport-specs">
        <h4>{name}</h4>
        <dl>
          {specs.map(([label, value]) => (
            <div className="spec-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
        {!fabric && <p>Composition, weave and dimensions appear here when a material is selected.</p>}
      </div>
    </div>
  );
}
