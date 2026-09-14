'use client'

import { formatRupees } from '@/lib/pricing'

interface Props {
  total: number
  billedUnits: number
  unitLabel: string
  copies: number
  disabled: boolean
  submitting: boolean
  submittingMethod?: 'upi' | 'counter'
  onPayUpi: () => void
  onPayCounter: () => void
}

export default function PriceBar({
  total,
  billedUnits,
  unitLabel,
  copies,
  disabled,
  submitting,
  submittingMethod,
  onPayUpi,
  onPayCounter,
}: Props) {
  return (
    <div
      className="receipt-edge fixed inset-x-0 bottom-0 border-t border-line bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+14px)] pt-4 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]"
      style={{ ['--receipt-bg' as string]: '#F7F7F5' }}
    >
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <p className="text-xs text-muted">
            {billedUnits} {unitLabel}
            {copies > 1 ? ` \u00D7 ${copies} copies` : ''}
          </p>
          <p className="text-xl font-semibold">{formatRupees(total)}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onPayCounter}
            disabled={disabled || submitting}
            className="rounded-full border border-line px-4 py-2.5 text-sm font-medium disabled:opacity-40"
          >
            {submitting && submittingMethod === 'counter' ? 'Submitting…' : 'Pay at counter'}
          </button>
          <button
            onClick={onPayUpi}
            disabled={disabled || submitting}
            className="rounded-full bg-marigold-500 px-5 py-2.5 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {submitting && submittingMethod === 'upi' ? 'Opening UPI…' : 'Pay via UPI'}
          </button>
        </div>
      </div>
    </div>
  )
}
