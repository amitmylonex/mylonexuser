import LocationFields from "../components/LocationFields";
import { Field } from "./Fields";
import type { Destination as DestinationValue } from "./draft";
import styles from "./styles";

export default function Destination({ value, onChange }: { value: DestinationValue; onChange: (_value: DestinationValue) => void }) {
  return (
    <section className={styles.destination} aria-labelledby="rfq-destination">
      <div className={styles.sectionHeading}>
        <h2 id="rfq-destination">Deliver to</h2>
        <span>Applies to every line</span>
      </div>
      <LocationFields
        prefix="batch-delivery"
        country={value.deliveryCountry || "India"}
        state={value.deliveryState}
        city={value.deliveryCity}
        onCountryChange={(deliveryCountry) => onChange({ deliveryCountry, deliveryState: undefined, deliveryCity: undefined })}
        onStateChange={(deliveryState) => onChange({ deliveryState, deliveryCity: undefined })}
        onCityChange={(deliveryCity) => onChange({ deliveryCity })}
      />
      <div className={styles.twoColumns}>
        <Field label="Pincode" required>
          <input value={value.deliveryPincode || ""} onChange={(event) => onChange({ deliveryPincode: event.target.value })} />
        </Field>
        <Field label="Contact phone" required>
          <input
            type="tel"
            value={value.contactPhone || ""}
            placeholder="e.g. +91 9876543210"
            onChange={(event) => onChange({ contactPhone: event.target.value })}
          />
        </Field>
      </div>
      <Field label="Street address / factory · optional">
        <textarea
          rows={2}
          value={value.deliveryAddress || ""}
          onChange={(event) => onChange({ deliveryAddress: event.target.value || undefined })}
        />
      </Field>
    </section>
  );
}
