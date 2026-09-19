'use client'

import { RateCardItem } from '@/lib/types'
import { formatRupees } from '@/lib/pricing'
import { Palette, Copy, Layers } from 'lucide-react'

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
    <div className="divide-y divide-line rounded-2xl border border-line bg-white shadow-2xs overflow-hidden">
      {/* Number of Copies */}
      <div className="flex items-center justify-between px-4 py-3.5 min-h-[52px]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper text-muted">
            <Copy className="h-4 w-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-ink block">Number of Copies</span>
            <span className="text-[11px] text-muted">Total set multiplier</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease copies"
            onClick={() => onCopiesChange(Math.max(1, copies - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-paper text-lg font-bold text-ink active:scale-95 transition-all"
          >
            &minus;
          </button>
          <span className="w-8 text-center text-base font-bold text-ink">{copies}</span>
          <button
            type="button"
            aria-label="Increase copies"
            onClick={() => onCopiesChange(copies + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-paper text-lg font-bold text-ink active:scale-95 transition-all"
          >
            +
          </button>
        </div>
      </div>

      {/* Color vs B&W Option */}
      {item.price_color != null && (
        <label className="flex items-center justify-between px-4 py-3.5 min-h-[52px] cursor-pointer hover:bg-paper/40 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-marigold-50 text-marigold-600">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-ink block">Color Print</span>
              <span className="text-[11px] text-muted">
                {formatRupees(item.price_color)}/unit vs {formatRupees(item.price_bw)} B&W
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isColor}
            onChange={(e) => onColorChange(e.target.checked)}
            className="h-6 w-6 rounded-md text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </label>
      )}

      {/* Duplex (Double Sided) */}
      {item.supports_duplex && (
        <label className="flex items-center justify-between px-4 py-3.5 min-h-[52px] cursor-pointer hover:bg-paper/40 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-ink block">Double-Sided (Duplex)</span>
              <span className="text-[11px] text-muted">Prints on both sides of each sheet</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isDuplex}
            onChange={(e) => onDuplexChange(e.target.checked)}
            className="h-6 w-6 rounded-md text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </label>
      )}
    </div>
  )
}
