import Link from "../../shared/components/SiteLink";

export default function HeroActions() {
  return (
    <div className="hero-actions">
      <Link href="/auth/signup" className="hero-primary-action">
        Start Sourcing
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
      <Link href="/auth/login" className="hero-secondary-action">
        Supplier sign in
      </Link>
    </div>
  );
}
