import type { ComponentProps } from 'react';

type SiteImageProps = ComponentProps<'img'> & { fill?: boolean; priority?: boolean };

export default function SiteImage({ fill, priority, style, loading, ...props }: SiteImageProps) {
  return <img {...props}
    loading={priority ? 'eager' : loading ?? 'lazy'}
    fetchPriority={priority ? 'high' : undefined}
    style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
  />;
}
