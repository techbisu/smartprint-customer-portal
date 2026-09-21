'use client'

import { RateCardItem } from '@/lib/types'
import { formatRupees } from '@/lib/pricing'
import { Language, translations } from '@/lib/translations'
import { ArrowRight, Sparkles, Layers, FileText } from 'lucide-react'

interface Props {
  items: RateCardItem[]
  language?: Language
  onSelect: (item: RateCardItem) => void
}

export default function ServiceSelector({ items, language = 'en', onSelect }: Props) {
  const t = translations[language] || translations.en
  const activeItems = items.filter((i) => i.is_active !== false)
  const categories = Array.from(new Set(activeItems.map((i) => i.category)))

  if (activeItems.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-muted">
        No active services available at this time.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <section key={category} className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{category}</h3>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {activeItems
              .filter((i) => i.category === category)
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item)}
                  className="group flex items-center justify-between rounded-xl border border-line bg-white p-3.5 text-left transition-all hover:border-brand-400 hover:shadow-xs active:scale-[0.99] active:bg-brand-50/50 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-paper group-hover:bg-brand-50 group-hover:text-brand-700 text-muted transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink truncate leading-tight">
                        {item.display_name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span>
                          {t.fromPrice} <strong className="text-ink">{formatRupees(item.price_bw)}</strong>
                          {item.pricing_model === 'per_page' ? t.perPageSuffix : ''}
                        </span>
                        {item.price_color !== null && (
                          <>
                            <span>&middot;</span>
                            <span className="text-brand-600 font-medium">
                              {t.colorBadge} {formatRupees(item.price_color)}
                            </span>
                          </>
                        )}
                        {item.supports_duplex && (
                          <>
                            <span>&middot;</span>
                            <span className="text-[10px] bg-paper px-1.5 py-0.5 rounded border border-line/60">
                              {t.duplexBadge}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted group-hover:bg-brand-600 group-hover:text-white transition-all ml-2">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
