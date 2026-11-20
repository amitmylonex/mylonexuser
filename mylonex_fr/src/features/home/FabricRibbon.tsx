import Image from "../../shared/components/SiteImage";
const ribbon = "/images/landing/mylonex-blue-green-ribbon.webp";

type FabricRibbonProps = { variant: "hero" | "discovery" | "passport" | "production" | "finale" };

export default function FabricRibbon({ variant }: FabricRibbonProps) {
  return (
    <div className={`fabric-ribbon fabric-ribbon-${variant}`} aria-hidden="true">
      <Image src={ribbon} alt="" width={768} height={1152}
        sizes="(max-width: 767px) 180px, 380px" className="fabric-ribbon-art" />
    </div>
  );
}
