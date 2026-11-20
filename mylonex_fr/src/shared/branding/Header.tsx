import SignOutButton from '../components/SignOutButton'
import { useState } from "react";
import Link from "../components/SiteLink";
import LogoMark from "./LogoMark";
import type { Account } from "../session/portal-api";
import { paths } from "../../routes";


type HeaderProps = {
  user: Account | null;
  onSignOut: () => Promise<void>;
  isLanding?: boolean;
};

const navLinks = [
  { label: "Fabrics", href: "/buyer/fabrics" },
  { label: "AI Assistant", href: "/buyer/chat" },
];

const companyLinks = [
  { label: "How It Works", href: "/how-it-works", desc: "Our 3-way textile ecosystem" },
  { label: "Supplier Portal", href: "/supplier/dashboard", desc: "For mills, weavers & dealers" },
];

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform duration-200 group-hover:rotate-180"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-slate-400 transition-transform group-hover/item:translate-x-1 group-hover/item:text-primary"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function Header({ user, onSignOut, isLanding = false }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const dashboardHref = user ? paths.dashboards[user.role] : paths.login;

  const headerClass = isLanding
    ? "fixed top-0 w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-xl border-b border-[var(--landing-border)]"
    : "sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all";

  return (
    <header className={headerClass}>
      <div className="container-shell relative flex items-center justify-between py-3.5">
        {/* Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <LogoMark size={34} className="transition-transform group-hover:scale-105" />
          <div className="flex flex-col leading-none">
            <span className="font-heading text-xl font-black tracking-tight text-slate-900">
              MyloNex
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden items-center gap-1 lg:flex lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-slate-950 transition-colors"
          >
            Home
          </Link>

          {/* Explore Dropdown */}
          <div className="relative group inline-flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-slate-950 transition-colors"
              aria-haspopup="true"
            >
              <span>Explore</span>
              <ChevronDownIcon />
            </button>

            <div className="invisible absolute left-0 top-full z-20 mt-2 w-64 origin-top-left scale-95 rounded-2xl border border-slate-200/90 bg-white p-2 opacity-0 shadow-large backdrop-blur-lg transition-all duration-200 ease-out group-hover:visible group-hover:scale-100 group-hover:opacity-100">
              {companyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group/item flex items-center justify-between rounded-xl p-2.5 transition duration-150 hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover/item:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <ArrowRightIcon />
                </Link>
              ))}
            </div>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100/70 hover:text-slate-950 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth / User State */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <span className="text-xs text-slate-500 font-medium max-w-[160px] truncate">
                {user.fullName || user.email}
              </span>
              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 hover:text-slate-950 transition-colors"
              >
                Dashboard
              </Link>
              <SignOutButton className="inline-flex items-center justify-center text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors px-2 py-1" onConfirm={onSignOut} />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center text-sm font-semibold text-slate-700 hover:text-slate-950 px-3.5 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-primary hover:bg-[#204ecb] text-white px-5 py-2 text-sm font-semibold shadow-[0_4px_14px_-2px_rgba(47,95,227,0.4)] hover:shadow-[0_6px_20px_-2px_rgba(47,95,227,0.5)] transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl border border-slate-200/90 bg-white p-2 text-slate-700 shadow-2xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 lg:hidden"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="Toggle navigation"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="border-t border-slate-200/80 bg-white/98 backdrop-blur-xl lg:hidden">
          <div className="container-shell flex flex-col gap-1 py-4">
            <Link
              href="/"
              className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>

            <div className="space-y-1 py-1">
              <div className="px-3.5 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                Explore
              </div>
              {companyLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-3.5 py-2 pl-5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-4">
              {user ? (
                <>
                  <div className="px-3.5 py-1 text-xs text-slate-500 truncate">
                    {user.fullName || user.email}
                  </div>
                  <Link
                    href={dashboardHref}
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-semibold text-slate-900"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <SignOutButton className="flex items-center justify-center rounded-xl py-2 text-sm font-medium text-red-600 hover:bg-red-50" onConfirm={onSignOut} />
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-800"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="flex items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white shadow-soft"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
