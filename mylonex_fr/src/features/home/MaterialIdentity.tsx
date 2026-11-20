import Link from "../../shared/components/SiteLink";
import type { FabricCardItem } from "./FabricCard";
import MaterialPassport from "./MaterialPassport";
import FadeIn from "./motion/FadeIn";
import "./styles/material-identity.css";
import FabricRibbon from "./FabricRibbon";

type MaterialIdentityProps = {
  fabrics: FabricCardItem[];
};

export default function MaterialIdentity({ fabrics }: MaterialIdentityProps) {
  // Use the first available fabric for the example, or safely undefined if empty
  const exampleFabric = fabrics && fabrics.length > 0 ? fabrics[0] : undefined;

  return (
    <section id="material-passport" className="identity-root py-24 sm:py-32" data-fabric-scene="passport">
      <FabricRibbon variant="passport" />
      <div className="container-shell mx-auto px-4">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left: Copy */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:order-1 order-2">
            <FadeIn delay="none" direction="up">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-accent)]">
                MyloNex Material Identity
              </span>
            </FadeIn>
            
            <FadeIn delay="100" direction="up">
              <h2 className="landing-hero-text text-3xl sm:text-4xl md:text-5xl text-[var(--landing-text-main)] leading-tight">
                Give every material <br className="hidden sm:block" />
                <span className="text-[var(--landing-accent)]">an identity.</span>
              </h2>
            </FadeIn>
            
            <FadeIn delay="200" direction="up">
              <p className="text-base sm:text-lg text-[var(--landing-text-muted)] leading-relaxed">
                From the first requirement to the final sourcing conversation, MyloNex creates a clearer language for the materials moving through the textile ecosystem.
              </p>
            </FadeIn>

            <FadeIn delay="300" direction="up" className="mt-4">
              <Link
                href="/buyer/fabrics"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 shadow-sm"
              >
                Explore Fabrics →
              </Link>
            </FadeIn>
          </div>

          {/* Right: Passport Visual */}
          <div className="lg:col-span-7 lg:order-2 order-1 flex justify-center lg:justify-end">
            <div className="w-full max-w-md lg:max-w-none">
              <MaterialPassport fabric={exampleFabric} />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
