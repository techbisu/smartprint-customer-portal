'use client'

import { QrCode, UploadCloud, CreditCard, Printer, CheckCircle2, ChevronRight, Smartphone } from 'lucide-react'
import { useState } from 'react'

export default function HowItWorksBanner() {
  const [isExpanded, setIsExpanded] = useState(false)

  const steps = [
    {
      num: '1',
      tag: 'SCAN',
      desc: 'QR Code',
      icon: QrCode,
      highlight: 'No App',
    },
    {
      num: '2',
      tag: 'UPLOAD',
      desc: 'Document',
      icon: UploadCloud,
      highlight: 'PDF & Images',
    },
    {
      num: '3',
      tag: 'PAY',
      desc: 'Online / Counter',
      icon: CreditCard,
      highlight: 'UPI direct',
    },
    {
      num: '4',
      tag: 'AUTO PRINT',
      desc: 'Instantly',
      icon: Printer,
      highlight: 'Zero delay',
    },
  ]

  return (
    <div className="rounded-2xl border border-line bg-gradient-to-b from-white to-paper/60 p-4 shadow-xs">
      {/* Header with requested highlight phrases */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Print Straight From Your Phone &middot; Instantly</span>
          </div>
          <p className="text-[12px] font-semibold text-ink">
            No WhatsApp <span className="text-marigold-600 font-bold">&bull;</span> No Pendrive <span className="text-marigold-600 font-bold">&bull;</span> No File Transfer
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 text-[11px] font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2"
        >
          {isExpanded ? 'Less' : '4 Steps'}
        </button>
      </div>

      {/* 4-step horizontal micro-stepper */}
      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={step.num}
              className="relative flex flex-col items-center justify-center rounded-xl border border-line/70 bg-white px-1.5 py-2.5 text-center shadow-2xs hover:border-brand-300 transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="mt-1 text-[11px] font-extrabold uppercase tracking-tight text-ink">
                {step.tag}
              </span>
              <span className="text-[10px] text-muted font-medium leading-tight">
                {step.desc}
              </span>

              {idx < steps.length - 1 && (
                <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-muted/40">
                  <ChevronRight className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded Explanatory Drawer */}
      {isExpanded && (
        <div className="mt-3.5 border-t border-line/60 pt-3 space-y-2 text-xs text-muted">
          <div className="flex items-center gap-2 text-ink font-medium">
            <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            <span>Files go straight into the print spooler without leaving contact numbers or chat history.</span>
          </div>
          <div className="flex items-center gap-2 text-ink font-medium">
            <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
            <span>Select exact page ranges, B&W or vibrant color, and calculate rates before paying.</span>
          </div>
        </div>
      )}
    </div>
  )
}
