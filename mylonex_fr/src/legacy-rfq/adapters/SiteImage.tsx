import type { ComponentProps } from 'react'

export default function SiteImage(props: ComponentProps<'img'> & { unoptimized?: boolean }) {
  const { unoptimized: _, ...image } = props
  return <img {...image} alt={image.alt ?? ''} />
}
