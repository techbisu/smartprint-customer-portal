'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  Printer,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react'

export default function ShopLoginPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = 'Shop Admin Login | SmartPrint'
  }, [])
  const [identifier, setIdentifier] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!identifier.trim()) {
      setError('Please enter your Shop Handle (e.g. demo-shop) or registered Phone.')
      return
    }
    if (!pin.trim()) {
      setError('Please enter your 4-digit access PIN.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/shops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please verify credentials.')
      }

      // Save active shop session
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartprint_active_shop', JSON.stringify(data.shop))
      }

      router.push(data.redirectUrl || `/dashboard/${data.shop.slug}`)
    } catch (err: any) {
      setError(err.message || 'Unable to log in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = () => {
    setIdentifier('demo-shop')
    setPin('1234')
    setError(null)
  }

  return (
    <main className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon & Heading */}
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md ring-4 ring-brand-100">
            <Printer className="h-7 w-7" />
          </div>
        </div>

        <h1 className="mt-4 text-center text-2xl font-black tracking-tight text-ink">
          Shopkeeper Portal Login
        </h1>
        <p className="mt-1.5 text-center text-xs text-muted">
          Secure administrative access to pricing, banners, Cashfree gateway, &amp; print queue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-2xl bg-danger-50 p-3.5 text-xs text-danger-600 border border-danger-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
                Shop Identifier / Slug or Phone
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. demo-shop or 9876543210"
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                The unique slug from your customer URL or phone number
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-ink">
                  Shop Access PIN / Password
                </label>
                <span className="text-[10px] text-muted">Default: 1234</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  maxLength={32}
                  className="w-full rounded-xl border border-line bg-paper pl-10 pr-3.5 py-2.5 text-sm text-ink tracking-widest placeholder:text-muted focus:border-brand-600 focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-brand-700 active:scale-98 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Verifying Shop Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Shop Panel</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Autofill Helper */}
          <div className="mt-6 pt-5 border-t border-line/70">
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-3.5 flex items-center justify-between gap-3">
              <div className="text-left">
                <p className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                  Demo Shopkeeper Account
                </p>
                <p className="text-[11px] text-brand-700/90 mt-0.5 font-mono">
                  Slug: <strong>demo-shop</strong> &middot; PIN: <strong>1234</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={fillDemo}
                className="flex-shrink-0 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 transition-colors cursor-pointer"
              >
                Autofill
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2.5 text-center text-xs">
            <Link
              href="/register"
              className="font-medium text-brand-700 hover:text-brand-800 transition-colors"
            >
              New shop owner? <span className="font-bold underline">Register your Xerox / Print Shop</span>
            </Link>

            <Link
              href="/print/demo-shop"
              className="text-muted hover:text-ink transition-colors"
            >
              &larr; Back to Customer Print Portal
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
