export const STEP_TITLE_CLASS = "text-[1.55rem] font-bold tracking-[-0.03em] text-[#18202c]";
export const STEP_DESCRIPTION_CLASS = "text-base leading-relaxed text-[#687385]";
export const FIELD_LABEL_CLASS = "text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[#687385]";
export const FIELD_HINT_CLASS = "mt-1 text-xs text-[#667085]";

export function optionPillClass(active: boolean) {
    return [
        "min-h-11 rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2945f5]",
        active
            ? "border-[#2f5fe3] bg-[#eef2ff] text-[#2f5fe3] shadow-[0_8px_20px_-18px_rgba(47,95,227,0.95)]"
            : "border-[#d0d5dd] bg-white text-[#475467] hover:border-[#bfd0ff] hover:bg-[#f8faff]",
    ].join(" ");
}

export function optionCardClass(active: boolean) {
    return [
        "min-h-[7rem] rounded-2xl border p-5 text-left transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2945f5]",
        active
            ? "border-[#2f5fe3] bg-[#eef2ff] shadow-[0_16px_32px_-24px_rgba(47,95,227,0.95)]"
            : "border-[#dfe3eb] bg-white hover:border-[#bfd0ff] hover:bg-[#f8faff]",
    ].join(" ");
}
