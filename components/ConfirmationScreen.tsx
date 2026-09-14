'use client'

import { formatRupees } from '@/lib/pricing'
import { PaymentMethod } from '@/lib/types'

interface Props {
  jobId: string
  total: number
  paymentMethod: PaymentMethod
  shopName: string
}

export default function ConfirmationScreen({ jobId, total, paymentMethod, shopName }: Props) {
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
      <p className="mt-6 text-xs text-muted">Job reference: {jobId.slice(0, 8).toUpperCase()}</p>
    </main>
  )
}
