'use client'

import { useState, useRef, useEffect } from 'react'
import {
  FileText,
  Shield,
  Sliders,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Info,
  Scale,
  AlignLeft,
  ArrowRight,
  BookOpen,
  Upload,
} from 'lucide-react'

interface Props {
  onLayoutReady: (file: File, previewUrl: string) => void
  onCancel?: () => void
}

type StampPreset = 'standard-100' | 'high-500' | 'estamp-shcil' | 'custom'
type PaperFormat = 'legal' | 'a4'

export default function LegalStampStudio({ onLayoutReady, onCancel }: Props) {
  const [preset, setPreset] = useState<StampPreset>('standard-100')
  const [topGapMm, setTopGapMm] = useState<number>(75) // 75mm = ~3 inches
  const [leftMarginMm, setLeftMarginMm] = useState<number>(32) // 32mm = ~1.25 inches for court filing
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('legal')
  const [firstPageOnly, setFirstPageOnly] = useState<boolean>(true)
  const [documentTitle, setDocumentTitle] = useState('RENTAL AGREEMENT / AFFIDAVIT')
  const [generating, setGenerating] = useState(false)

  const [agreementText, setAgreementText] = useState(
    `THIS RENT AGREEMENT is executed on this 18th day of September 2026, by and between:

LESSOR / OWNER: Shri Ramesh Chandra Sharma, residing at Flat 302, Palm Heights, Sector 12.

AND

LESSEE / TENANT: Shri Amit Kumar Verma, residing at H.No 14, Railway Road.

WHEREAS the Lessor is the absolute lawful owner of the residential premises situated at Plot No. 84, Greenfield Colony.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:
1. The tenancy shall be for a duration of 11 (Eleven) months commencing from 01-10-2026.
2. The Lessee agrees to pay a monthly rent of Rs. 14,500/- (Rupees Fourteen Thousand Five Hundred only) payable by the 5th day of every calendar month.
3. The Lessee has paid an interest-free refundable security deposit of Rs. 40,000/- (Rupees Forty Thousand only).
4. The premises shall be utilized strictly for residential purposes only.

IN WITNESS WHEREOF, the parties hereto have signed this agreement on the day and year first above written.

LESSOR: ____________________          LESSEE: ____________________
WITNESS 1: __________________          WITNESS 2: __________________`
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Handle preset change
  const handlePresetSelect = (p: StampPreset) => {
    setPreset(p)
    if (p === 'standard-100') setTopGapMm(75) // 3.0 inches
    if (p === 'high-500') setTopGapMm(90) // 3.54 inches
    if (p === 'estamp-shcil') setTopGapMm(65) // 2.56 inches
  }

  // Draw Legal Stamp Sheet on Canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Legal Paper Dimensions: 8.5" x 14" (ratio ~1 : 1.647)
    // A4 Dimensions: 8.27" x 11.69" (ratio ~1 : 1.414)
    const isLegal = paperFormat === 'legal'
    const W = 1200
    const H = isLegal ? 1976 : 1697 // ~1.647 or 1.414 ratio
    canvas.width = W
    canvas.height = H

    // 1. Paper Base (light cream official legal green paper tint or clean white)
    ctx.fillStyle = '#FCFBF7'
    ctx.fillRect(0, 0, W, H)

    // Subtle physical paper border
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, W, H)

    // Conversion factor: ~5.6 px per mm
    const pxPerMm = 5.6
    const topGapPx = Math.round(topGapMm * pxPerMm)
    const leftMarginPx = Math.round(leftMarginMm * pxPerMm)
    const rightMarginPx = Math.round(20 * pxPerMm)
    const bottomMarginPx = Math.round(25 * pxPerMm)

    // 2. Pre-printed Government Stamp Paper Header Zone (TOP CLEARANCE)
    ctx.fillStyle = '#F3F0E6'
    ctx.fillRect(0, 0, W, topGapPx)

    // Stamp Paper Watermark Pattern
    ctx.strokeStyle = '#E5DFD0'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    for (let i = -W; i < W * 2; i += 30) {
      ctx.moveTo(i, 0)
      ctx.lineTo(i + topGapPx, topGapPx)
    }
    ctx.stroke()

    // Central Government Stamp Emblem Illustration
    ctx.fillStyle = '#8C7851'
    ctx.strokeStyle = '#8C7851'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(W / 2, topGapPx / 2 - 15, 45, 0, Math.PI * 2)
    ctx.stroke()

    ctx.font = 'bold 15px serif'
    ctx.textAlign = 'center'
    ctx.fillText('GOVERNMENT OF INDIA', W / 2, topGapPx / 2 - 25)
    ctx.font = 'bold 24px serif'
    ctx.fillText('NON-JUDICIAL STAMP', W / 2, topGapPx / 2 + 5)
    ctx.font = '13px sans-serif'
    ctx.fillText('सत्यमेव जयते', W / 2, topGapPx / 2 + 25)

    // Top Stamp Clearance Boundary Line
    ctx.strokeStyle = '#DC2626'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 6])
    ctx.beginPath()
    ctx.moveTo(0, topGapPx)
    ctx.lineTo(W, topGapPx)
    ctx.stroke()
    ctx.setLineDash([])

    // Boundary Notice Pill
    ctx.fillStyle = '#DC2626'
    ctx.fillRect(W / 2 - 220, topGapPx - 14, 440, 28)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px sans-serif'
    ctx.fillText(
      `PRE-PRINTED STAMP GAP: ${topGapMm}mm (${(topGapMm / 25.4).toFixed(2)} INCHES) — NO OVERLAP`,
      W / 2,
      topGapPx + 5
    )

    // 3. Court Filing / Advocate Tagging Margin (Left side)
    ctx.strokeStyle = '#CBD5E1'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(leftMarginPx, topGapPx)
    ctx.lineTo(leftMarginPx, H - bottomMarginPx)
    ctx.stroke()
    ctx.setLineDash([])

    // Court punch hole markings
    ctx.fillStyle = '#94A3B8'
    ctx.beginPath()
    ctx.arc(leftMarginPx / 2, topGapPx + 100, 6, 0, Math.PI * 2)
    ctx.arc(leftMarginPx / 2, topGapPx + 300, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(leftMarginPx - 10, topGapPx + 220)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#94A3B8'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(`COURT BINDING MARGIN: ${leftMarginMm}mm`, 0, 0)
    ctx.restore()

    // 4. Render Legal Agreement Text
    const textStartX = leftMarginPx + 25
    const textWidth = W - textStartX - rightMarginPx
    let currentY = topGapPx + 55

    // Title
    ctx.fillStyle = '#0F172A'
    ctx.font = 'bold 22px serif'
    ctx.textAlign = 'center'
    ctx.fillText(documentTitle.toUpperCase(), textStartX + textWidth / 2, currentY)
    currentY += 35

    // Document Body text with word wrapping
    ctx.fillStyle = '#1E293B'
    ctx.font = '16px serif'
    ctx.textAlign = 'left'

    const lines = agreementText.split('\n')
    const lineHeight = 24

    for (const rawLine of lines) {
      if (!rawLine.trim()) {
        currentY += 14
        continue
      }

      // Word wrapping
      const words = rawLine.split(' ')
      let currentLine = ''

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' '
        const metrics = ctx.measureText(testLine)
        if (metrics.width > textWidth && n > 0) {
          ctx.fillText(currentLine, textStartX, currentY)
          currentLine = words[n] + ' '
          currentY += lineHeight
          if (currentY > H - bottomMarginPx - 40) break
        } else {
          currentLine = testLine
        }
      }
      ctx.fillText(currentLine, textStartX, currentY)
      currentY += lineHeight
      if (currentY > H - bottomMarginPx - 40) break
    }

    // Page Numbering at bottom
    ctx.fillStyle = '#64748B'
    ctx.font = 'italic 14px serif'
    ctx.textAlign = 'center'
    ctx.fillText('— Page 1 of 1 (Legal Non-Judicial Format) —', W / 2, H - 20)
  }, [preset, topGapMm, leftMarginMm, paperFormat, documentTitle, agreementText])

  // Export Legal Sheet to File
  const handleExportPrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setGenerating(true)

    canvas.toBlob((blob) => {
      setGenerating(false)
      if (blob) {
        const file = new File([blob], `Legal-Stamp-Sheet-${Date.now()}.png`, { type: 'image/png' })
        const previewUrl = URL.createObjectURL(blob)
        onLayoutReady(file, previewUrl)
      }
    }, 'image/png')
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marigold-50 text-marigold-700 font-bold">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">Legal &amp; Stamp Paper Margin Formatter</h2>
            <p className="text-[11px] text-muted">
              Pre-calibrated top gap &amp; court filing margins to ensure no overlap on Government Stamp Paper seals.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-bold text-success-700">
          <Shield className="h-3 w-3" /> Anti-Overlap Protected
        </span>
      </div>

      {/* Preset Stamp Types */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
          Select Stamp Paper Type:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handlePresetSelect('standard-100')}
            className={`rounded-xl p-2.5 text-left border transition-all ${
              preset === 'standard-100'
                ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs'
                : 'border-line text-ink hover:bg-paper'
            }`}
          >
            <span className="block text-xs font-bold">₹10 - ₹100 Stamp</span>
            <span className="block text-[10px] text-muted font-normal">75mm (3.0&quot;) Clearance</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('high-500')}
            className={`rounded-xl p-2.5 text-left border transition-all ${
              preset === 'high-500'
                ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs'
                : 'border-line text-ink hover:bg-paper'
            }`}
          >
            <span className="block text-xs font-bold">₹500+ High Value</span>
            <span className="block text-[10px] text-muted font-normal">90mm (3.54&quot;) Clearance</span>
          </button>

          <button
            type="button"
            onClick={() => handlePresetSelect('estamp-shcil')}
            className={`rounded-xl p-2.5 text-left border transition-all ${
              preset === 'estamp-shcil'
                ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs'
                : 'border-line text-ink hover:bg-paper'
            }`}
          >
            <span className="block text-xs font-bold">E-Stamp Barcode</span>
            <span className="block text-[10px] text-muted font-normal">65mm (2.56&quot;) Clearance</span>
          </button>

          <button
            type="button"
            onClick={() => setPreset('custom')}
            className={`rounded-xl p-2.5 text-left border transition-all ${
              preset === 'custom'
                ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs'
                : 'border-line text-ink hover:bg-paper'
            }`}
          >
            <span className="block text-xs font-bold">Custom Clearance</span>
            <span className="block text-[10px] text-muted font-normal">{topGapMm}mm Adjustable</span>
          </button>
        </div>
      </div>

      {/* Margin Sliders & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-line bg-paper p-3">
        {/* Top Gap Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-ink">
              Top Stamp Gap: <span className="text-brand-700">{topGapMm}mm</span>
            </label>
            <span className="text-[10px] text-muted font-mono">
              ({(topGapMm / 25.4).toFixed(2)}&quot;)
            </span>
          </div>
          <input
            type="range"
            min="40"
            max="120"
            step="1"
            value={topGapMm}
            onChange={(e) => {
              setTopGapMm(Number(e.target.value))
              setPreset('custom')
            }}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        {/* Left Margin Slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-ink">
              Left Court Margin: <span className="text-brand-700">{leftMarginMm}mm</span>
            </label>
            <span className="text-[10px] text-muted font-mono">
              ({(leftMarginMm / 25.4).toFixed(2)}&quot;)
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="45"
            step="1"
            value={leftMarginMm}
            onChange={(e) => setLeftMarginMm(Number(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        {/* Paper Size */}
        <div>
          <label className="block text-xs font-bold text-ink mb-1">Paper Dimensions</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPaperFormat('legal')}
              className={`flex-1 rounded-lg py-1 text-xs font-semibold border transition-all ${
                paperFormat === 'legal'
                  ? 'border-brand-600 bg-white text-brand-900 font-bold shadow-2xs'
                  : 'border-line text-muted hover:bg-white'
              }`}
            >
              Legal (8.5&quot; &times; 14&quot;)
            </button>
            <button
              type="button"
              onClick={() => setPaperFormat('a4')}
              className={`flex-1 rounded-lg py-1 text-xs font-semibold border transition-all ${
                paperFormat === 'a4'
                  ? 'border-brand-600 bg-white text-brand-900 font-bold shadow-2xs'
                  : 'border-line text-muted hover:bg-white'
              }`}
            >
              A4 (8.3&quot; &times; 11.7&quot;)
            </button>
          </div>
        </div>
      </div>

      {/* Editable Document Text Accordion */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-muted">
          Agreement Title &amp; Content (Editable):
        </label>
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          placeholder="e.g. RENTAL AGREEMENT / AFFIDAVIT"
          className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink focus:border-brand-600 focus:outline-none"
        />
        <textarea
          rows={3}
          value={agreementText}
          onChange={(e) => setAgreementText(e.target.value)}
          className="w-full rounded-xl border border-line bg-white p-2.5 text-[11px] font-mono text-ink focus:border-brand-600 focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* LIVE LEGAL SHEET PREVIEW CANVAS */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 text-brand-600" />
            Live Legal Stamp Sheet Preview ({paperFormat === 'legal' ? '8.5" × 14"' : 'A4'})
          </span>
          <span className="text-[10px] bg-danger-50 text-danger-700 px-2 py-0.5 rounded border border-danger-200 font-semibold">
            Red Dashed Line = Print Start Point
          </span>
        </div>

        {/* Paper Container */}
        <div className="flex justify-center rounded-2xl border border-line bg-slate-100 p-4 overflow-hidden">
          <div
            className={`relative w-full rounded-lg bg-white shadow-xl border border-slate-300 overflow-hidden ${
              paperFormat === 'legal' ? 'max-w-[340px] aspect-[1/1.647]' : 'max-w-[340px] aspect-[1/1.414]'
            }`}
          >
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Info className="h-4 w-4 text-brand-600 flex-shrink-0" />
          <span>Guarantees clean spacing below pre-printed revenue stamp seal.</span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-muted hover:bg-paper"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleExportPrint}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{generating ? 'Formatting…' : 'Use Legal Stamp Sheet For Print'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
