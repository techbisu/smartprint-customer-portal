'use client'

import { useEffect, useState } from 'react'
import { formatRupees } from '@/lib/pricing'
import { PaymentMethod } from '@/lib/types'
import { Language, translations } from '@/lib/translations'
import { CheckCircle2, FileText, Printer, ShieldCheck, ArrowRight, Store, Sparkles } from 'lucide-react'

export interface ConfirmedDocumentItem {
  name: string
  pages: number
  copies: number
  isColor: boolean
  amount: number
}

interface Props {
  jobId: string
  jobIds?: string[]
  total: number
  paymentMethod: PaymentMethod
  shopName: string
  shopUpiVpa: string
  itemsList?: ConfirmedDocumentItem[]
  language?: Language
  onPrintAnother: () => void
}

export default function ConfirmationScreen({
  jobId,
  jobIds = [],
  total,
  paymentMethod,
  shopName,
  shopUpiVpa,
  itemsList = [],
  language = 'en',
  onPrintAnother,
}: Props) {
  const t = translations[language] || translations.en
  const hasMultiple = itemsList.length > 1 || jobIds.length > 1
  const count = itemsList.length > 0 ? itemsList.length : jobIds.length > 0 ? jobIds.length : 1

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-8 text-center animate-rise">
      {/* Success Badge */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 mb-2">
        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
        <span>Order Received &amp; Queued</span>
      </div>

      <h1 className="text-xl font-black text-ink">
        {hasMultiple
          ? `${count} Documents Sent for Printing!`
          : `Sent to ${shopName}!`}
      </h1>

      <p className="mt-1.5 max-w-xs text-xs text-muted leading-relaxed">
        {paymentMethod === 'counter'
          ? `Your ${hasMultiple ? `${count} files are` : 'file is'} spooled to the counter printer. Pay ${formatRupees(total)} in cash when you collect.`
          : paymentMethod === 'cashfree'
          ? `Paid ${formatRupees(total)} securely. Your ${hasMultiple ? `${count} prints are` : 'print is'} prioritized and auto-spooling.`
          : `Payment of ${formatRupees(total)} processed via UPI. Printing starts once confirmed by counter.`}
      </p>

      {/* Merged Document List Card */}
      {itemsList.length > 0 && (
        <div className="mt-5 w-full rounded-2xl border border-line bg-white p-4 text-left shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
              <Printer className="h-4 w-4 text-brand-600" />
              <span>Printed Documents ({itemsList.length})</span>
            </div>
            <span className="text-xs font-bold text-brand-700">
              Total: {formatRupees(total)}
            </span>
          </div>

          <div className="divide-y divide-line/60 space-y-2 max-h-52 overflow-y-auto pr-1">
            {itemsList.map((item, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700 flex-shrink-0">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink text-[12px]">{item.name}</p>
                    <p className="text-[11px] text-muted">
                      {item.pages} {item.pages === 1 ? 'Page' : 'Pages'} &bull;{' '}
                      {item.isColor ? 'Color' : 'B&W'}
                      {item.copies > 1 ? ` \u00D7 ${item.copies} copies` : ''}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-ink text-xs flex-shrink-0">
                  {formatRupees(item.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-line pt-2.5 flex items-center justify-between text-xs">
            <span className="text-muted font-medium">Payment Mode</span>
            <span className="font-bold text-ink capitalize">
              {paymentMethod === 'counter'
                ? 'Pay at Counter (Cash)'
                : paymentMethod === 'cashfree'
                ? 'Online Payment (Cashfree)'
                : 'UPI Direct App'}
            </span>
          </div>
        </div>
      )}

      {/* Cashfree Verified Badge */}
      {paymentMethod === 'cashfree' && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#536DFE]/30 bg-[#536DFE]/10 px-3 py-1 text-xs font-semibold text-[#536DFE]">
          <span className="h-2 w-2 rounded-full bg-[#536DFE] animate-pulse" />
          <span>Cashfree Payment Verified &middot; Auto Spooled</span>
        </div>
      )}

      {/* Collection Reference Badge */}
      <div className="mt-4 rounded-xl bg-paper px-4 py-2 border border-line text-xs text-muted">
        <span>Order Token: </span>
        <strong className="font-mono text-ink text-xs font-bold tracking-wider">
          #{jobId.slice(0, 8).toUpperCase()}
        </strong>
        {hasMultiple && (
          <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
            {count} Files
          </span>
        )}
      </div>

      {/* Action CTA */}
      <button
        type="button"
        id="print-another-doc-btn"
        onClick={onPrintAnother}
        className="mt-6 flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 active:scale-[0.98] transition-all cursor-pointer"
      >
        <span>Print More Documents</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </main>
  )
}
