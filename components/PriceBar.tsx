'use client'

import { useState, useEffect, useRef } from 'react'
import { formatRupees } from '@/lib/pricing'
import {
  ArrowRight,
  Loader2,
  Upload,
  ChevronUp,
  ChevronDown,
  Info,
  ShieldCheck,
  CheckCircle2,
  Store,
  Zap,
  Sparkles,
  X,
} from 'lucide-react'

export interface BreakdownItem {
  id: string
  name: string
  details: string
  amount: number
}

interface PriceBarProps {
  total: number
  billedUnits: number
  unitLabel: string
  copies: number
  disabled: boolean
  hasFile?: boolean
  fileName?: string
  serviceName?: string
  isColor?: boolean
  isDuplex?: boolean
  unitPrice?: number
  isOnline?: boolean
  detectingPages?: boolean
  submitting?: boolean
  submittingMethod?: 'upi' | 'counter' | 'cashfree'
  itemsCount?: number
  itemsBreakdown?: BreakdownItem[]
  onPayClick: () => void
  onUploadClick?: () => void
}

export default function PriceBar({
  total,
  billedUnits,
  unitLabel,
  copies,
  disabled,
  hasFile = true,
  fileName,
  serviceName = 'Document Print',
  isColor = false,
  isDuplex = false,
  unitPrice,
  isOnline = true,
  detectingPages = false,
  submitting = false,
  submittingMethod,
  itemsCount = 1,
  itemsBreakdown,
  onPayClick,
  onUploadClick,
}: PriceBarProps) {
  const [showBreakdown, setShowBreakdown] = useState(false)
  const breakdownRef = useRef<HTMLDivElement>(null)

  // Close breakdown when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (breakdownRef.current && !breakdownRef.current.contains(e.target as Node)) {
        setShowBreakdown(false)
      }
    }
    if (showBreakdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showBreakdown])

  // Handle main action button click
  const handleActionClick = () => {
    if (!isOnline) return
    if (submitting || detectingPages) return

    if (!hasFile) {
      if (onUploadClick) {
        onUploadClick()
      } else {
        const input = document.getElementById('smartprint-file-input') as HTMLInputElement
        if (input) {
          input.click()
        } else {
          document.getElementById('upload-dropzone-container')?.scrollIntoView({ behavior: 'smooth' })
        }
      }
      return
    }

    onPayClick()
  }

  return (
    <>
      {/* Expandable Price Breakdown Sheet / Popover */}
      {showBreakdown && (
        <div
          ref={breakdownRef}
          id="price-breakdown-popover"
          className="fixed inset-x-0 bottom-[74px] sm:bottom-[78px] z-40 mx-auto max-w-md px-3 animate-rise"
        >
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xl text-ink space-y-3">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-brand-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink">Price Breakdown</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdown(false)}
                className="rounded-lg p-1 text-muted hover:bg-paper hover:text-ink transition-colors cursor-pointer"
                aria-label="Close breakdown"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {itemsCount > 1 && itemsBreakdown && itemsBreakdown.length > 0 ? (
                <>
                  <div className="text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-1">
                    {itemsCount} Merged Documents
                  </div>
                  <div className="divide-y divide-line/60 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {itemsBreakdown.map((item, idx) => (
                      <div key={item.id || idx} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-ink truncate text-[12px]">{item.name}</p>
                          <p className="text-[11px] text-muted">{item.details}</p>
                        </div>
                        <span className="font-bold text-ink text-xs flex-shrink-0">
                          {formatRupees(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-muted">
                    <span>Selected Service</span>
                    <span className="font-semibold text-ink">{serviceName}</span>
                  </div>

                  {fileName && (
                    <div className="flex items-center justify-between text-muted">
                      <span>Target File</span>
                      <span className="font-semibold text-ink truncate max-w-[200px]" title={fileName}>
                        {fileName}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-muted">
                    <span>Print Mode</span>
                    <span className="font-semibold text-ink">
                      {isColor ? 'Color Print' : 'Black & White'}
                      {isDuplex ? ' • Double-Sided (Duplex)' : ' • Single-Sided'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span>Calculated Quantity</span>
                    <span className="font-semibold text-ink">
                      {billedUnits} {unitLabel} {copies > 1 ? `\u00D7 ${copies} copies` : ''}
                    </span>
                  </div>

                  {unitPrice !== undefined && unitPrice > 0 && (
                    <div className="flex items-center justify-between text-muted">
                      <span>Unit Rate</span>
                      <span className="font-semibold text-ink">
                        {formatRupees(unitPrice)} / {unitLabel}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between border-t border-line pt-2 text-sm font-bold text-ink">
                <span>{itemsCount > 1 ? 'Total (All Documents)' : 'Total Amount'}</span>
                <span className="text-base text-brand-700">{formatRupees(total)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-brand-50/50 p-2.5 text-[11px] text-brand-900 border border-brand-200/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
                <span>
                  {itemsCount > 1
                    ? '1 single payment &bull; All files queued together'
                    : 'Instant spooling &bull; Counter & UPI supported'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Unified Fixed Bottom Pay Bar */}
      <div
        id="fixed-bottom-pay-bar"
        className="receipt-edge fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/95 backdrop-blur-md px-3 sm:px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+10px)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-all"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          ['--receipt-bg' as string]: '#F7F7F5',
        }}
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          {/* Left Column: Price, Units & Details Trigger */}
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="price-details-toggle-btn"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="group flex items-center gap-1 text-[11px] font-medium text-muted hover:text-brand-600 transition-colors cursor-pointer truncate"
                title="Click to view full price calculation"
              >
                {!hasFile ? (
                  <span className="inline-flex items-center gap-1 rounded bg-brand-50 text-brand-700 font-bold px-1.5 py-0.2 text-[10px]">
                    Estimate
                  </span>
                ) : null}

                <span className="truncate font-medium">
                  {itemsCount > 1 ? (
                    <span className="text-brand-700 font-bold">
                      {itemsCount} Documents &bull; {billedUnits} Pages
                    </span>
                  ) : (
                    <>
                      {billedUnits} {unitLabel}
                      {copies > 1 ? ` \u00D7 ${copies}` : ''}
                      {isColor ? ' \u2022 Color' : ' \u2022 B&W'}
                      {isDuplex ? ' \u2022 2-Sided' : ''}
                    </>
                  )}
                </span>

                <span className="inline-flex items-center text-muted group-hover:text-brand-600 transition-colors ml-0.5">
                  {showBreakdown ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronUp className="h-3 w-3" />
                  )}
                </span>
              </button>
            </div>

            {/* Total Price Display */}
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight truncate">
                {formatRupees(total)}
              </span>

              {!isOnline && (
                <span className="text-[10px] font-bold text-danger-600 bg-danger-50 px-1.5 py-0.5 rounded border border-danger-200">
                  Shop Paused
                </span>
              )}

              {detectingPages && (
                <span className="text-[10px] font-medium text-brand-600 animate-pulse">
                  Analyzing…
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Unified Smart Action CTA Button */}
          <button
            type="button"
            id="main-proceed-pay-btn"
            onClick={handleActionClick}
            disabled={!isOnline || (hasFile && disabled && !detectingPages)}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 sm:px-6 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer flex-shrink-0 select-none ${
              !isOnline
                ? 'bg-ink/40 opacity-60 cursor-not-allowed pointer-events-none'
                : !hasFile
                ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20 ring-2 ring-brand-400/30 ring-offset-1'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25'
            }`}
          >
            {!isOnline ? (
              <span className="text-xs sm:text-sm">Shop Offline</span>
            ) : submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs sm:text-sm">
                  {submittingMethod === 'cashfree'
                    ? 'Cashfree…'
                    : submittingMethod === 'upi'
                    ? 'UPI App…'
                    : 'Sending…'}
                </span>
              </>
            ) : detectingPages ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs sm:text-sm">Reading Pages…</span>
              </>
            ) : !hasFile ? (
              <>
                <Upload className="h-4 w-4 text-white" />
                <span className="text-xs sm:text-sm">Upload File</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>
                  Pay {formatRupees(total)}
                  {itemsCount > 1 ? ` (${itemsCount})` : ''}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}
