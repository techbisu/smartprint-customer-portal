'use client'

import { RateCardItem } from '@/lib/types'
import { formatRupees } from '@/lib/pricing'

interface Props {
  items: RateCardItem[]
  onSelect: (item: RateCardItem) => void
}

export default function ServiceSelector({ items, onSelect }: Props) {
  const categories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-2 text-sm font-medium text-muted">{category}</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {items
              .filter((i) => i.category === category)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="flex items-center justify-between rounded-card border border-line bg-white px-4 py-3.5 text-left transition-colors hover:border-brand-400 active:bg-brand-50"
                >
                  <span className="text-sm font-medium">{item.display_name}</span>
                  <span className="whitespace-nowrap text-sm text-muted">
                    {formatRupees(item.price_bw)}
                    {item.pricing_model === 'per_page' && '/pg'}
                  </span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
