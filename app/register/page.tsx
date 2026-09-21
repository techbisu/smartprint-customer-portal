'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  QrCode,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Printer,
  Copy,
  Check,
  CreditCard,
  Phone,
  MapPin,
  Tag,
  ShieldCheck,
  Key,
  Radio,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react'

export default function ShopRegistrationPage() {
  const router = useRouter()

  useEffect(() => {
    document.title = 'Register New Shop | SmartPrint'
  }, [])

  const [shopName, setShopName] = useState('')
  const [slug, setSlug] = useState('')
  const [upiVpa, setUpiVpa] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Default pricing
  const [bwRate, setBwRate] = useState('2.00')
  const [colorRate, setColorRate] = useState('8.00')
  const [idRate, setIdRate] = useState('15.00')
  const [duplexSupported, setDuplexSupported] = useState(true)

  // Pusher / Realtime Desktop Agent Credentials (optional per-shop setup)
  const [pusherAppKey, setPusherAppKey] = useState('')
  const [pusherCluster, setPusherCluster] = useState('ap2')
  const [pusherAppId, setPusherAppId] = useState('')
  const [pusherSecret, setPusherSecret] = useState('')
  const [showPusherConfig, setShowPusherConfig] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registeredShop, setRegisteredShop] = useState<{
    shop: any
    customerUrl: string
    adminUrl: string
  } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyName)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Auto-slugify when shop name changes (if slug hasn't been manually detached)
  const handleShopNameChange = (val: string) => {
    setShopName(val)
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setSlug(generated)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!shopName.trim()) {
      setError('Please enter your shop or business name.')
      return
    }
    if (!slug.trim()) {
      setError('Please enter a custom URL slug for your shop.')
      return
    }
    if (!upiVpa.trim() || !upiVpa.includes('@')) {
      setError('Please enter a valid UPI VPA ID (e.g. shopname@upi or 9876543210@paytm).')
      return
    }
    if (!password.trim() || password.trim().length < 4) {
      setError('Please set an admin password or PIN of at least 4 characters for logging into your shop dashboard.')
      return
    }

    setLoading(true)

    try {
      const initialPricing = [
        {
          category: 'Standard Print',
          service_code: 'standard_print',
          display_name: 'Document Print (A4)',
          pricing_model: 'per_page',
          price_bw: parseFloat(bwRate) || 2.0,
          price_color: parseFloat(colorRate) || 8.0,
          supports_duplex: duplexSupported,
          is_active: true,
        },
        {
          category: 'ID Card & Badges',
          service_code: 'smart_id_a4',
          display_name: 'Smart ID Card & Lamination',
          pricing_model: 'flat_fee',
          price_bw: parseFloat(idRate) || 15.0,
          price_color: 30.0,
          supports_duplex: false,
          is_active: true,
        },
      ]

      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          slug,
          upiVpa,
          phone,
          address,
          password: password.trim(),
          initialPricing,
          pusherAppId,
          pusherKey: pusherAppKey,
          pusherSecret,
          pusherCluster,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register shop. Please try again.')
      }

      setRegisteredShop(data)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const copyAllAgentSettings = () => {
    if (!registeredShop) return
    const endpoint = `${window.location.origin}/api/pusher/auth`
    const text = [
      `[SmartPrint Desktop Agent Configuration]`,
      `Shop ID: ${registeredShop.shop.id}`,
      `Access Token: ${registeredShop.shop.agent_auth_token}`,
      `Pusher App Key: ${registeredShop.shop.pusher_key || process.env.NEXT_PUBLIC_PUSHER_KEY || '2e5517c16c8d36b2969d'}`,
      `Pusher Cluster: ${registeredShop.shop.pusher_cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'}`,
      `Auth Endpoint URL: ${endpoint}`,
    ].join('\n')

    copyToClipboard(text, 'all')
  }

  if (registeredShop) {
    const authEndpoint = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`
    const shopPusherKey = registeredShop.shop.pusher_key || process.env.NEXT_PUBLIC_PUSHER_KEY || '2e5517c16c8d36b2969d'
    const shopPusherCluster = registeredShop.shop.pusher_cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'

    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8 bg-paper">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm animate-rise space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-4 ring-success-50">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-bold text-ink">Shop Registered Successfully!</h1>
            <p className="text-xs text-muted">
              {registeredShop.shop.shop_name} is now live and ready to receive customer orders.
            </p>
          </div>

          {/* Customer Counter Portal Link */}
          <div className="rounded-xl border border-line/80 bg-paper p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Customer Counter Portal
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 text-[11px] font-bold text-success-600">
                Live &middot; Ready
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-white px-3 py-2">
              <div className="flex items-center gap-2 truncate">
                <QrCode className="h-4 w-4 text-brand-600 flex-shrink-0" />
                <span className="truncate font-mono text-xs text-ink font-medium">
                  {typeof window !== 'undefined' ? window.location.origin : ''}{registeredShop.customerUrl}
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}${registeredShop.customerUrl}`,
                    'customerUrl'
                  )
                }
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 flex-shrink-0"
              >
                {copiedKey === 'customerUrl' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Agent Setup Card (Matching Desktop Agent UI) */}
          <div className="rounded-2xl border border-brand-200 bg-brand-50/30 p-5 space-y-5 text-left">
            <div className="flex items-start justify-between gap-3 border-b border-brand-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-brand-600" />
                  <h2 className="text-base font-bold text-brand-900">Agent setup</h2>
                </div>
                <p className="mt-1 text-xs text-brand-700 leading-relaxed">
                  Enter your shop credentials, then choose the printers this workstation should use.
                </p>
              </div>

              <button
                type="button"
                onClick={copyAllAgentSettings}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-brand-700 transition-colors flex-shrink-0 cursor-pointer"
              >
                {copiedKey === 'all' ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy All</span>
                  </>
                )}
              </button>
            </div>

            {/* 1. Shop credentials */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-900">1</span>
                Shop credentials
              </h3>

              <div className="space-y-2.5">
                {/* Shop ID */}
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Shop ID
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                    <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                      {registeredShop.shop.id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(registeredShop.shop.id, 'shopId')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                    >
                      {copiedKey === 'shopId' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="text-success-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Access Token */}
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Access token
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                    <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                      {showToken ? registeredShop.shop.agent_auth_token : '•'.repeat(32)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="text-muted hover:text-ink p-1 rounded hover:bg-paper"
                      title={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(registeredShop.shop.agent_auth_token, 'token')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                    >
                      {copiedKey === 'token' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="text-success-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Realtime connection */}
            <div className="space-y-3 pt-2 border-t border-brand-100">
              <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-900">2</span>
                Realtime connection
              </h3>

              <div className="space-y-2.5">
                {/* Pusher app key */}
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Pusher app key
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                    <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                      {shopPusherKey}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shopPusherKey, 'pusherKey')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                    >
                      {copiedKey === 'pusherKey' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="text-success-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pusher cluster */}
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Pusher cluster
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                    <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                      {shopPusherCluster}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(shopPusherCluster, 'cluster')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                    >
                      {copiedKey === 'cluster' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="text-success-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Auth endpoint URL */}
                <div>
                  <label className="block text-[11px] font-medium text-muted mb-1">
                    Auth endpoint URL
                  </label>
                  <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                    <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                      {authEndpoint}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(authEndpoint, 'authEndpoint')}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                    >
                      {copiedKey === 'authEndpoint' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-success-600" />
                          <span className="text-success-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              href={registeredShop.adminUrl}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-all"
            >
              Open Shop Admin Panel
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href={registeredShop.customerUrl}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-ink hover:bg-paper transition-all"
            >
              <Printer className="h-4 w-4 text-muted" />
              View Customer Page
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-8 bg-paper">
      {/* Header Banner */}
      <div className="text-center space-y-2 mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md">
          <Store className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Register Your Print Shop</h1>
        <p className="text-xs text-muted max-w-xs mx-auto">
          Set up your instant customer print portal in 60 seconds. Direct UPI payments, automated print queue.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 shadow-2xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Includes 15-Day Free Trial</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold text-brand-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-marigold-500" />
            <span>No Credit Card Required</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        {error && (
          <div className="mb-5 rounded-xl bg-danger-50 p-3.5 text-xs text-danger-600 border border-danger-200">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Section 1: Shop Identity */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-brand-600" />
              1. Shop Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Shop / Xerox Business Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => handleShopNameChange(e.target.value)}
                placeholder="e.g. Apex Digital Prints & Stationery"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Custom URL Slug *
              </label>
              <div className="flex items-center rounded-xl border border-line bg-paper px-3 py-2 text-xs">
                <span className="text-muted font-mono select-none">/print/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="apex-digital"
                  className="w-full bg-transparent text-sm font-semibold text-brand-700 font-mono focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                This will be your customer QR link (e.g. /print/{slug || 'your-slug'})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                UPI VPA ID for Direct Customer Payments *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="e.g. yourname@upi or 9876543210@paytm"
                  className="w-full rounded-xl border border-line bg-white pl-9 pr-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                />
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted pointer-events-none" />
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Customer payments will go 100% directly to this UPI ID with zero platform deductions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Counter Phone (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-line bg-white pl-8 pr-3 py-2 text-xs text-ink focus:border-brand-600 focus:outline-none"
                  />
                  <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Shop Address / Counter
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Opposite College Gate"
                    className="w-full rounded-xl border border-line bg-white pl-8 pr-3 py-2 text-xs text-ink focus:border-brand-600 focus:outline-none"
                  />
                  <MapPin className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Admin Dashboard Password / PIN *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create access password (min. 4 characters)"
                  className="w-full rounded-xl border border-line bg-white pl-9 pr-10 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                />
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted hover:text-ink p-0.5"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted">
                You will use this password along with your slug/phone to log into your Shop Dashboard.
              </p>
            </div>
          </div>

          <div className="border-t border-line/70" />

          {/* Section 2: Default Rates */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-brand-600" />
                2. Initial Pricing Setup
              </h2>
              <span className="text-[11px] text-muted font-normal">Editable anytime in panel</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-paper p-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  B&W Print (per page)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-ink">&#8377;</span>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={bwRate}
                    onChange={(e) => setBwRate(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-line bg-paper p-3">
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Color Print (per page)
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-ink">&#8377;</span>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={colorRate}
                    onChange={(e) => setColorRate(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold text-ink focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-3">
              <div>
                <p className="text-xs font-semibold text-ink">Support Duplex (Both Sides)</p>
                <p className="text-[11px] text-muted">Discount / sheets calculation for double-sided prints</p>
              </div>
              <input
                type="checkbox"
                checked={duplexSupported}
                onChange={(e) => setDuplexSupported(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Section 3: Pusher & Desktop Agent Setup (Optional) */}
          <div className="rounded-xl border border-line/80 bg-paper/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-1.5">
                  <Radio className="h-4 w-4 text-brand-600" />
                  3. Desktop Agent &amp; Pusher Setup
                </h2>
                <p className="text-[11px] text-muted mt-0.5">
                  Shop-wise realtime connection for Windows desktop agent
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPusherConfig(!showPusherConfig)}
                className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-semibold text-brand-600 hover:bg-paper transition-colors"
              >
                <span>{showPusherConfig ? 'Hide' : 'Configure Custom'}</span>
                {showPusherConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {!showPusherConfig ? (
              <p className="text-[11px] text-muted bg-white p-2.5 rounded-lg border border-line">
                Using default platform realtime credentials. Your unique <strong>Shop ID</strong> and <strong>Access Token</strong> will be generated automatically upon registration. You can also customize Pusher credentials later in the Shop Panel.
              </p>
            ) : (
              <div className="space-y-3 pt-1 animate-rise">
                <div className="rounded-lg bg-brand-50/70 p-2.5 text-[11px] text-brand-800 border border-brand-200 leading-relaxed">
                  Enter your own Pusher account credentials if you want shop-wise channel isolation, custom webhooks, or your own Pusher quotas.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Pusher App Key
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2e5517c16c8d36b2969d"
                      value={pusherAppKey}
                      onChange={(e) => setPusherAppKey(e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono text-ink placeholder:font-sans focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Pusher Cluster
                    </label>
                    <input
                      type="text"
                      placeholder="ap2"
                      value={pusherCluster}
                      onChange={(e) => setPusherCluster(e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Pusher App ID (Server Trigger)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1827364"
                      value={pusherAppId}
                      onChange={(e) => setPusherAppId(e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono text-ink placeholder:font-sans focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Pusher Secret Key
                    </label>
                    <input
                      type="password"
                      placeholder="Pusher Secret"
                      value={pusherSecret}
                      onChange={(e) => setPusherSecret(e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-2 text-xs font-mono text-ink focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-md hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? 'Creating Shop Portal…' : 'Register Shop & Launch Portal'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-line text-center">
          <Link
            href="/dashboard/demo-shop"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-2"
          >
            Already have a shop? Open Demo Shop Admin Panel &rarr;
          </Link>
        </div>
      </div>
    </main>
  )
}
