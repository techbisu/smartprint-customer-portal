'use client'

import { PageSelectionMode } from '@/lib/pageSelection'
import { Language, translations } from '@/lib/translations'

interface Props {
  totalPages: number
  mode: PageSelectionMode
  customPages: string
  error?: string
  language?: Language
  onModeChange: (mode: PageSelectionMode) => void
  onCustomPagesChange: (value: string) => void
}

export default function PageSelection({
  totalPages,
  mode,
  customPages,
  error,
  language = 'en',
  onModeChange,
  onCustomPagesChange,
}: Props) {
  const t = translations[language] || translations.en

  return (
    <div className="space-y-3 rounded-card border border-line bg-white px-4 py-3.5">
      <label className="block text-sm font-medium" htmlFor="page-selection">
        {t.pagesToPrint}
      </label>
      <select
        id="page-selection"
        value={mode}
        onChange={(event) => onModeChange(event.target.value as PageSelectionMode)}
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
      >
        <option value="all">{t.allPages} ({totalPages})</option>
        <option value="odd">{t.oddPages}</option>
        <option value="even">{t.evenPages}</option>
        <option value="custom">{t.specificPages}</option>
      </select>
      {mode === 'custom' && (
        <>
          <input
            value={customPages}
            onChange={(event) => onCustomPagesChange(event.target.value)}
            placeholder={t.customPagesPlaceholder}
            aria-label={t.specificPages}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted">{t.pageRangeHelp}</p>
        </>
      )}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}