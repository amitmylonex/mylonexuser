import Image from "../../shared/components/SiteImage";
import Link from "../../shared/components/SiteLink";
import type { FabricCardItem } from "./FabricCard";
import { usePointerTilt } from "./motion/usePointerTilt";

type FabricSwatchProps = { fabric: FabricCardItem; featured?: boolean; order?: number };

export default function FabricSwatch({ fabric, featured = false, order = 0 }: FabricSwatchProps) {
  const tilt = usePointerTilt<HTMLAnchorElement>(1.5);
  const image = fabric.imageUrls?.[0];
  return (
    <Link
      href={`/buyer/fabrics/${fabric.id}`}
      className={`fabric-swatch ${featured ? "is-featured" : ""}`}
      data-swatch-order={order}
      {...tilt}
      aria-label={`View fabric details for ${fabric.fabricName}`}
    >
      <div className="fabric-swatch-image">
        {image ? (
          <Image src={image} alt={fabric.fabricName} fill className="object-cover"
            sizes={featured ? "(max-width: 639px) 280px, (max-width: 1023px) 90vw, 550px" : "(max-width: 639px) 280px, (max-width: 1023px) 44vw, 270px"} />
        ) : (
          <div className="swatch-no-image">
            <span>{fabric.fabricType || "Textile"}</span>
            <p>Image not supplied</p>
          </div>
        )}
        <span className="swatch-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="swatch-metadata">
        <p className="swatch-reference">{fabric.mylonexCode || fabric.fabricType}</p>
        <h3>{fabric.fabricName}</h3>
        <p className="swatch-composition">{fabric.compositionText}</p>
        <div className="swatch-specs">
          {fabric.gsm && <span>{fabric.gsm} GSM</span>}
          {fabric.widthInches && <span>{fabric.widthInches}&quot; width</span>}
          {fabric.weaveType && <span>{fabric.weaveType}</span>}
        </div>
      </div>
    </Link>
  );
}
