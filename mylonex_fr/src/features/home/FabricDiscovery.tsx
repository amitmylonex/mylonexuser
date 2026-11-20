import Link from "../../shared/components/SiteLink";
import type { FabricCardItem } from "./FabricCard";
import FabricSwatch from "./FabricSwatch";
import FadeIn from "./motion/FadeIn";
import "./styles/fabric-discovery.css";
import FabricRibbon from "./FabricRibbon";

type FabricDiscoveryProps = {
  items: FabricCardItem[];
};

export default function FabricDiscovery({ items }: FabricDiscoveryProps) {
  const hasItems = items && items.length > 0;

  return (
    <section id="fabric-discovery" className="discovery-root py-24 sm:py-32" data-fabric-scene="discovery">
      <FabricRibbon variant="discovery" />
      <div className="container-shell mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl text-left">
            <FadeIn delay="none" direction="up">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-accent)] mb-3 block">
                MyloNex Fabric Library
              </span>
            </FadeIn>
            <FadeIn delay="100" direction="up">
              <h2 className="landing-hero-text text-3xl sm:text-4xl md:text-5xl text-[var(--landing-text-main)] mb-4">
                Find your next material.
              </h2>
            </FadeIn>
            <FadeIn delay="200" direction="up">
              <p className="text-base sm:text-lg text-[var(--landing-text-muted)] leading-relaxed">
                Explore fabrics across the MyloNex ecosystem — from everyday essentials to specialized textile requirements.
              </p>
            </FadeIn>
          </div>
          
          <FadeIn delay="300" direction="up" className="shrink-0">
            <Link
              href="/buyer/fabrics"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--landing-border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--landing-text-main)] hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-300 shadow-sm"
            >
              Explore Fabrics →
            </Link>
          </FadeIn>
        </div>

        {/* Content */}
        {!hasItems ? (
          <FadeIn delay="300" direction="up">
            <div className="w-full flex flex-col items-center justify-center min-h-[400px] rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 text-center px-6 py-12">
              <h3 className="text-xl font-heading font-bold text-slate-800 mb-2">THE LIBRARY IS BEING PREPARED.</h3>
              <p className="text-slate-500 max-w-md">Public fabric listings will appear here as the collection grows.</p>
            </div>
          </FadeIn>
        ) : (
          <div className="w-full">
            <FadeIn delay="300" direction="up" className="w-full">
              {/* 
                Mobile: Horizontal scroll snapping rail 
                Desktop: CSS Grid with a featured large swatch
              */}
              <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-8 sm:pb-0 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                {items.slice(0, 5).map((fabric, idx) => (
                  <div key={fabric.id} className="snap-center sm:snap-align-none shrink-0 w-[280px] sm:w-auto sm:contents">
                    <FabricSwatch fabric={fabric} featured={idx === 0} order={idx} />
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </section>
  );
}
