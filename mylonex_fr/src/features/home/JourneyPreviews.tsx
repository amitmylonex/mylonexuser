import Image from "../../shared/components/SiteImage";
import Link from "../../shared/components/SiteLink";
import "./styles/journey-preview.css";

const rfq = {
  id: "RFQ-24718",
  quality: "30s viscose twill",
  blend: "100% viscose",
  gsm: 135,
  width: "58″",
  weave: "Twill",
  state: "RFD",
  quantity: "3,000 m",
  cycle: "Running",
  count: "30s × 30s",
  construction: "100 × 72",
};

const screens = [
  { title: "Share your requirement", action: "Create a requirement", href: "/buyer/inquiries/new", Preview: Requirement },
  { title: "See your fabric matches", action: "Explore fabrics", href: "/buyer/fabrics", Preview: Matches },
  { title: "Sample, approve, produce", action: "Start sourcing", href: "/auth/signup", Preview: Production },
];

function Requirement() {
  const fields = [
    ["Blend", rfq.blend], ["GSM", rfq.gsm], ["Weave", rfq.weave], ["Width", rfq.width],
    ["State", rfq.state], ["Quantity", rfq.quantity], ["Cycle", rfq.cycle], ["Count", rfq.count],
  ];
  return (
    <div className="journey-preview-columns journey-rfq-columns">
      <div className="journey-preview-pane">
        <h4>Buyer message</h4>
        <blockquote className="journey-source-message">
          <mark>{rfq.blend}</mark> {rfq.weave.toLowerCase()}<br />
          <mark>{rfq.count}</mark> · <mark>{rfq.construction}</mark><br />
          <mark>{rfq.gsm} GSM</mark> · <mark>{rfq.width}</mark><br />
          <mark>{rfq.state}</mark> · <mark>{rfq.quantity}</mark><br />
          Running production
        </blockquote>
      </div>
      <div className="journey-preview-pane">
        <h4>Extracted RFQ fields</h4>
        <dl className="journey-preview-fields">
          {fields.map(([name, value]) => (
            <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Matches() {
  return (
    <>
      <p className="journey-preview-summary">{rfq.quality} · {rfq.quantity}</p>
      <table className="journey-match-table">
        <caption className="sr-only">Exact and close matches for {rfq.id}</caption>
        <thead><tr><th scope="col">Match</th><th scope="col">GSM</th><th scope="col">Width</th><th scope="col">State</th></tr></thead>
        <tbody>
          <tr><th scope="row"><span className="journey-status">Exact</span></th><td>{rfq.gsm}</td><td>{rfq.width}</td><td>{rfq.state}</td></tr>
          <tr><th scope="row">Close · GSM</th><td><mark>132</mark></td><td>{rfq.width}</td><td>{rfq.state}</td></tr>
          <tr><th scope="row">Close · Width</th><td>{rfq.gsm}</td><td><mark>56″</mark></td><td>{rfq.state}</td></tr>
        </tbody>
      </table>
      <p className="journey-preview-note">Highlighted values differ from your requirement.</p>
    </>
  );
}

const sampleTimeline = [
  ["Requested", "Day 0 · 2 m sample"],
  ["Dispatched", "Day 1 · AWB •4821"],
  ["Received", "Day 3 · Buyer delivery"],
];

function Production() {
  return (
    <>
      <p className="journey-preview-summary">{rfq.quality} · {rfq.quantity}</p>
      <div className="journey-preview-columns">
        <div className="journey-preview-pane">
          <h4>Sample timeline</h4>
          <ol className="journey-sample-timeline">
            {sampleTimeline.map(([event, detail]) => (
              <li key={event}>
                <span className="journey-timeline-check" aria-hidden="true">✓</span>
                <div><strong>{event}</strong><small>{detail}</small></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="journey-preview-pane">
          <h4>Approval &amp; production</h4>
          <p className="journey-status journey-sample-approved">✓ Sample approved</p>
          <dl className="journey-preview-fields">
            <div><dt>Order</dt><dd>PO-1187</dd></div>
            <div><dt>Quantity</dt><dd>{rfq.quantity}</dd></div>
          </dl>
          <p className="journey-production-status"><span aria-hidden="true" /> In production</p>
        </div>
      </div>
    </>
  );
}

export default function JourneyPreviews() {
  return (
    <ol className="journey-stages" role="list" aria-label="Sourcing steps">
      {screens.map(({ title, href, action, Preview }, index) => {
        const number = `0${index + 1}`;
        return (
          <li key={title}>
            <canvas className="journey-piece" aria-hidden="true" />
            <div className="journey-spec-card">
              <div className="journey-preview-header">
                <span className="journey-preview-number" aria-hidden="true">{number}</span>
                <h3>{title}</h3>
                <span className="journey-preview-step">Step {number} / 03</span>
              </div>
              <div className="journey-preview-bar">
                <span className="journey-preview-brand">
                  <Image src="/images/mylonex-clean.svg" width={17} height={17} alt="" /> MyloNex
                </span>
                <span>{rfq.id} · Line 1</span>
              </div>
              <div className="journey-preview-body"><Preview /></div>
              <div className="journey-preview-footer">
                <span>Illustrative RFQ<span className="journey-preview-footer-id"> · {rfq.id}</span></span>
                <Link href={href}>{action} <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
