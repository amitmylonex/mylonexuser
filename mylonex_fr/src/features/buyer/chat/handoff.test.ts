import { describe, expect, it } from 'vitest'
import { requirementText } from './handoff'
import { parseText } from '../../../legacy-rfq/app/buyer/inquiries/new/builder/parse-text'

describe('chat requirement handoff to the existing RFQ parser', () => {
  it('preserves stated specifications through review/import intake', () => {
    const source = requirementText({ fiberType: '100% Cotton', weave: 'Twill', gsmMin: 150, gsmMax: 150, width: 58, quantity: 500 })
    const rows = parseText(source)
    expect(rows).toHaveLength(1)
    expect(rows[0].draft.gsm).toBe(150)
    expect(rows[0].draft.quantity).toBe(500)
    expect(rows[0].draft.width).toBe('58 inches')
    expect(rows[0].draft.weaveType).toMatch(/twill/i)
    expect(rows[0].blend).toBe('100% Cotton')
  })
  it('preserves bounds and leaves absent width, quantity and delivery absent', () => {
    const source = requirementText({ fiberType: 'Cotton', gsmMax: 200 })
    expect(source).toBe('Cotton; Up to 200 GSM')
    expect(source).not.toMatch(/meters|inches|Delivery/)
    expect(requirementText({ gsmMin: 140 })).toBe('At least 140 GSM')
    expect(requirementText({ gsmMin: 140, gsmMax: 200 })).toBe('GSM: 140–200')
  })
})
