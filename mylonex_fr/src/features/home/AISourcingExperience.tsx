import type { FabricCardItem } from "./FabricCard";
import AIConversationDemo from "./AIConversationDemo";
import FadeIn from "./motion/FadeIn";

type AISourcingExperienceProps = {
  fabrics: FabricCardItem[];
};

export default function AISourcingExperience({ fabrics }: AISourcingExperienceProps) {
  return (
    <section className="ai-sourcing-root py-24 sm:py-32 border-t border-[var(--landing-border)]">
      <div className="container-shell mx-auto px-4">
        
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left: Storytelling & Copy */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:pr-8">
            <FadeIn delay="none" direction="up">
              <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center bg-white shadow-sm mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--landing-accent)]">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" y1="22" x2="12" y2="12" />
                </svg>
              </div>
            </FadeIn>
            
            <FadeIn delay="100" direction="up">
              <h2 className="landing-hero-text text-3xl sm:text-4xl md:text-5xl text-[var(--landing-text-main)] leading-tight">
                Search less. <br />
                <span className="text-[var(--landing-accent)]">Source smarter.</span>
              </h2>
            </FadeIn>
            
            <FadeIn delay="200" direction="up">
              <p className="text-base sm:text-lg text-[var(--landing-text-muted)] leading-relaxed">
                Describe what you need in natural language. MyloNex helps structure textile requirements into a seamless sourcing workflow.
              </p>
            </FadeIn>
            
            <FadeIn delay="300" direction="up">
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--landing-accent)]" />
                  <span className="text-sm font-semibold text-slate-700">Turn natural language into structured data</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--landing-accent)]" />
                  <span className="text-sm font-semibold text-slate-700">Discover matching textiles instantly</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--landing-accent)]" />
                  <span className="text-sm font-semibold text-slate-700">Transition directly to bulk sourcing</span>
                </div>
              </div>
            </FadeIn>
          </div>

          {/* Right: AI Interactive Demo */}
          <div className="lg:col-span-7">
            <FadeIn delay="300" direction="up" className="h-full">
              <AIConversationDemo fabrics={fabrics} />
            </FadeIn>
          </div>

        </div>

      </div>
    </section>
  );
}
