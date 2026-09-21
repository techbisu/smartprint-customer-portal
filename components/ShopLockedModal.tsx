'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Shop } from '@/lib/types'
import { TrialStatus } from '@/lib/subscription'
import {
  Lock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react'

interface ShopLockedModalProps {
  isOpen: boolean
  shop: Shop
  trialStatus: TrialStatus
  onUpdateShop: (updatedShop: Partial<Shop>) => void
  onToast: (msg: string) => void
}

export default function ShopLockedModal({
  isOpen,
  shop,
  trialStatus,
  onUpdateShop,
  onToast,
}: ShopLockedModalProps) {
  const [mounted, setMounted] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll while locked modal is active
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  if (!isOpen || !mounted) return null

  // Developer sandbox action to toggle/extend trial for rapid testing
  const handleDevAction = async (action: 'extend15' | 'pro' | 'expire') => {
    setUpdating(true)
    try {
      let payload: Partial<Shop> = {}
      if (action === 'extend15') {
        const newEnds = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
        payload = {
          trial_ends_at: newEnds,
          subscription_status: 'trialing',
          plan_type: 'trial',
        }
      } else if (action === 'pro') {
        payload = {
          subscription_status: 'active',
          plan_type: 'pro',
        }
      } else if (action === 'expire') {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        payload = {
          trial_ends_at: pastDate,
          subscription_status: 'expired',
          plan_type: 'trial',
        }
      }

      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.shop) {
        onUpdateShop(data.shop)
        onToast(
          action === 'extend15'
            ? 'Free trial extended by 15 days!'
            : action === 'pro'
            ? 'Pro plan activated successfully!'
            : 'Simulated trial expired.'
        )
      } else {
        throw new Error(data.error || 'Failed to update shop status')
      }
    } catch (err: any) {
      onToast(err.message || 'Error updating trial')
    } finally {
      setUpdating(false)
    }
  }

  const startDateFormatted = shop.created_at
    ? new Date(shop.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Day of Registration'

  const endDateFormatted = trialStatus.trialEndsAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/75 backdrop-blur-xs p-3 sm:p-5 md:p-6 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="locked-modal-title"
    >
      <div className="flex min-h-full items-center justify-center py-4">
        <div
          className="relative w-full max-w-xl my-auto flex flex-col rounded-3xl bg-white shadow-2xl border border-line overflow-hidden animate-rise"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Banner Alert Bar */}
          <div className="bg-rose-600 px-6 py-3 text-white flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              <span>Subscription Required • Customer Portal Offline</span>
            </div>
            <span className="bg-rose-700/80 px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider">
              Locked
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Lock Icon & Title */}
            <div className="text-center space-y-2">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-sm">
                <Lock className="h-8 w-8 stroke-[1.75]" />
              </div>
              <h2 id="locked-modal-title" className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                15-Day Free Trial Expired
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                The complimentary 15-day trial period for <strong>{shop.shop_name}</strong> has concluded.
                Your customer print portal is currently offline.
              </p>
            </div>

            {/* Trial Details Summary */}
            <div className="rounded-2xl bg-paper border border-line/80 p-4 divide-y divide-line/60 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted font-medium">Trial Plan</span>
                <span className="font-bold text-ink">15-Day SmartPrint Free Trial</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted font-medium">Started On</span>
                <span className="font-mono text-ink">{startDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted font-medium">Expired On</span>
                <span className="font-mono font-bold text-rose-700">{endDateFormatted}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted font-medium">Customer Upload Portal</span>
                <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  Offline & Disabled
                </span>
              </div>
            </div>

            {/* What this means */}
            <div className="space-y-2 text-xs text-muted">
              <p className="font-bold text-ink uppercase tracking-wider text-[11px]">
                Impact on your shop:
              </p>
              <ul className="space-y-1.5 pl-1">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>Customers visiting your public link will see a friendly <em>&quot;Portal Temporarily Offline&quot;</em> notice with counter address.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>New online print uploads and instant payments are paused to protect your shop.</span>
                </li>
              </ul>
            </div>

            {/* Support / Renewal Contact Options */}
            <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <h4 className="font-bold text-ink text-xs uppercase tracking-wide">
                  How to Reactivate Your Shop
                </h4>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Contact our support team to renew your shop subscription. Your services, rate cards, and desktop printer agent settings are safely preserved.
              </p>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href="mailto:support@smartprint.in?subject=Shop%20Reactivation%20Request"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-brand-700 transition-all"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Support</span>
                </a>
                <a
                  href={`/print/${shop.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-line px-3.5 py-2 text-xs font-semibold text-ink hover:bg-paper transition-all"
                >
                  <span>Preview Customer View</span>
                  <ExternalLink className="h-3 w-3 text-muted" />
                </a>
              </div>
            </div>

            {/* Developer Testing Sandbox Controls */}
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  Developer Testing & Sandbox Switcher
                </span>
                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono text-[10px]">
                  Local Dev
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug">
                Test shop reactivation instantly without manual database edits:
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleDevAction('extend15')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
                  <span>+15 Days Free Trial</span>
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleDevAction('pro')}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Activate Pro Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
