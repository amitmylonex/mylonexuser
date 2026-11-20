const RFQ_PREFIX = "RFQ";
const SAMPLE_PREFIX = "SMP";

function formatDateKey(date: Date) {
    return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function parseSequenceFromNumber(value: string, expectedPrefix: string) {
    const match = value.match(new RegExp(`^${expectedPrefix}-\\d{8}-(\\d+)$`));
    if (!match) {
        return 0;
    }

    return Number(match[1]) || 0;
}

export function formatRfqNumber(date: Date, sequence: number) {
    return `${RFQ_PREFIX}-${formatDateKey(date)}-${String(sequence).padStart(4, "0")}`;
}

export function formatSampleNumber(date: Date, sequence: number) {
    return `${SAMPLE_PREFIX}-${formatDateKey(date)}-${String(sequence).padStart(3, "0")}`;
}

type NumberGeneratorOptions = {
    date?: Date;
    prefix: "RFQ" | "SMP";
    padLength: number;
    getLatestForDate: (_dateKey: string) => Promise<string | null>;
    exists: (_candidate: string) => Promise<boolean>;
    maxAttempts?: number;
};

export async function generateSequentialNumber(options: NumberGeneratorOptions) {
    const date = options.date ?? new Date();
    const dateKey = formatDateKey(date);
    const latestForDate = await options.getLatestForDate(dateKey);
    let sequence = latestForDate
        ? parseSequenceFromNumber(latestForDate, options.prefix)
        : 0;

    const maxAttempts = options.maxAttempts ?? 20;

    for (let i = 0; i < maxAttempts; i += 1) {
        sequence += 1;
        const candidate = `${options.prefix}-${dateKey}-${String(sequence).padStart(options.padLength, "0")}`;
        const alreadyExists = await options.exists(candidate);

        if (!alreadyExists) {
            return candidate;
        }
    }

    throw new Error(`Failed to allocate ${options.prefix} number after ${maxAttempts} attempts`);
}

export async function generateRfqNumber(
    getLatestForDate: NumberGeneratorOptions["getLatestForDate"],
    exists: NumberGeneratorOptions["exists"],
    date?: Date
) {
    return generateSequentialNumber({
        date,
        prefix: "RFQ",
        padLength: 4,
        getLatestForDate,
        exists,
    });
}

export async function generateSampleNumber(
    getLatestForDate: NumberGeneratorOptions["getLatestForDate"],
    exists: NumberGeneratorOptions["exists"],
    date?: Date
) {
    return generateSequentialNumber({
        date,
        prefix: "SMP",
        padLength: 3,
        getLatestForDate,
        exists,
    });
}
