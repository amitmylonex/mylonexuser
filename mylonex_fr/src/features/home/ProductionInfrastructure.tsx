import ProductionFilm from "./ProductionFilm";
import FabricRibbon from "./FabricRibbon";
import Link from "../../shared/components/SiteLink";
import FadeIn from "./motion/FadeIn";
import "./styles/production-infrastructure.css";

const productionTypes = [
  {
    id: "production-made-to-order",
    number: "01",
    title: "Made to Order",
    subtitle: "Built around your requirement.",
    description: "Custom fabric engineered to spec with tailored weave structure, yarn count, and finishing.",
  },
  {
    id: "production-running",
    number: "02",
    title: "Running Production",
    subtitle: "Existing production already in motion.",
    description: "Standardized batches from active looms for predictable replenishment and stable costing.",
  },
  {
    id: "production-ready-stock",
    number: "03",
    title: "Ready Stock",
    subtitle: "Available material ready for sourcing.",
    description: "Warehouse-available inventory ready for immediate sample dispatch or fast bulk rollout.",
  },
];

export default function ProductionInfrastructure() {
  return (
    <section id="production-infrastructure" data-fabric-scene="production" className="prod-infra-root py-24 sm:py-32 relative border-t border-[var(--landing-border)] overflow-hidden">
      <FabricRibbon variant="production" />
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--landing-accent) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      <div className="container-shell mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-20">
          <FadeIn delay="none" direction="up">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--landing-accent)]">
              Industrial Scale
            </span>
          </FadeIn>
          <FadeIn delay="100" direction="up">
            <h2 className="landing-hero-text text-3xl sm:text-4xl md:text-5xl text-[var(--landing-text-main)] leading-tight mt-4 mb-6">
              Production infrastructure.
            </h2>
          </FadeIn>
          <FadeIn delay="200" direction="up">
            <p className="text-base sm:text-lg text-[var(--landing-text-muted)] leading-relaxed max-w-2xl font-medium">
              From material to physical execution.
            </p>
          </FadeIn>
        </div>

        {/* Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          <div className="lg:col-span-7 xl:col-span-8 w-full relative">
            <ProductionFilm />
          </div>

          {/* Right: Production Modes (Span 5/4) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-center space-y-8 lg:py-6">
            <FadeIn delay="300" direction="up">
              <div className="space-y-10 sm:space-y-12">
                {productionTypes.map((mode) => (
                  <div key={mode.id} className="prod-mode-item group relative pl-6 transition-all duration-300">
                    <div className="absolute left-0 top-1 bottom-1 w-[2px] bg-slate-200 group-hover:bg-[var(--landing-accent)] transition-colors duration-300" />
                    <div className="text-[0.65rem] font-mono font-bold text-slate-400 mb-1.5 tracking-widest">{mode.number}</div>
                    <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 mb-1.5 uppercase tracking-wide">
                      {mode.title}
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 mb-3">
                      {mode.subtitle}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-sm">
                      {mode.description}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Action Bar */}
        <FadeIn delay="300" direction="up" className="mt-16 sm:mt-24">
          <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 left-1/4 w-1/2 h-full bg-[var(--landing-accent)] opacity-10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col relative z-10 mb-6 sm:mb-0">
              <h4 className="text-white font-heading text-lg sm:text-xl font-bold mb-2">
                Need production guidance?
              </h4>
              <p className="text-slate-400 text-sm max-w-md">
                Connect with our textile experts to map your specific weave, quantity, and timeline requirements.
              </p>
            </div>
            
            <Link
              href="/buyer/chat"
              className="relative z-10 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              Talk to an Expert →
            </Link>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}
