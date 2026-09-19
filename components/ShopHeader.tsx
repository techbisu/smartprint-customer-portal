'use client'

import { Shop } from '@/lib/types'
import { Language, translations } from '@/lib/translations'
import {
  ShieldCheck,
  Store,
  QrCode,
  Settings,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Loader2,
  Languages,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'

interface Props {
  shop: Shop
  showAdminLink?: boolean
  language?: Language
  onLanguageChange?: (lang: Language) => void
}

export default function ShopHeader({
  shop,
  showAdminLink = true,
  language = 'en',
  onLanguageChange,
}: Props) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [portalUrl, setPortalUrl] = useState('')

  // Generate real, 100% scannable counter QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/print/${shop.slug}`
      setPortalUrl(url)
      QRCode.toDataURL(url, {
        width: 400,
        margin: 1.5,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#16181D',
          light: '#FFFFFF',
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => console.error('Failed to generate counter QR code', err))
    }
  }, [shop.slug])

  // Derive nice initials or monogram from shop name
  const initials = shop.shop_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <>
      <header className="relative border-b border-line/80 bg-white/90 backdrop-blur-md transition-all">
        {/* Top announcement ticker for requested slogan */}
        <div className="bg-brand-700 px-3 py-1.5 text-center text-[11px] font-semibold tracking-wider text-white">
          <div className="mx-auto flex max-w-md items-center justify-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-marigold-400" />
              <span className="font-bold tracking-wide">Print Straight From Your Phone &middot; Instantly</span>
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-md px-4 py-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Shop Avatar & Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 font-bold text-white shadow-sm ring-2 ring-brand-100">
                <span className="text-sm tracking-tight">{initials || 'SP'}</span>
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-base font-bold text-ink leading-tight">
                    {shop.shop_name}
                  </h1>
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {shop.is_online ? (
                    <span className="inline-flex items-center gap-1 font-medium text-success-600 bg-success-50 px-1.5 py-0.5 rounded-md">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-500 opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success-500"></span>
                      </span>
                      {translations[language]?.shopCounterOpen || 'Live Counter'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-medium text-danger-500 bg-danger-50 px-1.5 py-0.5 rounded-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                      {translations[language]?.shopCounterClosed || 'Paused'}
                    </span>
                  )}
                  <span className="text-muted/60">&middot;</span>
                  <span className="truncate text-muted font-mono text-[10px]">
                    {shop.upi_vpa}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Language Switcher & QR Modal */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onLanguageChange && (
                <div className="flex items-center rounded-lg border border-line bg-paper p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('en')}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      language === 'en'
                        ? 'bg-white shadow-2xs text-brand-700 font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                    title="English"
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('bn')}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      language === 'bn'
                        ? 'bg-white shadow-2xs text-brand-700 font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                    title="বাংলা (Bengali)"
                  >
                    বাংলা
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('hi')}
                    className={`px-1.5 py-0.5 rounded transition-all ${
                      language === 'hi'
                        ? 'bg-white shadow-2xs text-brand-700 font-bold'
                        : 'text-muted hover:text-ink'
                    }`}
                    title="हिंदी (Hindi)"
                  >
                    हिंदी
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowInfoModal(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-paper text-muted hover:text-ink transition-colors"
                title="Shop Info & Counter Details"
              >
                <QrCode className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Info / Counter QR Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-line animate-rise">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-bold text-ink">{shop.shop_name}</h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 text-center">
              {/* Real Scannable QR Code */}
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl bg-white border-2 border-brand-200/80 shadow-md p-2">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Real Scannable Counter QR for ${shop.shop_name}`}
                    className="h-full w-full object-contain rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
                    <span className="text-[11px] text-muted mt-2 font-medium">Generating Real QR…</span>
                  </div>
                )}
              </div>

              {/* Verified Badge */}
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-[11px] font-bold text-success-700 border border-success-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Real 100% Scannable Counter QR</span>
              </div>

              <p className="mt-2 text-xs font-bold text-ink">
                Customers scan this counter QR to print straight from mobile.
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                Point any smartphone camera &bull; No WhatsApp or app download needed
              </p>

              {/* Quick Actions: Copy Link & Open Link */}
              <div className="mt-3.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (portalUrl) {
                      navigator.clipboard.writeText(portalUrl)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-ink hover:bg-line/40 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted" />
                  )}
                  <span>{copied ? 'Link Copied!' : 'Copy Portal URL'}</span>
                </button>

                <a
                  href={`/print/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open Page</span>
                </a>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
