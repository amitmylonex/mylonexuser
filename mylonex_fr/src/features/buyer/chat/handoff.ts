export function requirementText(r: Record<string, string | number>) {
  const gsm = r.gsmMin && r.gsmMax
    ? `GSM: ${r.gsmMin}${r.gsmMax !== r.gsmMin ? '–' + r.gsmMax : ''}`
    : r.gsmMin ? `At least ${r.gsmMin} GSM` : r.gsmMax ? `Up to ${r.gsmMax} GSM` : ''
  return [
    [r.fiberType, r.weave].filter(Boolean).join(' '), gsm,
    r.width ? `Width: ${r.width} inches` : '', r.quantity ? `Quantity: ${r.quantity} meters` : '',
    r.deliveryTimeline ? `Delivery: ${r.deliveryTimeline}` : '', r.notes || '',
  ].filter(Boolean).join('; ')
}
