import type { CustomSelectOption } from "./CustomSelect";

export const CUSTOM_LOCATION_VALUE = "__custom__";

export const COUNTRY_OPTIONS: CustomSelectOption[] = [
    { value: "India", label: "India" },
    { value: "Bangladesh", label: "Bangladesh" },
    { value: "China", label: "China" },
    { value: "Pakistan", label: "Pakistan" },
    { value: "Sri Lanka", label: "Sri Lanka" },
    { value: "United Arab Emirates", label: "United Arab Emirates" },
    { value: "United States", label: "United States" },
    { value: "Other", label: "Other" },
];

export function buildStateOptions(states: string[]): CustomSelectOption[] {
    return [
        ...states.map((state) => ({ value: state, label: state })),
        { value: CUSTOM_LOCATION_VALUE, label: "State not listed (enter manually)" },
    ];
}

export function buildCityOptions(cities: string[]): CustomSelectOption[] {
    return [
        ...cities.map((city) => ({ value: city, label: city })),
        { value: CUSTOM_LOCATION_VALUE, label: "City not listed (enter manually)" },
    ];
}
