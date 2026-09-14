export type PageSelectionMode = 'all' | 'odd' | 'even' | 'custom'

export function selectedPageCount(totalPages: number, mode: PageSelectionMode, customPages = ''): number | null {
  const safeTotal = Math.max(1, Math.floor(totalPages))
  if (mode === 'all') return safeTotal
  if (mode === 'odd') return Math.ceil(safeTotal / 2)
  if (mode === 'even') return Math.floor(safeTotal / 2)

  const selected = new Set<number>()
  for (const token of customPages.split(',').map((value) => value.trim()).filter(Boolean)) {
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/)
    if (range) {
      const start = Number(range[1])
      const end = Number(range[2])
      if (start < 1 || end < start || end > safeTotal) return null
      for (let value = start; value <= end; value += 1) selected.add(value)
    } else if (/^\d+$/.test(token)) {
      const value = Number(token)
      if (value < 1 || value > safeTotal) return null
      selected.add(value)
    } else return null
  }
  return selected.size || null
}

export function pageSelectionLabel(mode: PageSelectionMode, customPages: string): string {
  return mode === 'custom' ? customPages : mode
}