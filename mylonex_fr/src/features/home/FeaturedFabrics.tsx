import Link from "../../shared/components/SiteLink";
import FabricCard, {
  type FabricCardItem,
} from "./FabricCard";

type FeaturedFabricsProps = {
  items: FabricCardItem[];
};

export default function FeaturedFabrics({ items }: FeaturedFabricsProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="border-b border-slate-200/60 bg-white py-16 sm:py-24">
      <div className="container-shell space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/60 px-3 py-1">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-primary">
                Discover
              </span>
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Featured Fabrics
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Explore top-quality textiles from verified mills, ready for sampling or bulk orders.
            </p>
          </div>

          <Link
            href="/buyer/fabrics"
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-2xs hover:bg-white hover:border-slate-300 hover:text-primary transition-all"
          >
            <span>View Full Catalog</span>
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <FabricCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
