"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type CustomSelectOption = {
    value: string;
    label: string;
    hint?: string;
};

type Props = {
    id: string;
    value?: string;
    options: CustomSelectOption[];
    placeholder: string;
    onChange: (_value: string) => void;
    disabled?: boolean;
    required?: boolean;
    searchable?: boolean;
    emptyMessage?: string;
};

function Chevron({ open }: { open: boolean }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
        >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function CustomSelect({
    id,
    value,
    options,
    placeholder,
    onChange,
    disabled = false,
    required = false,
    searchable = true,
    emptyMessage = "No options found",
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxId = `${id}-listbox`;

    const selectedOption = useMemo(
        () => options.find((option) => option.value === value),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        const search = query.trim().toLowerCase();
        if (!search) {
            return options;
        }

        return options.filter((option) => {
            const text = `${option.label} ${option.hint ?? ""}`.toLowerCase();
            return text.includes(search);
        });
    }, [options, query]);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
                setQuery("");
            }
        }

        function onEscape(event: KeyboardEvent) {
            if (event.key === "Escape" && open) {
                setOpen(false);
                setQuery("");
                triggerRef.current?.focus();
            }
        }

        window.addEventListener("mousedown", onPointerDown);
        window.addEventListener("keydown", onEscape);
        return () => {
            window.removeEventListener("mousedown", onPointerDown);
            window.removeEventListener("keydown", onEscape);
        };
    }, [open]);

    const displayLabel = selectedOption?.label ?? value ?? "";

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={triggerRef}
                id={id}
                type="button"
                role="combobox"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-required={required || undefined}
                className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-left text-base text-[#1f2937] shadow-sm transition hover:border-[#bfd0ff] focus:border-[#2f5fe3] focus:outline-none focus:ring-2 focus:ring-[#dce6ff] disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#98a2b3]"
                onClick={() => {
                    if (!disabled) {
                        setOpen((prev) => !prev);
                    }
                }}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
            >
                <span className={displayLabel ? "text-[#1f2937]" : "text-[#98a2b3]"}>
                    {displayLabel || placeholder}
                </span>
                <span className="text-[#98a2b3]">
                    <Chevron open={open} />
                </span>
            </button>

            {open && (
                <div className="absolute z-40 mt-2 w-full rounded-xl border border-[#d0d5dd] bg-white p-2 shadow-[0_25px_45px_-32px_rgba(15,23,42,0.6)]">
                    {searchable && (
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search options"
                            aria-label={`Search ${placeholder.toLowerCase()}`}
                            autoFocus
                            onKeyDown={(event) => {
                                if (event.key !== "Enter") return;
                                event.preventDefault();
                                if (filteredOptions.length === 1) {
                                    onChange(filteredOptions[0].value);
                                    setOpen(false);
                                    setQuery("");
                                    triggerRef.current?.focus();
                                }
                            }}
                            className="mb-2 w-full rounded-lg border border-[#d0d5dd] px-3 py-2 text-sm text-[#1f2937] focus:border-[#2f5fe3] focus:outline-none focus:ring-2 focus:ring-[#dce6ff]"
                        />
                    )}

                    <div id={listboxId} role="listbox" aria-label={placeholder} className="max-h-56 overflow-y-auto rounded-lg">
                        {filteredOptions.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-[#98a2b3]">{emptyMessage}</p>
                        ) : (
                            filteredOptions.map((option) => {
                                const active = option.value === value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="option"
                                        aria-selected={active}
                                        className={`min-h-11 w-full rounded-lg px-3 py-2 text-left transition ${
                                            active
                                                ? "bg-[#eef2ff] text-[#2f5fe3]"
                                                : "text-[#475467] hover:bg-[#f8faff] hover:text-[#1f2937]"
                                        }`}
                                        onClick={() => {
                                            onChange(option.value);
                                            setOpen(false);
                                            setQuery("");
                                        }}
                                    >
                                        <p className="text-sm font-medium">{option.label}</p>
                                        {option.hint && <p className="mt-0.5 text-xs text-[#98a2b3]">{option.hint}</p>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
