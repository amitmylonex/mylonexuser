const features = [
  {
    title: "Intelligent MOQ Routing",
    description:
      "Orders above MOQ route directly to mills; smaller sampling lots are auto-routed to verified dealers and stockists.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 12l-4-4-4 4M12 16V8" />
      </svg>
    ),
    tone: "bg-blue-50 text-primary border border-blue-100",
  },
  {
    title: "3-Way Ecosystem",
    description:
      "Mills, vetted dealers, and garment buyers operate in one synchronized network with clear roles and live visibility.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 13a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1" />
        <path d="M14 11a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" />
      </svg>
    ),
    tone: "bg-indigo-50 text-indigo-600 border border-indigo-100",
  },
  {
    title: "Trust & Risk Control",
    description:
      "Escrow protection, quality dispute frameworks, and verified payment milestones built into every transaction.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    tone: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
  {
    title: "End-to-End Visibility",
    description:
      "Track your textile orders from loom spinning and dyeing through lab dip approvals and final delivery.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="1" y="3" width="15" height="13" rx="2" />
        <path d="M16 8h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    tone: "bg-slate-100 text-slate-700 border border-slate-200",
  },
  {
    title: "Verified Supplier Network",
    description:
      "Every mill, processor, and dealer is KYC-verified with real production capacity and quality audit ratings.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
    tone: "bg-blue-50 text-primary border border-blue-100",
  },
  {
    title: "Dedicated Trade Support",
    description:
      "Specialized textile merchandisers assist with RFQ specifications, sample matching, and order tracking.",
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h4" />
      </svg>
    ),
    tone: "bg-indigo-50 text-indigo-600 border border-indigo-100",
  },
];

export default function FeaturesSection() {
  return (
    <section className="border-b border-slate-200/60 bg-white py-16 sm:py-24">
      <div className="container-shell space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/60 px-3 py-1">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
              Why MyloNex
            </span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Not just a directory. A transaction-first platform.
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Intelligent routing, fintech rails, and verified partners make trading fabrics faster, transparent, and safer.
          </p>
        </div>

        {/* 6 Grid items */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-7 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
            >
              <div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.tone}`}
                >
                  {feature.icon}
                </div>
                <h3 className="mt-5 font-heading text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
