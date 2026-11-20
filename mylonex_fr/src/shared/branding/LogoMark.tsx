import SiteImage from '../components/SiteImage';

export default function LogoMark({ size, alt = '', className = '' }: {
  size: number;
  alt?: string;
  className?: string;
}) {
  return <SiteImage src="/images/mylonex.svg" alt={alt} width={size} height={size}
    className={`shrink-0 object-contain ${className}`} priority />;
}
