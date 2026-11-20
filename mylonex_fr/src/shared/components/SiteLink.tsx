import type { ComponentProps } from 'react';
import { isLocalPath } from '../../routes';

const legacyOrigin = (import.meta.env.VITE_LEGACY_SITE_URL || 'https://www.mylonex.com').replace(/\/$/, '');

export default function SiteLink({ href, ...props }: ComponentProps<'a'>) {
  const path = href?.split(/[?#]/, 1)[0];
  const destination = href?.startsWith('/') && !href.startsWith('//') && path && !isLocalPath(path)
    ? legacyOrigin + href
    : href;
  return <a {...props} href={destination} />;
}
