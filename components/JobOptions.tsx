'use client'

import { RateCardItem } from '@/lib/types'

interface Props {
  item: RateCardItem
  copies: number
  isColor: boolean
  isDuplex: boolean
  onCopiesChange: (n: number) => void
  onColorChange: (v: boolean) => void
  onDuplexChange: (v: boolean) => void
}

export default function JobOptions({
  item,
  copies,
  isColor,
  isDuplex,
  onCopiesChange,
  onColorChange,
  onDuplexChange,
}: Props) {
  return (
    <div className="divide-y divide-line rounded-card border border-line bg-white">
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="text-sm font-medium">Copies</span>
        <div className="flex items-center gap-3">
          <button
            aria-label="Decrease copies"
            onClick={() => onCopiesChange(Math.max(1, copies - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-lg leading-none active:bg-paper"
          >
            &minus;
          </button>
          <span className="w-5 text-center text-sm font-medium">{copies}</span>
          <button
            aria-label="Increase copies"
            onClick={() => onCopiesChange(copies + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-lg leading-none active:bg-paper"
          >
            +
          </button>
        </div>
      </div>

      {item.price_color != null && (
        <label className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium">Print in color</span>
          <input
            type="checkbox"
            checked={isColor}
            onChange={(e) => onColorChange(e.target.checked)}
            className="h-5 w-5 accent-brand-600"
          />
        </label>
      )}

      {item.supports_duplex && (
        <label className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium">Print both sides</span>
          <input
            type="checkbox"
            checked={isDuplex}
            onChange={(e) => onDuplexChange(e.target.checked)}
            className="h-5 w-5 accent-brand-600"
          />
        </label>
      )}
    </div>
  )
}
