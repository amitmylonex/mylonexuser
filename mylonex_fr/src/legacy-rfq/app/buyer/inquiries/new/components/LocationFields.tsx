"use client";

import { useMemo, useState } from "react";
import CustomSelect from "./CustomSelect";
import { FIELD_LABEL_CLASS } from "./formStyles";
import {
    COUNTRY_OPTIONS,
    CUSTOM_LOCATION_VALUE,
    buildCityOptions,
    buildStateOptions,
} from "./locationOptions";
import { isIndiaCountry, useIndiaLocationOptions } from "./useIndiaLocationOptions";

type Props = {
    prefix: string;
    country?: string;
    state?: string;
    city?: string;
    onCountryChange: (_value: string) => void;
    onStateChange: (_value: string) => void;
    onCityChange: (_value: string) => void;
};

export default function LocationFields({
    prefix,
    country,
    state,
    city,
    onCountryChange,
    onStateChange,
    onCityChange,
}: Props) {
    const isIndia = isIndiaCountry(country);

    const [userCustomState, setUserCustomState] = useState(false);
    const [userCustomCity, setUserCustomCity] = useState(false);

    const { stateOptions, cityOptions, loadingStates, loadingCities } = useIndiaLocationOptions({
        isIndia,
        selectedState: state,
    });

    const isStateInDataset = useMemo(() => {
        if (!state?.trim()) return true;
        return stateOptions.some((s) => s.toLowerCase() === state.trim().toLowerCase());
    }, [state, stateOptions]);

    const isCityInDataset = useMemo(() => {
        if (!city?.trim()) return true;
        return cityOptions.some((c) => c.toLowerCase() === city.trim().toLowerCase());
    }, [city, cityOptions]);

    const stateMode: "select" | "custom" = (!isIndia || userCustomState || !isStateInDataset)
        ? "custom"
        : "select";

    const cityMode: "select" | "custom" = (!isIndia || stateMode === "custom" || userCustomCity || !isCityInDataset)
        ? "custom"
        : "select";

    const resolvedStateValue = useMemo(() => {
        if (!state) return "";
        const match = stateOptions.find(
            (s) => s.toLowerCase() === state.trim().toLowerCase()
        );
        return match ?? state;
    }, [state, stateOptions]);

    const resolvedCityValue = useMemo(() => {
        if (!city) return "";
        const match = cityOptions.find(
            (c) => c.toLowerCase() === city.trim().toLowerCase()
        );
        return match ?? city;
    }, [city, cityOptions]);

    const stateSelectOptions = useMemo(() => buildStateOptions(stateOptions), [stateOptions]);
    const citySelectOptions = useMemo(() => buildCityOptions(cityOptions), [cityOptions]);

    const hasState = Boolean(state && state.trim());

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div>
                <label htmlFor={`${prefix}-country`} className={FIELD_LABEL_CLASS}>Country</label>
                <CustomSelect
                    id={`${prefix}-country`}
                    value={country || "India"}
                    options={COUNTRY_OPTIONS}
                    placeholder="Select country"
                    required
                    searchable
                    onChange={(nextCountry) => {
                        setUserCustomState(false);
                        setUserCustomCity(false);
                        onCountryChange(nextCountry);
                        onStateChange("");
                        onCityChange("");
                    }}
                />
            </div>

            <div>
                <label htmlFor={`${prefix}-state`} className={FIELD_LABEL_CLASS}>State</label>
                {isIndia && stateMode === "select" ? (
                    <>
                        <CustomSelect
                            id={`${prefix}-state`}
                            value={resolvedStateValue}
                            options={stateSelectOptions}
                            placeholder={loadingStates ? "Loading states..." : "Select state"}
                            required
                            disabled={loadingStates}
                            searchable
                            onChange={(value) => {
                                if (value === CUSTOM_LOCATION_VALUE) {
                                    setUserCustomState(true);
                                    setUserCustomCity(true);
                                    onStateChange("");
                                    onCityChange("");
                                    return;
                                }

                                setUserCustomState(false);
                                setUserCustomCity(false);
                                onStateChange(value);
                                onCityChange("");
                            }}
                        />
                        <button
                            type="button"
                            className="mt-2 text-xs font-semibold text-[#2f5fe3] hover:text-[#244dcb]"
                            onClick={() => {
                                setUserCustomState(true);
                                setUserCustomCity(true);
                                onStateChange("");
                                onCityChange("");
                            }}
                        >
                            State not listed? Enter manually
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            id={`${prefix}-state-custom`}
                            value={state ?? ""}
                            onChange={(event) => {
                                const nextState = event.target.value;
                                onStateChange(nextState);
                                if (city) {
                                    onCityChange("");
                                }
                            }}
                            placeholder="Type state"
                            className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-sm text-[#1f2937] focus:border-[#2f5fe3] focus:outline-none focus:ring-2 focus:ring-[#dce6ff]"
                            required
                        />
                        {isIndia && (
                            <button
                                type="button"
                                className="mt-2 text-xs font-semibold text-[#2f5fe3] hover:text-[#244dcb]"
                                onClick={() => {
                                    setUserCustomState(false);
                                    setUserCustomCity(false);
                                    onStateChange("");
                                    onCityChange("");
                                }}
                            >
                                Choose from India state list
                            </button>
                        )}
                    </>
                )}
            </div>

            <div>
                <label htmlFor={`${prefix}-city`} className={FIELD_LABEL_CLASS}>City</label>
                {isIndia && stateMode === "select" && cityMode === "select" ? (
                    <>
                        <CustomSelect
                            id={`${prefix}-city`}
                            value={resolvedCityValue}
                            options={citySelectOptions}
                            placeholder={!hasState ? "Select state first" : loadingCities ? "Loading cities..." : "Select city"}
                            required
                            disabled={!hasState || loadingCities}
                            searchable
                            onChange={(value) => {
                                if (value === CUSTOM_LOCATION_VALUE) {
                                    setUserCustomCity(true);
                                    onCityChange("");
                                    return;
                                }

                                onCityChange(value);
                            }}
                        />
                        <button
                            type="button"
                            disabled={!hasState}
                            className="mt-2 text-xs font-semibold text-[#2f5fe3] hover:text-[#244dcb] disabled:cursor-not-allowed disabled:text-[#98a2b3]"
                            onClick={() => {
                                if (!hasState) return;
                                setUserCustomCity(true);
                                onCityChange("");
                            }}
                        >
                            City not listed? Enter manually
                        </button>
                    </>
                ) : (
                    <>
                        <input
                            id={`${prefix}-city-custom`}
                            value={city ?? ""}
                            onChange={(event) => onCityChange(event.target.value)}
                            placeholder={!hasState ? "Select state first" : "Type city"}
                            disabled={!hasState}
                            className="w-full rounded-xl border border-[#d0d5dd] bg-white px-3.5 py-3 text-sm text-[#1f2937] focus:border-[#2f5fe3] focus:outline-none focus:ring-2 focus:ring-[#dce6ff] disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#98a2b3]"
                            required
                        />
                        {isIndia && stateMode === "select" && (
                            <button
                                type="button"
                                disabled={!hasState}
                                className="mt-2 text-xs font-semibold text-[#2f5fe3] hover:text-[#244dcb] disabled:cursor-not-allowed disabled:text-[#98a2b3]"
                                onClick={() => {
                                    if (!hasState) return;
                                    setUserCustomCity(false);
                                    onCityChange("");
                                }}
                            >
                                Choose from city list
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
