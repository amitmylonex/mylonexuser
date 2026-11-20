import base from "./builder.module.css";
import layout from "./line-layout.module.css";
import required from "./required.module.css";
import details from "./details.module.css";
import summary from "./summary.module.css";
import imports from "./import.module.css";
import responsive from "./responsive.module.css";
import counterSample from "./counter-sample.module.css";
import blend from "./blend.module.css";

// Keep styling files focused while preserving selectors spanning page sections.
// An element receives each module's local form of the same semantic class.
const styles: Record<string, string> = {};
for (const section of [base, layout, required, details, summary, imports, counterSample, responsive, blend]) {
  for (const [name, value] of Object.entries(section)) {
    styles[name] = styles[name] ? `${styles[name]} ${value}` : value;
  }
}
export default styles;
