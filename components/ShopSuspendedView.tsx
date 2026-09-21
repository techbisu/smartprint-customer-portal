'use client'

import React from 'react'
import { Shop } from '@/lib/types'
import { Store, Phone, MapPin, Clock, AlertCircle, Printer } from 'lucide-react'

interface ShopSuspendedViewProps {
  shop: Shop
}

export default function ShopSuspendedView({ shop }: ShopSuspendedViewProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-ink antialiased">
      {/* Subtle Top Header */}
      <header className="border-b border-line/70 bg-white/90 backdrop-blur-md px-4 py-3.5 sticky top-0 z-10">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-xs font-bold text-sm">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-ink leading-tight truncate">{shop.shop_name}</h1>
              <p className="text-[11px] text-muted">SmartPrint Network</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Portal Offline
          </span>
        </div>
      </header>

      {/* Main Notice Body */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="w-full max-w-md bg-white rounded-2xl border border-line shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
          {/* Status Icon */}
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs">
            <Printer className="h-8 w-8 text-amber-600 stroke-[1.75]" />
          </div>

          {/* Heading & Neutral Message */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-ink tracking-tight">
              Online Print Portal is Temporarily Offline
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              <strong>{shop.shop_name}</strong> is currently not accepting online print orders through this portal.
            </p>
          </div>

          {/* Friendly Guidance Box */}
          <div className="rounded-xl bg-paper p-4 border border-line/80 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-ink uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              <span>Counter Walk-in Orders</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Please visit our physical counter in person or reach out to us directly for your urgent printing, photocopying, and document needs.
            </p>

            {/* Shop Contact Info (if available) */}
            <div className="pt-2 border-t border-line/60 space-y-2">
              {shop.phone && (
                <div className="flex items-center gap-2 text-xs text-ink">
                  <Phone className="h-3.5 w-3.5 text-brand-600 flex-shrink-0" />
                  <a
                    href={`tel:${shop.phone}`}
                    className="font-medium hover:underline text-brand-700"
                  >
                    {shop.phone}
                  </a>
                </div>
              )}
              {shop.address && (
                <div className="flex items-start gap-2 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <span>{shop.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-ink bg-white hover:bg-paper border border-line shadow-2xs transition-all cursor-pointer"
            >
              Check Again / Refresh
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-line/60 bg-white/60 py-4 text-center text-xs text-muted">
        <p>SmartPrint Cloud Services • Connecting Local Print Workstations</p>
      </footer>
    </div>
  )
}
