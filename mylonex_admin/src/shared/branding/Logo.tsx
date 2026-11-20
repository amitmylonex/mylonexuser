import LogoMark from "./LogoMark";

type LogoProps = {
    href?: string;
    compact?: boolean;
};

/**
 * Brand logo using the actual MyloNex logomark image.
 * Renders both the mark and wordmark (unless compact).
 */
export default function Logo({ href = "/", compact = false }: LogoProps) {
    const imgSize = compact ? 36 : 48;
    const content = (
        <div className="flex items-center gap-2.5">
            <LogoMark size={imgSize} alt={compact ? "MyloNex" : ""} />
            {!compact && (
                <div className="leading-tight">
                    <div className="font-heading text-lg font-bold tracking-tight text-ink">
                        MyloNex
                    </div>
                    <div className="text-[0.65rem] font-medium tracking-wide text-ink/50">
                        Textile Marketplace
                    </div>
                </div>
            )}
        </div>
    );

    if (!href) {
        return content;
    }

    return (
        <a href={href} className="inline-flex items-center">
            {content}
        </a>
    );
}
