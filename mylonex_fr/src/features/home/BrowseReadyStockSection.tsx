import Link from "../../shared/components/SiteLink";

const categories = [
  {
    id: "shop-material",
    title: "Shop by Material",
    description:
      "Browse by fiber composition: 100% cotton, silk, linen, bamboo, modal, wool, and specialized blends.",
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
        <path d="M4 7h6M4 12h8M4 17h16" />
      </svg>
    ),
    tone: "bg-blue-50 text-primary border border-blue-100",
  },
  {
    id: "shop-usage",
    title: "Shop by Usage",
    description:
      "Filter textiles engineered for shirts, bottoms, ethnic wear, athleisure, home decor, and industrial applications.",
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
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    tone: "bg-indigo-50 text-indigo-600 border border-indigo-100",
  },
  {
    id: "shop-design",
    title: "Shop by Construction",
    description:
      "Explore plain weaves, twills, satins, dobby weaves, jacquards, knitted structures, and certified prints.",
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
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    tone: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
];

export default function BrowseReadyStockSection() {
  return (
    <section id="ready-stock" className="border-b border-slate-200/60 bg-slate-50/70 py-16 sm:py-24">
      <div className="container-shell space-y-12">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-white px-3 py-1">
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
              Ready Stock
            </span>
          </div>
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Browse ready stock with confidence.
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            Choose the fastest route to find fabrics that match your order specifications, timeline, and production requirements.
          </p>
        </div>

        {/* 3 Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              id={category.id}
              className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-7 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-soft"
            >
              <div className="space-y-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${category.tone}`}
                >
                  {category.icon}
                </div>
                <h3 className="font-heading text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {category.description}
                </p>
              </div>

              <Link
                href="/buyer/fabrics"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#193cb8] transition-colors"
              >
                <span>Explore Catalog</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
