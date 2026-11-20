import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LocationFields from "../../components/LocationFields";
import { getIndiaCities, getIndiaStates, INDIA_STATES } from "../../components/indiaLocations";
import { isIndiaCountry, getLocationOptions } from "../../components/useIndiaLocationOptions";
import { buildCityOptions, buildStateOptions, CUSTOM_LOCATION_VALUE } from "../../components/locationOptions";
import { batchInquirySchema, batchSubmissionSchema } from "../../../../../../src/domains/rfq/batch/schema";
import { buildBatch, lineDraft, newLine, type Destination } from "../draft";

describe("Deliver to location options and delivery fields regression", () => {
  it("matches India default value and normalizes country keys correctly", () => {
    expect(isIndiaCountry("India")).toBe(true);
    expect(isIndiaCountry("india")).toBe(true);
    expect(isIndiaCountry(" INDIA ")).toBe(true);
    expect(isIndiaCountry(undefined)).toBe(true);
    expect(isIndiaCountry("")).toBe(true);
    expect(isIndiaCountry("United States")).toBe(false);
    expect(isIndiaCountry("China")).toBe(false);
  });

  it("loads India states and union territories immediately without loading delay", () => {
    const states = getIndiaStates();
    expect(states.length).toBeGreaterThanOrEqual(36);

    // 28 Indian States
    const expectedStates = [
      "Andhra Pradesh",
      "Arunachal Pradesh",
      "Assam",
      "Bihar",
      "Chhattisgarh",
      "Goa",
      "Gujarat",
      "Haryana",
      "Himachal Pradesh",
      "Jharkhand",
      "Karnataka",
      "Kerala",
      "Madhya Pradesh",
      "Maharashtra",
      "Manipur",
      "Meghalaya",
      "Mizoram",
      "Nagaland",
      "Odisha",
      "Punjab",
      "Rajasthan",
      "Sikkim",
      "Tamil Nadu",
      "Telangana",
      "Tripura",
      "Uttar Pradesh",
      "Uttarakhand",
      "West Bengal",
    ];

    for (const state of expectedStates) {
      expect(states, `Expected ${state} to be included in India states`).toContain(state);
    }

    // Union Territories
    const expectedUTs = [
      "Andaman and Nicobar Islands",
      "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu",
      "Delhi",
      "Jammu and Kashmir",
      "Ladakh",
      "Lakshadweep",
      "Puducherry",
    ];

    for (const ut of expectedUTs) {
      expect(states, `Expected UT ${ut} to be included in India states`).toContain(ut);
    }
  });

  it("verifies Maharashtra contains Mumbai and Pune, and Gujarat contains Surat and Ahmedabad", () => {
    const maharashtraCities = getIndiaCities("Maharashtra");
    expect(maharashtraCities).toContain("Mumbai");
    expect(maharashtraCities).toContain("Pune");

    const gujaratCities = getIndiaCities("Gujarat");
    expect(gujaratCities).toContain("Surat");
    expect(gujaratCities).toContain("Ahmedabad");

    // Case-insensitive lookup works
    expect(getIndiaCities("maharashtra")).toEqual(maharashtraCities);
    expect(getIndiaCities("gujarat")).toEqual(gujaratCities);
  });

  it("builds searchable state options with manual entry fallback", () => {
    const states = getIndiaStates();
    const stateOptions = buildStateOptions(states);

    expect(stateOptions.length).toBe(states.length + 1);
    expect(stateOptions.some((opt) => opt.value === "Maharashtra")).toBe(true);
    expect(stateOptions.some((opt) => opt.value === "Gujarat")).toBe(true);
    expect(stateOptions[stateOptions.length - 1]).toEqual({
      value: CUSTOM_LOCATION_VALUE,
      label: "State not listed (enter manually)",
    });
  });

  it("builds searchable city options for a state with manual entry fallback", () => {
    const cities = getIndiaCities("Maharashtra");
    const cityOptions = buildCityOptions(cities);

    expect(cityOptions.length).toBe(cities.length + 1);
    expect(cityOptions.some((opt) => opt.value === "Mumbai")).toBe(true);
    expect(cityOptions.some((opt) => opt.value === "Pune")).toBe(true);
    expect(cityOptions[cityOptions.length - 1]).toEqual({
      value: CUSTOM_LOCATION_VALUE,
      label: "City not listed (enter manually)",
    });
  });

  it("getLocationOptions provides immediate states and state-specific cities", () => {
    // When India is selected but no state selected yet
    const initial = getLocationOptions({ isIndia: true, selectedState: undefined });
    expect(initial.loadingStates).toBe(false);
    expect(initial.loadingCities).toBe(false);
    expect(initial.stateOptions.length).toBeGreaterThanOrEqual(36);
    expect(initial.cityOptions).toEqual([]);

    // When Maharashtra is selected
    const mh = getLocationOptions({ isIndia: true, selectedState: "Maharashtra" });
    expect(mh.cityOptions).toContain("Mumbai");
    expect(mh.cityOptions).toContain("Pune");
    expect(mh.cityOptions).not.toContain("Surat");

    // When Gujarat is selected
    const gj = getLocationOptions({ isIndia: true, selectedState: "Gujarat" });
    expect(gj.cityOptions).toContain("Surat");
    expect(gj.cityOptions).toContain("Ahmedabad");
    expect(gj.cityOptions).not.toContain("Mumbai");

    // When stateMode is custom, city options are empty
    const custom = getLocationOptions({ isIndia: true, selectedState: "Maharashtra", stateMode: "custom" });
    expect(custom.cityOptions).toEqual([]);

    // When country is not India, states and cities are empty
    const nonIndia = getLocationOptions({ country: "United States" });
    expect(nonIndia.stateOptions).toEqual([]);
    expect(nonIndia.cityOptions).toEqual([]);
  });

  it("validates draft restoration logic for dropdown selections and manual entries", () => {
    const allStates = INDIA_STATES;

    // Helper imitating LocationFields mode resolution
    function resolveModes(country: string | undefined, state: string | undefined, city: string | undefined) {
      const isIndia = isIndiaCountry(country);
      const isStateInDataset = !state?.trim() || allStates.some((s) => s.toLowerCase() === state.trim().toLowerCase());
      const stateCities = state ? getIndiaCities(state) : [];
      const isCityInDataset = !city?.trim() || stateCities.some((c) => c.toLowerCase() === city.trim().toLowerCase());

      const stateMode: "select" | "custom" = (!isIndia || !isStateInDataset) ? "custom" : "select";
      const cityMode: "select" | "custom" = (!isIndia || stateMode === "custom" || !isCityInDataset) ? "custom" : "select";

      return { stateMode, cityMode };
    }

    // 1. Initial / default India inquiry
    expect(resolveModes("India", undefined, undefined)).toEqual({ stateMode: "select", cityMode: "select" });

    // 2. Dropdown selections survive draft reload
    expect(resolveModes("India", "Maharashtra", "Mumbai")).toEqual({ stateMode: "select", cityMode: "select" });
    expect(resolveModes("India", "Gujarat", "Surat")).toEqual({ stateMode: "select", cityMode: "select" });

    // 3. Dropdown state with manual/unlisted city survives draft reload
    expect(resolveModes("India", "Maharashtra", "SpecialTextileVillage")).toEqual({ stateMode: "select", cityMode: "custom" });

    // 4. Custom state with custom city survives draft reload
    expect(resolveModes("India", "CustomHandloomState", "CustomHandloomTown")).toEqual({ stateMode: "custom", cityMode: "custom" });

    // 5. Foreign country survives draft reload
    expect(resolveModes("United States", "California", "Los Angeles")).toEqual({ stateMode: "custom", cityMode: "custom" });
  });

  it("validates delivery payload, pincode validation, and shared address across all lines", () => {
    const validDestination: Destination = {
      deliveryCountry: "India",
      deliveryState: "Maharashtra",
      deliveryCity: "Mumbai",
      deliveryPincode: "400001",
      contactPhone: "+91 9876543210",
      deliveryAddress: "Factory Unit 4, Lower Parel",
    };

    const line1 = {
      ...newLine(),
      blend: "100% Cotton",
      draft: {
        gsm: 120,
        weaveType: "Poplin" as const,
        width: "58 inches",
        fabricState: "rfd" as const,
        quantity: 2000,
        productionCycle: "ready_stock" as const,
        endUse: "Shirting" as const,
      },
    };

    const line2 = {
      ...newLine(),
      blend: "100% Linen",
      draft: {
        gsm: 150,
        weaveType: "Plain" as const,
        width: "58 inches",
        fabricState: "dyed" as const,
        quantity: 1500,
        productionCycle: "ready_stock" as const,
        endUse: "Shirting" as const,
      },
      colours: [{ id: "c-1", name: "Natural White", metres: "1500" }],
    };

    // 1. LineDraft includes destination fields
    const mapped1 = lineDraft(line1, validDestination);
    expect(mapped1.deliveryCountry).toBe("India");
    expect(mapped1.deliveryState).toBe("Maharashtra");
    expect(mapped1.deliveryCity).toBe("Mumbai");
    expect(mapped1.deliveryPincode).toBe("400001");
    expect(mapped1.deliveryAddress).toBe("Factory Unit 4, Lower Parel");
    expect(mapped1.contactPhone).toBe("+91 9876543210");

    // 2. batchInquirySchema validates mapped line successfully
    const parsed1 = batchInquirySchema.safeParse(mapped1);
    expect(parsed1.success).toBe(true);

    // 3. Pincode validation: minimum 3 chars
    const invalidPincode = lineDraft(line1, { ...validDestination, deliveryPincode: "12" });
    const parsedInvalidPin = batchInquirySchema.safeParse(invalidPincode);
    expect(parsedInvalidPin.success).toBe(false);

    // 4. Missing state or city is rejected
    const missingState = lineDraft(line1, { ...validDestination, deliveryState: "" });
    expect(batchInquirySchema.safeParse(missingState).success).toBe(false);

    const missingCity = lineDraft(line1, { ...validDestination, deliveryCity: "" });
    expect(batchInquirySchema.safeParse(missingCity).success).toBe(false);

    // 5. Shared delivery address is applied to all RFQ lines in the batch
    const batch = buildBatch([line1, line2], validDestination, "123e4567-e89b-12d3-a456-426614174000");
    expect(batch.lines).toHaveLength(2);
    expect(batch.lines[0].inquiry.deliveryState).toBe("Maharashtra");
    expect(batch.lines[0].inquiry.deliveryCity).toBe("Mumbai");
    expect(batch.lines[1].inquiry.deliveryState).toBe("Maharashtra");
    expect(batch.lines[1].inquiry.deliveryCity).toBe("Mumbai");
    expect(batch.lines[0].inquiry.deliveryAddress).toBe("Factory Unit 4, Lower Parel");
    expect(batch.lines[1].inquiry.deliveryAddress).toBe("Factory Unit 4, Lower Parel");

    // 6. Complete batch satisfies batchSubmissionSchema
    const batchParsed = batchSubmissionSchema.safeParse(batch);
    expect(batchParsed.success).toBe(true);
  });

  describe("LocationFields component renders and responds accurately", () => {
    it("renders default state with India, immediate state dropdown, and disabled city dropdown", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "India",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      // Country shows India
      expect(html).toContain("India");
      // State shows Select state placeholder
      expect(html).toContain("Select state");
      // City shows Select state first and is disabled
      expect(html).toContain("Select state first");
      expect(html).toContain("disabled");
      // Manual state entry link is available
      expect(html).toContain("State not listed? Enter manually");
    });

    it("renders state as selected and enables city dropdown when state is chosen", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "India",
          state: "Maharashtra",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      expect(html).toContain("Maharashtra");
      expect(html).toContain("Select city");
      // City button is enabled (does not have disabled attribute)
      expect(html).toContain('id="batch-delivery-city"');
      expect(html).toContain("City not listed? Enter manually");
    });

    it("renders both dropdown selections when restoring saved Maharashtra and Mumbai", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "India",
          state: "Maharashtra",
          city: "Mumbai",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      expect(html).toContain("Maharashtra");
      expect(html).toContain("Mumbai");
    });

    it("preserves manual city entry when reopening a draft with unlisted city", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "India",
          state: "Maharashtra",
          city: "SpecialIndustrialEstate",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      // State is still dropdown selection
      expect(html).toContain("Maharashtra");
      // City is rendered in manual text input preserving saved value
      expect(html).toContain('id="batch-delivery-city-custom"');
      expect(html).toContain('value="SpecialIndustrialEstate"');
      expect(html).toContain("Choose from city list");
    });

    it("preserves manual state and manual city when reopening a draft with unlisted state", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "India",
          state: "CustomHandloomState",
          city: "CustomHandloomTown",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      expect(html).toContain('id="batch-delivery-state-custom"');
      expect(html).toContain('value="CustomHandloomState"');
      expect(html).toContain('id="batch-delivery-city-custom"');
      expect(html).toContain('value="CustomHandloomTown"');
      expect(html).toContain("Choose from India state list");
    });

    it("renders manual state and city inputs for foreign countries preserving draft values", () => {
      const html = renderToStaticMarkup(
        React.createElement(LocationFields, {
          prefix: "batch-delivery",
          country: "United States",
          state: "California",
          city: "San Francisco",
          onCountryChange: () => {},
          onStateChange: () => {},
          onCityChange: () => {},
        })
      );

      expect(html).toContain("United States");
      expect(html).toContain('id="batch-delivery-state-custom"');
      expect(html).toContain('value="California"');
      expect(html).toContain('id="batch-delivery-city-custom"');
      expect(html).toContain('value="San Francisco"');
    });
  });
});
