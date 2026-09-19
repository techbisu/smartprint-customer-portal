'use client'

import { useState } from 'react'
import {
  X,
  Store,
  Zap,
  CreditCard,
  ChevronRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  Lock,
} from 'lucide-react'
import { formatRupees } from '@/lib/pricing'
import { PaymentMethod } from '@/lib/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  total: number
  billedUnits: number
  unitLabel: string
  copies: number
  fileName?: string
  serviceName?: string
  enableCounter?: boolean
  enableUpi?: boolean
  enableOnline?: boolean
  submitting?: boolean
  submittingMethod?: PaymentMethod
  itemsCount?: number
  itemsBreakdown?: Array<{ id: string; name: string; details: string; amount: number }>
  onSelectMethod: (method: PaymentMethod) => void
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  total,
  billedUnits,
  unitLabel,
  copies,
  fileName,
  serviceName,
  enableCounter = true,
  enableUpi = true,
  enableOnline = true,
  submitting = false,
  submittingMethod,
  itemsCount = 1,
  itemsBreakdown,
  onSelectMethod,
}: Props) {
  if (!isOpen) return null

  const availableMethodsCount = [enableCounter, enableUpi, enableOnline].filter(Boolean).length

  return (
    <div
      id="payment-method-modal-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/65 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
    >
      <div
        id="payment-method-modal-content"
        className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-line bg-white shadow-2xl overflow-hidden animate-rise"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line bg-paper/70 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-ink">Select Payment Method</h3>
            <p className="text-xs text-muted">
              {itemsCount > 1
                ? `Pay for all ${itemsCount} documents in 1 single transaction`
                : 'Choose how you\'d like to pay for your print'}
            </p>
          </div>
          <button
            type="button"
            id="close-payment-modal-btn"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full p-1.5 text-muted hover:text-ink hover:bg-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Amount Summary Strip */}
        <div className="flex items-center justify-between border-b border-line bg-brand-50/40 px-5 py-3.5">
          <div className="min-w-0 pr-2">
            {itemsCount > 1 ? (
              <>
                <span className="inline-flex items-center gap-1 rounded bg-brand-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                  {itemsCount} Files Merged
                </span>
                <p className="text-xs font-semibold text-ink truncate mt-1">
                  {billedUnits} Total Pages &bull; 1 Final Payment
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-medium text-muted truncate">
                  {billedUnits} {unitLabel}
                  {copies > 1 ? ` \u00D7 ${copies} copies` : ''}
                  {serviceName ? ` \u2022 ${serviceName}` : ''}
                </p>
                {fileName && (
                  <p className="text-xs font-semibold text-ink truncate mt-0.5" title={fileName}>
                    {fileName}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 block">
              {itemsCount > 1 ? 'Total (All Files)' : 'Total to Pay'}
            </span>
            <span className="text-xl font-black text-ink">{formatRupees(total)}</span>
          </div>
        </div>

        {/* Payment Methods Options List */}
        <div className="p-4 sm:p-5 space-y-2.5">
          {availableMethodsCount === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-xs text-amber-800">
              No payment methods are currently active for this shop. Please notify the counter.
            </div>
          ) : (
            <>
              {/* Option 1: Pay at Counter (Cash) */}
              {enableCounter && (
                <button
                  type="button"
                  id="pay-method-counter-btn"
                  onClick={() => onSelectMethod('counter')}
                  disabled={submitting}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-line/80 bg-white p-3.5 text-left hover:border-emerald-500 hover:bg-emerald-50/20 active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                      <Store className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-ink group-hover:text-emerald-950">
                          Pay at Counter (Cash)
                        </span>
                        <span className="rounded-md bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                          Cash / Physical QR
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">
                        Pay with cash or shop QR directly when collecting your prints
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-muted group-hover:text-emerald-700 flex-shrink-0">
                    {submitting && submittingMethod === 'counter' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </button>
              )}

              {/* Option 2: UPI Pay (Deeplink) */}
              {enableUpi && (
                <button
                  type="button"
                  id="pay-method-upi-btn"
                  onClick={() => onSelectMethod('upi')}
                  disabled={submitting}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-line/80 bg-white p-3.5 text-left hover:border-marigold-500 hover:bg-marigold-50/20 active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-marigold-100 text-marigold-800 border border-marigold-300 group-hover:bg-marigold-400 group-hover:text-ink transition-colors flex-shrink-0">
                      <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-ink group-hover:text-marigold-950">
                          UPI Pay (Deeplink)
                        </span>
                        <span className="rounded-md bg-marigold-200/80 px-1.5 py-0.2 text-[10px] font-bold text-ink">
                          1-Tap App Switch
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">
                        Direct instant payment via Google Pay, PhonePe, Paytm, or BHIM
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-muted group-hover:text-marigold-800 flex-shrink-0">
                    {submitting && submittingMethod === 'upi' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-marigold-600" />
                    ) : (
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </button>
              )}

              {/* Option 3: Online Pay (Cashfree Gateway) */}
              {enableOnline && (
                <button
                  type="button"
                  id="pay-method-online-btn"
                  onClick={() => onSelectMethod('cashfree')}
                  disabled={submitting}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border-2 border-line/80 bg-white p-3.5 text-left hover:border-[#536DFE] hover:bg-[#536DFE]/5 active:scale-[0.99] transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#536DFE]/10 text-[#536DFE] border border-[#536DFE]/30 group-hover:bg-[#536DFE] group-hover:text-white transition-colors flex-shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-ink group-hover:text-[#3D5AFE]">
                          Online Pay
                        </span>
                        <span className="rounded-md bg-[#536DFE]/15 px-1.5 py-0.2 text-[10px] font-bold text-[#3D5AFE]">
                          Cashfree Gateway
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">
                        Credit/Debit Cards, NetBanking, UPI &amp; Wallets with auto verification
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-muted group-hover:text-[#536DFE] flex-shrink-0">
                    {submitting && submittingMethod === 'cashfree' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#536DFE]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                    )}
                  </div>
                </button>
              )}
            </>
          )}

          {/* Secure Trust Footer */}
          <div className="flex items-center justify-center gap-1.5 pt-3 text-[11px] text-muted">
            <Lock className="h-3.5 w-3.5 text-success-600" />
            <span>Encrypted Payment &middot; Direct Counter Spooling</span>
          </div>
        </div>
      </div>
    </div>
  )
}
