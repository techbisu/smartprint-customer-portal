import { RateCardItem } from './types'

export interface PricingInput {
  item: RateCardItem
  pages: number
  copies: number
  isColor: boolean
  isDuplex: boolean
}

export interface PricingBreakdown {
  unitPrice: number
  billedUnits: number
  copies: number
  total: number
}

/**
 * Computes the price for one print job.
 *
 * For per_page pricing, duplex jobs are billed per physical SHEET, not
 * per printed side — a 10-page document printed duplex uses 5 sheets,
 * and that's what the customer is charged for. This matches how print
 * shops actually price duplex jobs (they're paying for paper + toner
 * passes, not page count).
 */
export function calculatePrice({ item, pages, copies, isColor, isDuplex }: PricingInput): PricingBreakdown {
  const safePages = Math.max(1, Math.floor(pages) || 1)
  const safeCopies = Math.max(1, Math.floor(copies) || 1)

  const unitPrice = isColor && item.price_color != null ? item.price_color : item.price_bw

  let billedUnits = 1
  if (item.pricing_model === 'per_page') {
    billedUnits = isDuplex && item.supports_duplex ? Math.ceil(safePages / 2) : safePages
  } else if (item.pricing_model === 'per_copy') {
    billedUnits = 1 // copies are multiplied in separately below
  } else {
    billedUnits = 1 // flat_fee
  }

  const total = unitPrice * billedUnits * safeCopies

  return {
    unitPrice,
    billedUnits,
    copies: safeCopies,
    total: Math.round(total * 100) / 100,
  }
}

export function formatRupees(amount: number): string {
  return `\u20B9${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
