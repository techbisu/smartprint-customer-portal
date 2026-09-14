'use client'

import { useEffect, useState } from 'react'
import { formatRupees } from '@/lib/pricing'
import { PaymentMethod } from '@/lib/types'

interface Props {
  jobId: string
  total: number
  paymentMethod: PaymentMethod
  shopName: string
  shopUpiVpa: string
  onPrintAnother: () => void
}

interface SessionJob {
  jobId: string
  total: number
}

export default function ConfirmationScreen({ jobId, total, paymentMethod, shopName, shopUpiVpa, onPrintAnother }: Props) {
  const [sessionJobs, setSessionJobs] = useState<SessionJob[]>([])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`print-history-${shopName}`)
      if (stored) {
        setSessionJobs(JSON.parse(stored))
      }
    } catch {}
  }, [shopName])

  const sessionTotal = sessionJobs.reduce((acc, job) => acc + job.total, 0)
  const isMultiple = sessionJobs.length > 1
  const upiIntentUrl = isMultiple ? `upi://pay?pa=${shopUpiVpa}&pn=${encodeURIComponent(shopName)}&am=${sessionTotal.toFixed(2)}&tn=${encodeURIComponent(`Prints-${sessionJobs.length}-Session`)}&cu=INR` : ''

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-2xl">
        ✓
      </div>
      <h1 className="text-lg font-semibold">Sent to {shopName}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        {paymentMethod === 'counter'
          ? `Your file is printing now. Pay ${formatRupees(total)} at the counter when you collect it.`
          : `Complete the payment in your UPI app. Your print will start once ${shopName} confirms it.`}
      </p>

      {isMultiple && paymentMethod === 'counter' && (
        <div className="mt-6 w-full max-w-xs rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-800">
          <p className="text-sm font-medium">Session History</p>
          <p className="mt-1 text-xs text-brand-600">
            You have sent {sessionJobs.length} print jobs this session.
          </p>
          <p className="mt-2 text-sm font-semibold">
            Total to pay: {formatRupees(sessionTotal)}
          </p>
          <a
            href={upiIntentUrl}
            className="mt-4 block w-full rounded-lg bg-brand-600 py-2.5 text-center text-sm font-medium text-white shadow-sm hover:bg-brand-700 active:scale-[0.98] transition-all"
          >
            Pay Total via UPI
          </a>
        </div>
      )}

      <p className="mt-6 text-xs text-muted">Job reference: {jobId.slice(0, 8).toUpperCase()}</p>
      <button
        type="button"
        onClick={onPrintAnother}
        className="mt-8 rounded-full border border-line px-5 py-2.5 text-sm font-medium text-brand-600"
      >
        Print another document
      </button>
    </main>
  )
}
