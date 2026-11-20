import { useEffect, useState } from "react";
import Image from "../../shared/components/SiteImage";
import Link from "../../shared/components/SiteLink";
import type { FabricCardItem } from "./FabricCard";
import RequirementChip from "./RequirementChip";
import { useIntersectionObserver } from "./motion/useIntersectionObserver";
import "./styles/ai-sourcing.css";

type AIConversationDemoProps = {
  fabrics: FabricCardItem[];
};

export default function AIConversationDemo({ fabrics }: AIConversationDemoProps) {
  const [ref, isIntersecting] = useIntersectionObserver({ threshold: 0.2, triggerOnce: true });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (isIntersecting) {
      // Sequence timing
      const t1 = setTimeout(() => setStage(1), 300);   // User message
      const t2 = setTimeout(() => setStage(2), 1100);  // AI message
      const t3 = setTimeout(() => setStage(3), 1800);  // Thread & Chips start
      const t4 = setTimeout(() => setStage(4), 3000);  // Fabric results
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [isIntersecting]);

  const previewFabrics = fabrics.slice(0, 2); // 1-2 real public fabrics
  const hasPreview = previewFabrics.length > 0;

  return (
    <div ref={ref as any} className="ai-interface-panel flex flex-col h-full w-full bg-slate-50 relative">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-bold text-slate-800 tracking-wide">MYLONEX AI</span>
        </div>
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          Illustrative Example
        </span>
      </div>

      <div className="flex-1 p-6 sm:p-8 flex flex-col gap-6 relative">
        
        {/* User Message */}
        <div className={`ai-message flex justify-end ${stage >= 1 ? "animate-in" : ""}`}>
          <div className="user-bubble max-w-[85%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed">
            I need a lightweight cotton twill for summer garments, around 150 GSM.
          </div>
        </div>

        {/* AI Message */}
        <div className={`ai-message flex justify-start ${stage >= 2 ? "animate-in" : ""}`}>
          <div className="ai-bubble max-w-[85%] sm:max-w-[75%] text-sm sm:text-base leading-relaxed">
            Let&apos;s structure that requirement into a sourcing workflow.
          </div>
        </div>

        {/* Requirements Grid & Thread */}
        <div className="relative mt-4">
          
          {/* Subtle Thread Connecting Chips */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden sm:block" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <path 
              d="M 20 20 L 80 20 C 120 20, 120 80, 160 80 L 220 80" 
              className={`ai-thread-path ${stage >= 3 ? "animate-in" : ""}`}
            />
          </svg>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
            <RequirementChip label="Fiber" value="Cotton" delay={0} triggerAnimation={stage >= 3} />
            <RequirementChip label="Weave" value="Twill" delay={200} triggerAnimation={stage >= 3} />
            <RequirementChip label="Weight" value="100–200 GSM" delay={400} triggerAnimation={stage >= 3} />
            <RequirementChip label="Season" value="Summer" delay={600} triggerAnimation={stage >= 3} />
          </div>
        </div>

        {/* Fabric Results */}
        {hasPreview && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className={`ai-message mb-4 ${stage >= 4 ? "animate-in" : ""}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Explore The Collection
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {previewFabrics.map((fabric, idx) => {
                const hasImage = fabric.imageUrls && fabric.imageUrls.length > 0;
                
                return (
                  <Link 
                    key={fabric.id} 
                    href={`/buyer/fabrics/${fabric.id}`}
                    className={`fabric-preview-card flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all w-full sm:w-1/2 ${stage >= 4 ? "animate-in" : ""}`}
                    style={{ transitionDelay: `${idx * 150}ms` }}
                  >
                    <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden relative shrink-0">
                      {hasImage ? (
                        <Image src={fabric.imageUrls[0]} alt={fabric.fabricName} fill className="object-cover" sizes="64px" />
                      ) : (
                        <div className="w-full h-full bg-slate-200" />
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-slate-800 truncate">{fabric.fabricName}</span>
                      <span className="text-xs text-slate-500 truncate">{fabric.compositionText}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </div>
      
      {/* Bottom CTA Area */}
      <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end">
        <Link 
          href="/buyer/inquiries/new"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--landing-text-main)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          Start Sourcing →
        </Link>
      </div>

    </div>
  );
}
