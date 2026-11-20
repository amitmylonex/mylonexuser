import Link from "../../shared/components/SiteLink";
import Image from "../../shared/components/SiteImage";
import {
    formatPricePerMeter,
    formatProductionCycle,
    listingBadgeClasses,
} from "./fabricBrowseTheme";

export type FabricCardItem = {
    id: string;
    mylonexCode?: string | null;
    fabricName: string;
    fabricType: string | null;
    compositionText: string;
    gsm: number | null;
    widthInches: string | null;
    weaveType: string | null;
    productionCycle: string;
    pricePerMeter: unknown;
    minimumOrderQuantity: number | null;
    leadTimeDays: number | null;
    city: string | null;
    imageUrls: string[];
    materialPurity: string | null;
    supplier: { companyName: string; city: string | null };
    fabricCollection?: { id: string; name: string } | null;
};

export default function FabricCard({ item }: { item: FabricCardItem }) {
    const label = formatProductionCycle(item.productionCycle);
    const badge = listingBadgeClasses[item.productionCycle] || "bg-[#eef2f7] text-[#334155]";

    return (
        <Link
            href={`/buyer/fabrics/${item.id}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#dfe3eb] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-26px_rgba(37,99,235,0.8)]"
        >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#f1f5f9]">
                {item.imageUrls?.[0] ? (
                    <Image
                        src={item.imageUrls[0]}
                        alt={item.mylonexCode || item.fabricName}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#667085]">No image</div>
                )}

                <div className="absolute right-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2f5fe3]">
                    {item.fabricType || "Fabric"}
                </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${badge}`}>{label}</span>
                    {item.materialPurity && (
                        <span className="text-xs capitalize text-[#64748b]">{item.materialPurity}</span>
                    )}
                </div>

                <div>
                    <h3 className="line-clamp-1 text-[1.3rem] font-semibold text-[#1f2937] group-hover:text-[#244dcb]">
                        {item.mylonexCode || item.fabricName}
                    </h3>
                    <p className="line-clamp-1 text-sm text-[#667085]">
                        {item.compositionText}
                        {item.weaveType ? ` / ${item.weaveType}` : ""}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[#edf1f6] py-3 text-sm text-[#475467]">
                    <Metric label="GSM" value={item.gsm ? String(item.gsm) : "-"} />
                    <Metric label="Width" value={item.widthInches ? `${item.widthInches}"` : "-"} />
                    <Metric label="MOQ" value={item.minimumOrderQuantity ? `${item.minimumOrderQuantity} m` : "-"} />
                    <Metric label="Lead" value={item.leadTimeDays ? `${item.leadTimeDays} days` : "-"} />
                </div>

                <div className="mt-auto flex items-end justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-[#101828]">
                            {formatPricePerMeter(item.pricePerMeter) || "Contact for pricing"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#667085]">{item.city || item.supplier?.city || "Location unavailable"}</p>
                    </div>
                    <span className="text-sm font-semibold text-[#2f5fe3]">View</span>
                </div>


            </div>
        </Link>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#94a3b8]">{label}</p>
            <p className="mt-0.5 text-[0.92rem] font-medium">{value}</p>
        </div>
    );
}
