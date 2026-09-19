'use client'

import {
  FileText,
  Image as ImageIcon,
  Trash2,
  Edit3,
  PlusCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { formatRupees, PricingBreakdown } from '@/lib/pricing'
import { RateCardItem } from '@/lib/types'
import { PageSelectionMode } from '@/lib/pageSelection'
import { LegalStampSettings } from '@/components/LegalStampModal'

export interface DocumentItem {
  id: string
  file: File
  rawUploadedFile?: File | null
  serviceItem: RateCardItem
  pages: number
  pageSelectionMode: PageSelectionMode
  customPages: string
  copies: number
  isColor: boolean
  isDuplex: boolean
  pricing: PricingBreakdown & { unitLabel?: string }
  studioPreviewUrl?: string | null
  legalStampSettings?: LegalStampSettings | null
}

interface Props {
  documents: DocumentItem[]
  activeDocId: string | null
  onSelectDoc: (id: string) => void
  onRemoveDoc: (id: string) => void
  onAddAnotherClick: () => void
  isAddingNew?: boolean
}

export default function DocumentBatchList({
  documents,
  activeDocId,
  onSelectDoc,
  onRemoveDoc,
  onAddAnotherClick,
  isAddingNew = false,
}: Props) {
  if (documents.length === 0) return null

  const totalAmount = documents.reduce((sum, doc) => sum + doc.pricing.total, 0)
  const totalPages = documents.reduce((sum, doc) => sum + (doc.pricing.billedUnits * doc.copies), 0)

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf' || file.type.includes('pdf')) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 flex-shrink-0">
          <FileText className="h-5 w-5" />
        </div>
      )
    }
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex-shrink-0">
        <ImageIcon className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div id="document-batch-list-container" className="space-y-3">
      {/* Header with summary pill */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">
              Your Documents to Print ({documents.length})
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              <Sparkles className="h-3 w-3" />
              1 Combined Bill
            </span>
          </div>
          <p className="text-[11px] text-muted mt-0.5">
            Tap any document to adjust copies or color options
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
            Merged Total
          </span>
          <span className="text-sm font-black text-brand-700">
            {formatRupees(totalAmount)}
          </span>
        </div>
      </div>

      {/* Cards list for each document */}
      <div className="space-y-2">
        {documents.map((doc, index) => {
          const isActive = doc.id === activeDocId && !isAddingNew
          const unitLabel =
            doc.pricing.unitLabel ||
            (doc.serviceItem.pricing_model === 'per_page'
              ? doc.isDuplex && doc.serviceItem.supports_duplex
                ? 'sheets'
                : 'pages'
              : 'item')

          return (
            <div
              key={doc.id}
              id={`doc-card-${doc.id}`}
              onClick={() => onSelectDoc(doc.id)}
              className={`group relative flex items-center justify-between gap-3 rounded-2xl p-3 text-left transition-all cursor-pointer border ${
                isActive
                  ? 'border-brand-600 bg-brand-50/50 shadow-sm ring-2 ring-brand-500/20'
                  : 'border-line bg-white hover:border-brand-300 hover:bg-paper shadow-2xs'
              }`}
            >
              {/* Left Column: Number + Icon + Details */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Index badge */}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-2xs'
                      : 'bg-paper text-muted border border-line'
                  }`}
                >
                  {index + 1}
                </div>

                {getFileIcon(doc.file)}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="truncate text-xs font-bold text-ink max-w-[170px] sm:max-w-[210px]" title={doc.file.name}>
                      {doc.file.name}
                    </p>
                    {isActive && (
                      <span className="rounded bg-brand-600 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted mt-0.5 flex-wrap">
                    <span>
                      {doc.pricing.billedUnits} {unitLabel}
                    </span>
                    <span>&bull;</span>
                    <span className={doc.isColor ? 'font-semibold text-amber-700' : 'text-ink'}>
                      {doc.isColor ? 'Color' : 'B&W'}
                    </span>
                    {doc.copies > 1 && (
                      <>
                        <span>&bull;</span>
                        <span className="font-semibold text-brand-700">
                          {doc.copies} Copies
                        </span>
                      </>
                    )}
                    {doc.isDuplex && (
                      <>
                        <span>&bull;</span>
                        <span>2-Sided</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Price + Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <span className="text-xs font-bold text-ink block">
                    {formatRupees(doc.pricing.total)}
                  </span>
                  <span className="text-[10px] text-muted">
                    {formatRupees(doc.pricing.unitPrice)} / {unitLabel}
                  </span>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectDoc(doc.id)
                    }}
                    className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-muted hover:text-brand-600 hover:bg-paper'
                    }`}
                    title="Change copies or print options"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveDoc(doc.id)
                    }}
                    className="rounded-lg p-1.5 text-muted hover:text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                    title="Remove this document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Prominent "+ Add Another Document" Button */}
      <button
        type="button"
        id="add-another-document-btn"
        onClick={onAddAnotherClick}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 hover:bg-brand-50 hover:border-brand-500 py-3 px-4 text-xs font-bold text-brand-700 active:scale-[0.99] transition-all cursor-pointer shadow-2xs group"
      >
        <PlusCircle className="h-4 w-4 text-brand-600 group-hover:scale-110 transition-transform" />
        <span>+ Add Another Document (Pay All Together)</span>
      </button>
    </div>
  )
}
