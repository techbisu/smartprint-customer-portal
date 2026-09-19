'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import { Shop } from '@/lib/types'
import {
  Printer,
  Sparkles,
  ShieldCheck,
  Lock,
  Smartphone,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Eye,
  Layers,
  Palette,
  Layout,
  ExternalLink,
  Zap,
  Info,
  QrCode as QrCodeIcon,
} from 'lucide-react'

interface Props {
  shop: Shop
}

type StickerSize = 'standee-a4' | 'counter-a5' | 'glass-decal' | 'compact-square'
type StickerTheme = 'navy-gold' | 'clean-white' | 'emerald-trust' | 'vibrant-yellow'

export default function QRStickerGenerator({ shop }: Props) {
  const [size, setSize] = useState<StickerSize>('standee-a4')
  const [theme, setTheme] = useState<StickerTheme>('navy-gold')
  const [includeWifi, setIncludeWifi] = useState(false)
  const [wifiName, setWifiName] = useState('')
  const [wifiPass, setWifiPass] = useState('')
  const [customTagline, setCustomTagline] = useState('Instant Self-Service Print Counter')
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [showCropMarks, setShowCropMarks] = useState(true)

  const stickerRef = useRef<HTMLDivElement>(null)

  // Determine full target print URL
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/print/${shop.slug}`
    : `https://smartprint.local/print/${shop.slug}`

  // Generate high-resolution scannable QR Code
  useEffect(() => {
    async function generateQR() {
      try {
        const darkColor =
          theme === 'clean-white' || theme === 'vibrant-yellow' ? '#16181D' : '#16181D'
        const lightColor = '#FFFFFF'

        const url = await QRCode.toDataURL(portalUrl, {
          width: 600,
          margin: 1.5,
          errorCorrectionLevel: 'H',
          color: {
            dark: darkColor,
            light: lightColor,
          },
        })
        setQrDataUrl(url)
      } catch (err) {
        console.error('Failed to generate QR code', err)
      }
    }
    generateQR()
  }, [portalUrl, theme])

  const copyCustomerLink = () => {
    navigator.clipboard.writeText(portalUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  // Theme styling helpers
  const getThemeClasses = () => {
    switch (theme) {
      case 'clean-white':
        return {
          card: 'bg-white text-ink border-4 border-ink shadow-xl',
          headerBg: 'bg-paper border-b-2 border-line text-ink',
          badgeBg: 'bg-ink text-white',
          qrBorder: 'border-2 border-ink bg-white',
          pillBg: 'bg-paper border border-line text-ink',
          accentText: 'text-brand-700 font-extrabold',
          securityBg: 'bg-paper/80 border border-line',
          stepBg: 'bg-white border border-line text-ink',
        }
      case 'emerald-trust':
        return {
          card: 'bg-[#0B2E1D] text-white border-4 border-[#1F9D55] shadow-2xl',
          headerBg: 'bg-gradient-to-r from-[#175432] to-[#103D24] border-b border-[#1F9D55]/40 text-white',
          badgeBg: 'bg-[#1F9D55] text-white font-bold',
          qrBorder: 'border-4 border-white/20 bg-white p-2 rounded-2xl shadow-lg',
          pillBg: 'bg-white/10 border border-white/20 text-white',
          accentText: 'text-[#4ADE80] font-extrabold',
          securityBg: 'bg-white/5 border border-white/15',
          stepBg: 'bg-white/10 border border-white/20 text-white',
        }
      case 'vibrant-yellow':
        return {
          card: 'bg-[#FFF9E6] text-ink border-4 border-ink shadow-2xl',
          headerBg: 'bg-marigold-500 border-b-4 border-ink text-ink',
          badgeBg: 'bg-ink text-white font-bold',
          qrBorder: 'border-4 border-ink bg-white p-2 rounded-2xl shadow-md',
          pillBg: 'bg-white border-2 border-ink text-ink font-bold',
          accentText: 'text-ink font-black',
          securityBg: 'bg-white border-2 border-ink',
          stepBg: 'bg-white border-2 border-ink text-ink font-bold',
        }
      case 'navy-gold':
      default:
        return {
          card: 'bg-[#0F172A] text-white border-4 border-[#334155] shadow-2xl',
          headerBg: 'bg-gradient-to-r from-[#1E293B] to-[#0F172A] border-b border-white/10 text-white',
          badgeBg: 'bg-marigold-500 text-ink font-extrabold',
          qrBorder: 'border-4 border-marigold-400/60 bg-white p-2 rounded-2xl shadow-xl',
          pillBg: 'bg-white/10 border border-white/15 text-white',
          accentText: 'text-marigold-400 font-extrabold',
          securityBg: 'bg-white/5 border border-white/10',
          stepBg: 'bg-white/10 border border-white/15 text-white',
        }
    }
  }

  const themeStyles = getThemeClasses()

  return (
    <div className="space-y-6">
      {/* Printable CSS styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-sticker-container,
          #print-sticker-container * {
            visibility: visible;
          }
          #print-sticker-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Controls Header */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Storefront QR Sticker & Standee Studio</h2>
          <p className="text-xs text-muted">
            Create and print an eye-catching counter sticker explaining how easy, fast, and 100% private mobile printing is.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCustomerLink}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-paper transition-colors"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-success-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-muted" />
                <span>Copy QR URL</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-black transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sticker</span>
          </button>
        </div>
      </div>

      {/* Customizer Toolbar */}
      <div className="no-print rounded-2xl border border-line bg-white p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format / Size */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
              <Layout className="h-3.5 w-3.5 text-brand-600" />
              1. Sticker Format
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSize('standee-a4')}
                className={`rounded-lg p-2 text-left text-xs font-medium border transition-all ${
                  size === 'standee-a4'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                    : 'border-line text-muted hover:border-brand-200'
                }`}
              >
                A4 Standee
                <span className="block text-[10px] text-muted font-normal">Full Poster</span>
              </button>
              <button
                type="button"
                onClick={() => setSize('counter-a5')}
                className={`rounded-lg p-2 text-left text-xs font-medium border transition-all ${
                  size === 'counter-a5'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                    : 'border-line text-muted hover:border-brand-200'
                }`}
              >
                A5 Desk Card
                <span className="block text-[10px] text-muted font-normal">Compact Acrylic</span>
              </button>
              <button
                type="button"
                onClick={() => setSize('glass-decal')}
                className={`rounded-lg p-2 text-left text-xs font-medium border transition-all ${
                  size === 'glass-decal'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                    : 'border-line text-muted hover:border-brand-200'
                }`}
              >
                Glass Decal
                <span className="block text-[10px] text-muted font-normal">Entrance Banner</span>
              </button>
              <button
                type="button"
                onClick={() => setSize('compact-square')}
                className={`rounded-lg p-2 text-left text-xs font-medium border transition-all ${
                  size === 'compact-square'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                    : 'border-line text-muted hover:border-brand-200'
                }`}
              >
                Square Sticker
                <span className="block text-[10px] text-muted font-normal">6&quot; &times; 6&quot; Peel</span>
              </button>
            </div>
          </div>

          {/* Theme Palette */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1">
              <Palette className="h-3.5 w-3.5 text-brand-600" />
              2. Color Aesthetic
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('navy-gold')}
                className={`rounded-lg p-2 text-left text-xs border transition-all ${
                  theme === 'navy-gold'
                    ? 'border-brand-600 bg-slate-900 text-white font-bold'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                Navy & Gold
                <span className="block text-[10px] text-marigold-400">Executive Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('clean-white')}
                className={`rounded-lg p-2 text-left text-xs border transition-all ${
                  theme === 'clean-white'
                    ? 'border-ink bg-white text-ink font-bold shadow-2xs'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                Laser Clean White
                <span className="block text-[10px] text-muted">Ink-saving crisp</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('emerald-trust')}
                className={`rounded-lg p-2 text-left text-xs border transition-all ${
                  theme === 'emerald-trust'
                    ? 'border-[#1F9D55] bg-[#0B2E1D] text-white font-bold'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                Emerald Security
                <span className="block text-[10px] text-green-300">Verified Safe</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('vibrant-yellow')}
                className={`rounded-lg p-2 text-left text-xs border transition-all ${
                  theme === 'vibrant-yellow'
                    ? 'border-ink bg-marigold-400 text-ink font-bold'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                High-Vis Yellow
                <span className="block text-[10px] text-ink font-medium">Bustling Retail</span>
              </button>
            </div>
          </div>

          {/* Subtitle & Tagline Customizer */}
          <div className="sm:col-span-2 space-y-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1">
                Custom Tagline / Header
              </label>
              <input
                type="text"
                value={customTagline}
                onChange={(e) => setCustomTagline(e.target.value)}
                placeholder="Instant Self-Service Print Counter"
                className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs text-ink focus:border-brand-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCropMarks}
                  onChange={(e) => setShowCropMarks(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Include Print Crop Marks</span>
              </label>

              <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeWifi}
                  onChange={(e) => setIncludeWifi(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <span>Include Free Store Wi-Fi Box</span>
              </label>
            </div>

            {includeWifi && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Wi-Fi Name (SSID)"
                  value={wifiName}
                  onChange={(e) => setWifiName(e.target.value)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Wi-Fi Password"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  className="rounded-lg border border-line px-2.5 py-1 text-xs text-ink focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STICKER PREVIEW CANVAS */}
      <div className="flex justify-center p-2 sm:p-6 bg-slate-100 rounded-3xl border border-line/80 overflow-x-auto">
        <div
          id="print-sticker-container"
          ref={stickerRef}
          className={`relative transition-all duration-300 ${
            size === 'standee-a4'
              ? 'w-full max-w-[520px] p-6 sm:p-8 rounded-[28px]'
              : size === 'counter-a5'
              ? 'w-full max-w-[420px] p-5 sm:p-6 rounded-[22px]'
              : size === 'glass-decal'
              ? 'w-full max-w-[640px] p-6 sm:p-7 rounded-[24px]'
              : 'w-full max-w-[420px] p-6 rounded-[24px]'
          } ${themeStyles.card}`}
        >
          {/* Corner Crop Marks (Printing alignment guides) */}
          {showCropMarks && (
            <>
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-current opacity-40 pointer-events-none" />
            </>
          )}

          {/* Sticker Header: Shop Identity */}
          <div className="text-center space-y-1.5 pb-4 border-b border-current/15">
            <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{customTagline}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-tight drop-shadow-xs">
              {shop.shop_name}
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs opacity-90">
              <span className="inline-flex items-center gap-1 font-bold">
                <ShieldCheck className="h-4 w-4" />
                Verified Print Counter
              </span>
              <span>&bull;</span>
              <span className="font-mono text-[11px]">{shop.upi_vpa}</span>
            </div>
          </div>

          {/* Core Content Area */}
          <div
            className={`py-4 ${
              size === 'glass-decal'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-5 items-center'
                : 'space-y-4 text-center'
            }`}
          >
            {/* QR Code Center Box */}
            <div className="flex flex-col items-center justify-center">
              <div className={`relative ${themeStyles.qrBorder} transition-transform`}>
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`Scan to print at ${shop.shop_name}`}
                    className="h-44 w-44 sm:h-52 sm:w-52 rounded-xl object-contain"
                  />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center bg-paper">
                    <QrCodeIcon className="h-16 w-16 text-muted animate-pulse" />
                  </div>
                )}

                {/* Center Badge logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md border border-line">
                  <span className="text-[11px] font-black text-ink">PRINT</span>
                </div>
              </div>

              <span className="mt-2.5 font-mono text-xs font-bold tracking-wider opacity-90">
                POINT CAMERA &bull; NO APP REQUIRED
              </span>
            </div>

            {/* Content Highlights */}
            <div className="space-y-3 text-left">
              {/* Requested Marketing Banner */}
              <div className={`rounded-xl p-3 text-center ${themeStyles.securityBg}`}>
                <p className="text-xs font-black tracking-widest uppercase">
                  SCAN &bull; UPLOAD &bull; PAY &bull; PRINT
                </p>
                <p className="text-sm font-bold mt-0.5">
                  Print Straight From Your Phone &bull; Instantly
                </p>
                <p className="text-[11px] opacity-80 mt-0.5 font-semibold">
                  No WhatsApp &bull; No Pendrive &bull; No File Transfer
                </p>
              </div>

              {/* 4 Easy Steps */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center">
                <div className={`rounded-lg p-2 ${themeStyles.stepBg}`}>
                  <span className="text-[9px] block uppercase font-bold opacity-75">Step 1</span>
                  <span className="text-xs font-extrabold block">SCAN</span>
                  <span className="text-[10px] opacity-80">QR Code</span>
                </div>
                <div className={`rounded-lg p-2 ${themeStyles.stepBg}`}>
                  <span className="text-[9px] block uppercase font-bold opacity-75">Step 2</span>
                  <span className="text-xs font-extrabold block">UPLOAD</span>
                  <span className="text-[10px] opacity-80">Document</span>
                </div>
                <div className={`rounded-lg p-2 ${themeStyles.stepBg}`}>
                  <span className="text-[9px] block uppercase font-bold opacity-75">Step 3</span>
                  <span className="text-xs font-extrabold block">PAY</span>
                  <span className="text-[10px] opacity-80">Online</span>
                </div>
                <div className={`rounded-lg p-2 ${themeStyles.stepBg}`}>
                  <span className="text-[9px] block uppercase font-bold opacity-75">Step 4</span>
                  <span className="text-xs font-extrabold block">AUTO PRINT</span>
                  <span className="text-[10px] opacity-80">Instantly</span>
                </div>
              </div>
            </div>
          </div>

          {/* WHY THIS IS GOOD, EASY & 100% SECURE (MANDATORY REQUIREMENT) */}
          <div className="pt-2 border-t border-current/15 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Why This Is 100% Private &amp; Secure
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Customer Privacy Guarantee
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className={`rounded-xl p-2.5 ${themeStyles.securityBg}`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success-400" />
                  <span>No Phone # Sharing</span>
                </div>
                <p className="text-[10px] opacity-80 leading-snug">
                  You never have to give out your personal WhatsApp number or save strangers&apos; contacts.
                </p>
              </div>

              <div className={`rounded-xl p-2.5 ${themeStyles.securityBg}`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <Lock className="h-3.5 w-3.5 text-success-400" />
                  <span>No Leftover Files</span>
                </div>
                <p className="text-[10px] opacity-80 leading-snug">
                  Private IDs, Aadhaar, Bank letters &amp; agreements are auto-cleared. No chat history left on shop PC.
                </p>
              </div>

              <div className={`rounded-xl p-2.5 ${themeStyles.securityBg}`}>
                <div className="flex items-center gap-1.5 font-bold text-[11px] mb-0.5">
                  <Zap className="h-3.5 w-3.5 text-marigold-400" />
                  <span>Zero USB Viruses</span>
                </div>
                <p className="text-[10px] opacity-80 leading-snug">
                  Direct encrypted mobile spooling protects both your files and our computers from pendrive malware.
                </p>
              </div>
            </div>

            {/* Optional Wi-Fi details box */}
            {includeWifi && wifiName && (
              <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-1.5 text-xs border border-white/15">
                <span className="font-semibold">Store Wi-Fi: {wifiName}</span>
                <span className="font-mono text-[11px]">Pass: {wifiPass || 'No Password'}</span>
              </div>
            )}

            {/* Bottom Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] opacity-75 font-medium">
              <span>Direct Mobile Print &middot; Powered by SmartPrint</span>
              <span className="font-mono">Portal: /print/{shop.slug}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
