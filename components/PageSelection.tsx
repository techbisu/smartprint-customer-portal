'use client'

import { PageSelectionMode } from '@/lib/pageSelection'

interface Props {
  totalPages: number
  mode: PageSelectionMode
  customPages: string
  error?: string
  onModeChange: (mode: PageSelectionMode) => void
  onCustomPagesChange: (value: string) => void
}

export default function PageSelection({ totalPages, mode, customPages, error, onModeChange, onCustomPagesChange }: Props) {
  return (
    <div className="space-y-3 rounded-card border border-line bg-white px-4 py-3.5">
      <label className="block text-sm font-medium" htmlFor="page-selection">Pages to print</label>
      <select id="page-selection" value={mode} onChange={(event) => onModeChange(event.target.value as PageSelectionMode)} className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm">
        <option value="all">All pages ({totalPages})</option>
        <option value="odd">Odd pages</option>
        <option value="even">Even pages</option>
        <option value="custom">Specific pages</option>
      </select>
      {mode === 'custom' && <><input value={customPages} onChange={(event) => onCustomPagesChange(event.target.value)} placeholder="e.g. 1-3, 5, 8-10" aria-label="Specific pages" className="w-full rounded-lg border border-line px-3 py-2 text-sm" /><p className="text-xs text-muted">Use individual pages or ranges, separated by commas.</p></>}
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  )
}