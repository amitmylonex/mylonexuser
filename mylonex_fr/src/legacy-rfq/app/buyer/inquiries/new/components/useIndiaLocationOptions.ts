"use client";

import { useEffect, useMemo, useState } from "react";
import { getIndiaCities, getIndiaStates } from "./indiaLocations";
import { builderFetch } from "../../../../../adapters/http";

export type LocationOptionState = {
    stateOptions: string[];
    cityOptions: string[];
    loadingStates: boolean;
    loadingCities: boolean;
};

export function isIndiaCountry(country?: string): boolean {
    const norm = (country || "India").trim().toLowerCase();
    return norm === "india";
}

export function getLocationOptions(params: {
    isIndia?: boolean;
    country?: string;
    selectedState?: string;
    stateMode?: "select" | "custom";
    extraStates?: string[];
    extraCities?: string[];
}): LocationOptionState {
    const isIndia = params.country !== undefined ? isIndiaCountry(params.country) : (params.isIndia ?? true);
    const { selectedState, stateMode = "select", extraStates = [], extraCities = [] } = params;

    const baseStates = isIndia ? getIndiaStates() : [];
    const stateOptions = !isIndia
        ? []
        : extraStates.length === 0
            ? baseStates
            : Array.from(new Set([...baseStates, ...extraStates])).sort((a, b) => a.localeCompare(b));

    const baseCities = (!isIndia || stateMode === "custom" || !selectedState?.trim())
        ? []
        : getIndiaCities(selectedState);
    const cityOptions = (!isIndia || stateMode === "custom" || !selectedState?.trim())
        ? []
        : extraCities.length === 0
            ? baseCities
            : Array.from(new Set([...baseCities, ...extraCities])).sort((a, b) => a.localeCompare(b));

    return {
        stateOptions,
        cityOptions,
        loadingStates: false,
        loadingCities: false,
    };
}

export function useIndiaLocationOptions(params: {
    isIndia?: boolean;
    country?: string;
    selectedState?: string;
    stateMode?: "select" | "custom";
}) {
    const [extraStates, setExtraStates] = useState<string[]>([]);
    const [extraCities, setExtraCities] = useState<string[]>([]);

    const isIndia = params.country !== undefined ? isIndiaCountry(params.country) : (params.isIndia ?? true);
    const { selectedState, stateMode = "select" } = params;

    useEffect(() => {
        if (!isIndia) return;

        let active = true;
        builderFetch(`/api/locations?kind=states&country=India&limit=1000`, { cache: "no-store" })
            .then(async (response) => {
                if (!response.ok) return;
                const json = await response.json();
                if (!active || !json?.ok || !Array.isArray(json?.data?.items)) return;
                setExtraStates(json.data.items);
            })
            .catch(() => {
                // Silently fallback to built-in dataset
            });

        return () => {
            active = false;
        };
    }, [isIndia]);

    useEffect(() => {
        if (!isIndia || stateMode === "custom" || !selectedState?.trim()) return;

        let active = true;
        const searchParams = new URLSearchParams({
            kind: "cities",
            country: "India",
            state: selectedState,
            limit: "2000",
        });

        builderFetch(`/api/locations?${searchParams.toString()}`, { cache: "no-store" })
            .then(async (response) => {
                if (!response.ok) return;
                const json = await response.json();
                if (!active || !json?.ok || !Array.isArray(json?.data?.items)) return;
                setExtraCities(json.data.items);
            })
            .catch(() => {
                // Silently fallback to built-in dataset
            });

        return () => {
            active = false;
        };
    }, [isIndia, selectedState, stateMode]);

    return useMemo(() => getLocationOptions({
        ...params,
        extraStates,
        extraCities,
    }), [params.country, params.isIndia, params.selectedState, params.stateMode, extraStates, extraCities]);
}
