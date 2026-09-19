'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  CheckCircle2,
  Lock,
  X,
  Loader2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { formatRupees } from '@/lib/pricing'

interface Props {
  isOpen: boolean
  total: number
  jobId: string
  jobIds?: string[]
  paymentSessionId?: string
  cashfreeEnv?: 'sandbox' | 'production'
  shopName: string
  onSuccess: () => void
  onClose: () => void
}

type Tab = 'upi' | 'card' | 'netbanking' | 'wallet'

export default function CashfreeModal({
  isOpen,
  total,
  jobId,
  jobIds = [],
  paymentSessionId,
  cashfreeEnv = 'sandbox',
  shopName,
  onSuccess,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('upi')
  const [upiId, setUpiId] = useState('customer@okhdfcbank')
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821')
  const [cardExpiry, setCardExpiry] = useState('11/28')
  const [cardCvv, setCardCvv] = useState('•••')
  const [selectedBank, setSelectedBank] = useState('HDFC Bank')
  const [selectedWallet, setSelectedWallet] = useState('Paytm')
  const [processing, setProcessing] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)

  const isRealSession = Boolean(paymentSessionId && !paymentSessionId.includes('mock'))

  // Try loading official Cashfree SDK if available
  useEffect(() => {
    if (!isOpen) return
    const scriptId = 'cashfree-js-sdk'
    if (document.getElementById(scriptId)) {
      setSdkLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
    script.async = true
    script.onload = () => setSdkLoaded(true)
    document.body.appendChild(script)
  }, [isOpen])

  // Launch official Cashfree Hosted Checkout modal
  const handleLaunchCashfreeSdk = () => {
    if (typeof window !== 'undefined' && (window as any).Cashfree && paymentSessionId) {
      try {
        const cashfree = (window as any).Cashfree({
          mode: cashfreeEnv === 'production' ? 'production' : 'sandbox',
        })
        cashfree
          .checkout({
            paymentSessionId,
            redirectTarget: '_modal',
          })
          .then(async (result: any) => {
            if (result?.paymentDetails) {
              setProcessing(true)
              try {
                await fetch('/api/cashfree/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jobId,
                    jobIds: jobIds && jobIds.length > 0 ? jobIds : [jobId],
                  }),
                })
              } catch (e) {
                console.warn(e)
              }
              setProcessing(false)
              onSuccess()
            }
          })
          .catch((err: any) => {
            console.warn('[Cashfree PG Error]', err)
          })
      } catch (err) {
        console.warn('Cashfree launch error:', err)
      }
    }
  }

  // Auto-launch real Cashfree SDK checkout if real session is detected
  useEffect(() => {
    if (isOpen && sdkLoaded && isRealSession && paymentSessionId) {
      handleLaunchCashfreeSdk()
    }
  }, [isOpen, sdkLoaded, isRealSession, paymentSessionId])

  if (!isOpen) return null

  const handleSimulatePayment = async () => {
    setProcessing(true)

    // Call verify endpoint to record paid status
    try {
      const res = await fetch('/api/cashfree/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          jobIds: jobIds && jobIds.length > 0 ? jobIds : [jobId],
        }),
      })
      await res.json()
    } catch (e) {
      console.warn('Verification call:', e)
    }

    setTimeout(() => {
      setProcessing(false)
      onSuccess()
    }, 900)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl border border-line bg-white shadow-2xl overflow-hidden animate-rise">
        {/* Cashfree Branded Header */}
        <div className="bg-[#0C1A30] px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#536DFE] text-white font-black text-sm">
                CF
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold tracking-wide text-white">Cashfree Payments</span>
                  <span className="rounded bg-[#536DFE]/30 px-1.5 py-0.2 text-[9px] font-bold text-[#8C9EFF] uppercase">
                    {cashfreeEnv}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Paying <span className="font-semibold text-white">{shopName}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="rounded-full p-1 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex items-baseline justify-between border-t border-white/10 pt-3">
            <span className="text-xs text-slate-300 font-medium">Order Total</span>
            <span className="text-xl font-black text-white">{formatRupees(total)}</span>
          </div>
        </div>

        {/* Payment Channels Tabs */}
        <div className="flex border-b border-line bg-paper">
          <button
            type="button"
            onClick={() => setActiveTab('upi')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'upi'
                ? 'border-[#536DFE] text-[#536DFE] bg-white'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>UPI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'card'
                ? 'border-[#536DFE] text-[#536DFE] bg-white'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('netbanking')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'netbanking'
                ? 'border-[#536DFE] text-[#536DFE] bg-white'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>NetBanking</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'wallet'
                ? 'border-[#536DFE] text-[#536DFE] bg-white'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Wallets</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 space-y-4">
          {/* TAB 1: UPI */}
          {activeTab === 'upi' && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 text-center">
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiId(`user@${app.toLowerCase().replace(/\s/g, '')}`)}
                    className="flex flex-col items-center justify-center rounded-xl border border-line bg-paper p-2 hover:border-[#536DFE] hover:bg-brand-50/50 transition-all cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4 text-[#536DFE] mb-1" />
                    <span className="text-[10px] font-bold text-ink truncate w-full">{app}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Or enter Virtual Payment Address (VPA):
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:border-[#536DFE] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CARDS */}
          {activeTab === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                  Card Number (Visa / Mastercard / RuPay)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:border-[#536DFE] focus:outline-none"
                  />
                  <CreditCard className="absolute right-3 top-2.5 h-4 w-4 text-muted" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Valid Thru
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:border-[#536DFE] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:border-[#536DFE] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NETBANKING */}
          {activeTab === 'netbanking' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                Popular Indian Banks:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National'].map(
                  (bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                        selectedBank === bank
                          ? 'border-[#536DFE] bg-brand-50/50 text-[#536DFE] shadow-2xs'
                          : 'border-line text-ink hover:bg-paper'
                      }`}
                    >
                      {bank}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* TAB 4: WALLETS */}
          {activeTab === 'wallet' && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-muted">
                Supported Wallets:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Paytm Wallet', 'Amazon Pay', 'MobiKwik', 'Airtel Money'].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setSelectedWallet(w)}
                    className={`rounded-xl border p-2.5 text-left text-xs font-semibold transition-all ${
                      selectedWallet === w
                        ? 'border-[#536DFE] bg-brand-50/50 text-[#536DFE] shadow-2xs'
                        : 'border-line text-ink hover:bg-paper'
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleSimulatePayment}
            disabled={processing}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#536DFE] hover:bg-[#3D5AFE] py-3 text-sm font-bold text-white shadow-md active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing Cashfree Payment…</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Pay {formatRupees(total)} with Cashfree</span>
              </>
            )}
          </button>

          {/* Security Assurance footer */}
          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted">
            <ShieldCheck className="h-4 w-4 text-success-600" />
            <span>256-Bit SSL Encryption &middot; RBI Certified Payment Aggregator</span>
          </div>
        </div>
      </div>
    </div>
  )
}
