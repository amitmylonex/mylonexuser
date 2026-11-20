import Link from "../components/SiteLink";
import Logo from "./Logo";

const buyerLinks = [
  { label: "Browse Fabrics", href: "/buyer/fabrics" },
  { label: "Post an RFQ", href: "/buyer/inquiries/new" },
  { label: "Track Inquiries", href: "/buyer/inquiries" },
  { label: "Buyer Dashboard", href: "/buyer/dashboard" },
];

const supplierLinks = [
  { label: "Upload Catalog", href: "/supplier/catalog/upload" },
  { label: "Manage Inquiries", href: "/supplier/inquiries" },
  { label: "Supplier Dashboard", href: "/supplier/dashboard" },
  { label: "Update Profile", href: "/supplier/profile" },
];

const trustPillars = [
  {
    title: "Payment Protection",
    description: "Secure escrow and verified milestone workflows for every approved order.",
  },
  {
    title: "Trusted Suppliers",
    description: "KYC and quality-screened mills, dealers, and processing houses.",
  },
  {
    title: "Production Visibility",
    description: "Milestone-by-milestone status updates from loom to final dispatch.",
  },
];

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white">
      {/* Top Banner */}
      <div className="border-b border-slate-200/60 bg-brand-deep text-white">
        <div className="container-shell grid gap-8 py-12 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-3.5">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-white/90">
              Built for Textile Trade
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold leading-tight text-white">
              Source fabrics and scale supply with confidence.
            </h3>
            <p className="max-w-xl text-sm leading-relaxed text-blue-100">
              Connect verified buyers, suppliers, and operations teams in one platform engineered for speed, quality consistency, and transactional transparency.
            </p>
          </div>
          {trustPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-xs"
            >
              <h4 className="font-bold text-white text-base">{pillar.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-blue-100/80">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container-shell grid gap-10 py-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo href="/" />
          <p className="max-w-sm text-xs leading-relaxed text-slate-500">
            MyloNex digitizes B2B textile sourcing with structured RFQs, verified supplier discovery, rapid sample requests, and centralized transaction workflows.
          </p>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              India-wide Mill Network
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            For Buyers
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            {buyerLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            For Suppliers
          </h4>
          <ul className="space-y-2 text-sm text-slate-600">
            {supplierLinks.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3 text-sm text-slate-600">
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Contact
          </h4>
          <p className="text-xs text-slate-500">Phone: +91 97697 88099</p>
          <p className="text-xs text-slate-500">Email: hello@mylonex.com</p>
          <p className="text-xs text-slate-500">Mumbai, Maharashtra, India</p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-100">
        <div className="container-shell flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-400 sm:flex-row">
          <span>© {year} MyloNex by MyloNex Textiles Pvt Ltd</span>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-primary transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="/how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
