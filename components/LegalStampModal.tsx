'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Scale,
  Shield,
  CheckCircle2,
  X,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Info,
  Sliders,
  FileText,
  Sparkles,
  AlertCircle,
  Eye,
  RefreshCw,
  Layers,
  ArrowRight,
} from 'lucide-react'

export interface LegalStampSettings {
  preset: 'standard-100' | 'high-500' | 'estamp-shcil' | 'custom'
  topGapMm: number
  leftMarginMm: number
  paperFormat: 'legal' | 'a4'
  firstPageOnly: boolean
}

interface Props {
  isOpen: boolean
  file: File | null
  onClose: () => void
  onConfirm: (formattedFile: File, previewUrl: string, settings: LegalStampSettings) => void
  initialSettings?: Partial<LegalStampSettings>
}

export default function LegalStampModal({
  isOpen,
  file,
  onClose,
  onConfirm,
  initialSettings,
}: Props) {
  const [preset, setPreset] = useState<'standard-100' | 'high-500' | 'estamp-shcil' | 'custom'>(
    initialSettings?.preset || 'standard-100'
  )
  const [topGapMm, setTopGapMm] = useState<number>(initialSettings?.topGapMm ?? 75) // 75mm standard
  const [leftMarginMm, setLeftMarginMm] = useState<number>(initialSettings?.leftMarginMm ?? 32) // 32mm court filing margin
  const [paperFormat, setPaperFormat] = useState<'legal' | 'a4'>(initialSettings?.paperFormat || 'legal')
  const [firstPageOnly, setFirstPageOnly] = useState<boolean>(initialSettings?.firstPageOnly ?? true)

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<boolean>(false)

  // In case user wants to type/edit text when no file is present
  const [showTextEditor, setShowTextEditor] = useState<boolean>(!file)
  const [agreementTitle, setAgreementTitle] = useState('AFFIDAVIT / AGREEMENT')
  const [agreementText, setAgreementText] = useState(
    `THIS AGREEMENT is entered into on this day for official registration and execution.\n\n` +
      `1. PARTIES: Shri/Smt. [First Party Name], residing at [Permanent Address] hereinafter called the FIRST PARTY.\n` +
      `AND\n` +
      `Shri/Smt. [Second Party Name], residing at [Permanent Address] hereinafter called the SECOND PARTY.\n\n` +
      `2. TERMS & CONDITIONS: The parties agree to the terms as detailed herein for the purpose of legal compliance.\n` +
      `3. JURISDICTION: This document shall be subject to the exclusive jurisdiction of the competent courts.\n\n` +
      `IN WITNESS WHEREOF, both parties have set their hands in the presence of witnesses.\n\n` +
      `FIRST PARTY: ______________________      SECOND PARTY: ______________________\n` +
      `WITNESS 1: ________________________      WITNESS 2: __________________________`
  )

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)
  const loadedImageRef = useRef<HTMLImageElement | null>(null)

  // Update presets
  const handlePresetSelect = (p: 'standard-100' | 'high-500' | 'estamp-shcil' | 'custom') => {
    setPreset(p)
    if (p === 'standard-100') setTopGapMm(75) // 3.0 inches (standard ₹10, ₹20, ₹50, ₹100 stamp)
    if (p === 'high-500') setTopGapMm(90) // 3.54 inches (₹500+ high value header)
    if (p === 'estamp-shcil') setTopGapMm(65) // 2.56 inches (SHCIL e-stamp barcode)
  }

  // Load document (PDF or Image)
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true

    async function loadDocument() {
      if (!file) {
        setShowTextEditor(true)
        setTotalPages(1)
        setCurrentPage(1)
        return
      }

      setShowTextEditor(false)
      setIsRendering(true)
      setRenderError(null)

      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

      if (isPdf) {
        try {
          const pdfjsLib = await import('pdfjs-dist')
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
              'pdfjs-dist/build/pdf.worker.min.mjs',
              import.meta.url
            ).toString()
          }

          const arrayBuffer = await file.arrayBuffer()
          const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
          if (!isMounted) return

          pdfDocRef.current = doc
          setTotalPages(doc.numPages)
          setCurrentPage(1)
        } catch (err: any) {
          console.error('[LegalStampModal] PDF load error:', err)
          if (isMounted) {
            setRenderError('Could not load PDF document preview. You can use the text editor or proceed.')
          }
        } finally {
          if (isMounted) setIsRendering(false)
        }
      } else if (file.type.startsWith('image/')) {
        try {
          const img = new Image()
          const url = URL.createObjectURL(file)
          img.src = url
          await img.decode()
          if (!isMounted) return

          loadedImageRef.current = img
          setTotalPages(1)
          setCurrentPage(1)
        } catch (err) {
          console.error('[LegalStampModal] Image load error:', err)
          if (isMounted) setRenderError('Could not load image preview.')
        } finally {
          if (isMounted) setIsRendering(false)
        }
      } else {
        setShowTextEditor(true)
        setIsRendering(false)
      }
    }

    loadDocument()

    return () => {
      isMounted = false
    }
  }, [file, isOpen])

  // Draw on canvas whenever settings or current page change
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Paper Dimensions at high quality (~5.6 px per mm)
    // Legal Paper: 215.9mm x 355.6mm (8.5" x 14") -> 1200 x 1976
    // A4 Paper: 210mm x 297mm (8.27" x 11.69") -> 1200 x 1697
    const isLegal = paperFormat === 'legal'
    const W = 1200
    const H = isLegal ? 1976 : 1697
    canvas.width = W
    canvas.height = H

    const pxPerMm = 5.6
    // If firstPageOnly is true and currentPage > 1, top gap is a standard document margin (e.g. 25mm)
    const effectiveTopGapMm = firstPageOnly && currentPage > 1 ? 25 : topGapMm
    const topGapPx = Math.round(effectiveTopGapMm * pxPerMm)
    const leftMarginPx = Math.round(leftMarginMm * pxPerMm)
    const rightMarginPx = Math.round(18 * pxPerMm)
    const bottomMarginPx = Math.round(22 * pxPerMm)

    // 1. Paper Base (light legal bond subtle cream/green paper texture)
    ctx.fillStyle = '#FCFBF7'
    ctx.fillRect(0, 0, W, H)

    // Physical Paper Border
    ctx.strokeStyle = '#D1D5DB'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, W, H)

    // 2. Simulated Government Stamp Seal Zone (Only shown when effectiveTopGapMm >= 50mm, i.e. on Stamp Page)
    if (effectiveTopGapMm >= 50) {
      // Subtle background for pre-printed government stamp area
      ctx.fillStyle = '#F4EFE6'
      ctx.fillRect(0, 0, W, topGapPx)

      // Stamp Paper Security Watermark Pattern (diagonal subtle lines)
      ctx.strokeStyle = '#E3DCD0'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      for (let i = -W; i < W * 2; i += 28) {
        ctx.moveTo(i, 0)
        ctx.lineTo(i + topGapPx, topGapPx)
      }
      ctx.stroke()

      // Central Emblem & Header Illustration
      ctx.fillStyle = '#8C7851'
      ctx.strokeStyle = '#8C7851'
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.arc(W / 2, topGapPx / 2 - 14, 42, 0, Math.PI * 2)
      ctx.stroke()

      ctx.font = 'bold 15px serif'
      ctx.textAlign = 'center'
      ctx.fillText('भारत सरकार / GOVT OF INDIA', W / 2, topGapPx / 2 - 24)
      ctx.font = 'bold 22px serif'
      ctx.fillText('NON-JUDICIAL STAMP', W / 2, topGapPx / 2 + 6)
      ctx.font = '12px sans-serif'
      ctx.fillText('सत्यमेव जयते', W / 2, topGapPx / 2 + 25)

      // Top Stamp Clearance Boundary Line (Red dashed line marking safe printable start)
      ctx.strokeStyle = '#DC2626'
      ctx.lineWidth = 2.5
      ctx.setLineDash([8, 6])
      ctx.beginPath()
      ctx.moveTo(0, topGapPx)
      ctx.lineTo(W, topGapPx)
      ctx.stroke()
      ctx.setLineDash([])

      // Red Boundary Notice Badge
      const badgeW = 420
      const badgeH = 26
      ctx.fillStyle = '#DC2626'
      ctx.fillRect(W / 2 - badgeW / 2, topGapPx - badgeH / 2, badgeW, badgeH)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(
        `PRE-PRINTED STAMP GAP: ${topGapMm}mm (${(topGapMm / 25.4).toFixed(2)} INCHES) — NO OVERLAP`,
        W / 2,
        topGapPx + 4
      )
    } else {
      // Normal top margin line for page 2+
      ctx.strokeStyle = '#94A3B8'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(0, topGapPx)
      ctx.lineTo(W, topGapPx)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // 3. Left Margin Guide (Court Filing & Tagging Margin)
    ctx.strokeStyle = '#94A3B8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(leftMarginPx, topGapPx)
    ctx.lineTo(leftMarginPx, H - bottomMarginPx)
    ctx.stroke()
    ctx.setLineDash([])

    // Court Punch-hole guidelines at 1/4 and 3/4 height
    ctx.fillStyle = '#94A3B8'
    ctx.beginPath()
    ctx.arc(leftMarginPx / 2, topGapPx + 120, 7, 0, Math.PI * 2)
    ctx.arc(leftMarginPx / 2, topGapPx + 360, 7, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.translate(leftMarginPx - 10, topGapPx + 240)
    ctx.rotate(-Math.PI / 2)
    ctx.fillStyle = '#64748B'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`COURT FILING & TAGGING MARGIN: ${leftMarginMm}mm`, 0, 0)
    ctx.restore()

    // 4. Safe Printable Content Box
    const contentX = leftMarginPx + 10
    const contentY = topGapPx + 12
    const contentMaxW = W - contentX - rightMarginPx
    const contentMaxH = H - contentY - bottomMarginPx

    // If PDF is loaded, render the selected page into an offscreen canvas then scale onto the legal sheet
    if (pdfDocRef.current) {
      try {
        const page = await pdfDocRef.current.getPage(currentPage)
        const unscaledViewport = page.getViewport({ scale: 1.0 })

        // Calculate proportional scale to fit contentMaxW and contentMaxH
        const scaleX = contentMaxW / unscaledViewport.width
        const scaleY = contentMaxH / unscaledViewport.height
        const fitScale = Math.min(scaleX, scaleY)

        // Render at 2x resolution for razor-sharp vector text
        const renderScale = fitScale * 2
        const viewport = page.getViewport({ scale: renderScale })

        const offscreen = document.createElement('canvas')
        offscreen.width = viewport.width
        offscreen.height = viewport.height
        const offCtx = offscreen.getContext('2d')
        if (offCtx) {
          await page.render({ canvasContext: offCtx, viewport }).promise

          // Draw the rendered page into the printable zone
          const drawW = viewport.width / 2
          const drawH = viewport.height / 2
          ctx.drawImage(offscreen, contentX, contentY, drawW, drawH)
        }
      } catch (err) {
        console.error('[LegalStampModal] Page render error:', err)
      }
    } else if (loadedImageRef.current) {
      // If Image is loaded
      const img = loadedImageRef.current
      const scaleX = contentMaxW / img.naturalWidth
      const scaleY = contentMaxH / img.naturalHeight
      const fitScale = Math.min(scaleX, scaleY)

      const drawW = img.naturalWidth * fitScale
      const drawH = img.naturalHeight * fitScale
      ctx.drawImage(img, contentX, contentY, drawW, drawH)
    } else {
      // Fallback or editable agreement text mode
      let currentY = contentY + 30
      ctx.fillStyle = '#0F172A'
      ctx.font = 'bold 22px serif'
      ctx.textAlign = 'center'
      ctx.fillText(agreementTitle.toUpperCase(), contentX + contentMaxW / 2, currentY)
      currentY += 34

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
        const words = rawLine.split(' ')
        let curLine = ''
        for (let n = 0; n < words.length; n++) {
          const testLine = curLine + words[n] + ' '
          const metrics = ctx.measureText(testLine)
          if (metrics.width > contentMaxW && n > 0) {
            ctx.fillText(curLine, contentX, currentY)
            curLine = words[n] + ' '
            currentY += lineHeight
            if (currentY > H - bottomMarginPx - 30) break
          } else {
            curLine = testLine
          }
        }
        ctx.fillText(curLine, contentX, currentY)
        currentY += lineHeight
        if (currentY > H - bottomMarginPx - 30) break
      }
    }

    // Page Numbering at bottom
    ctx.fillStyle = '#64748B'
    ctx.font = 'italic 13px serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      `— Page ${currentPage} of ${totalPages} (${isLegal ? 'Legal 8.5" × 14"' : 'A4'} Non-Judicial Format) —`,
      W / 2,
      H - 18
    )
  }, [
    paperFormat,
    firstPageOnly,
    currentPage,
    totalPages,
    topGapMm,
    leftMarginMm,
    agreementTitle,
    agreementText,
  ])

  useEffect(() => {
    if (isOpen) {
      renderCanvas()
    }
  }, [isOpen, renderCanvas])

  if (!isOpen) return null

  // Confirm Layout & Export to File
  const handleConfirm = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setConfirming(true)

    canvas.toBlob((blob) => {
      setConfirming(false)
      if (blob) {
        const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'Legal-Agreement'
        const formattedFile = new File([blob], `${baseName}-LegalStamp.png`, {
          type: 'image/png',
        })
        const previewUrl = URL.createObjectURL(blob)
        onConfirm(formattedFile, previewUrl, {
          preset,
          topGapMm,
          leftMarginMm,
          paperFormat,
          firstPageOnly,
        })
      }
    }, 'image/png')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-2 sm:p-4 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[96vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-line animate-rise overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line bg-paper">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marigold-50 text-marigold-700 font-bold border border-marigold-200">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">Legal / Stamp Paper Layout Preview</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-[11px] font-bold text-success-700 border border-success-200">
                  <Shield className="h-3 w-3" /> Anti-Overlap Calibrated
                </span>
              </div>
              <p className="text-xs text-muted">
                Predefined top clearance and left court margin automatically applied to prevent seal overlap
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Controls on top/side + Canvas Preview in center */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Quick Presets Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted">
              Select Stamp Paper Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePresetSelect('standard-100')}
                className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                  preset === 'standard-100'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs scale-[1.01]'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                <span className="block text-xs font-bold text-ink">₹10 - ₹100 Standard</span>
                <span className="block text-[11px] text-muted font-normal mt-0.5">
                  75mm (3.0&quot;) Clearance
                </span>
                <span className="inline-block mt-1 text-[10px] bg-brand-200/60 text-brand-800 px-1.5 py-0.5 rounded font-medium">
                  Most Popular
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('high-500')}
                className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                  preset === 'high-500'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs scale-[1.01]'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                <span className="block text-xs font-bold text-ink">₹500+ High Value</span>
                <span className="block text-[11px] text-muted font-normal mt-0.5">
                  90mm (3.54&quot;) Clearance
                </span>
                <span className="inline-block mt-1 text-[10px] bg-paper text-muted px-1.5 py-0.5 rounded font-medium">
                  Large Emblem
                </span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('estamp-shcil')}
                className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                  preset === 'estamp-shcil'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs scale-[1.01]'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                <span className="block text-xs font-bold text-ink">E-Stamp Barcode</span>
                <span className="block text-[11px] text-muted font-normal mt-0.5">
                  65mm (2.56&quot;) Clearance
                </span>
                <span className="inline-block mt-1 text-[10px] bg-paper text-muted px-1.5 py-0.5 rounded font-medium">
                  SHCIL Certificate
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPreset('custom')}
                className={`rounded-2xl p-3 text-left border transition-all cursor-pointer ${
                  preset === 'custom'
                    ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold shadow-2xs scale-[1.01]'
                    : 'border-line text-ink hover:bg-paper'
                }`}
              >
                <span className="block text-xs font-bold text-ink">Custom Margin</span>
                <span className="block text-[11px] text-muted font-normal mt-0.5">
                  {topGapMm}mm Adjustable
                </span>
                <span className="inline-block mt-1 text-[10px] bg-paper text-muted px-1.5 py-0.5 rounded font-medium">
                  Manual Tune
                </span>
              </button>
            </div>
          </div>

          {/* Margin Fine-Tuning Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-line bg-paper/60 p-3.5">
            {/* Top Clearance Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-ink">
                  Top Clearance Gap: <span className="text-brand-700">{topGapMm}mm</span>
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
              <p className="text-[10px] text-muted mt-0.5">
                Leaves blank space at top so print never touches pre-printed seal
              </p>
            </div>

            {/* Left Court Margin Slider */}
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
              <p className="text-[10px] text-muted mt-0.5">
                Standard advocate filing margin for punch-hole and tape binding
              </p>
            </div>

            {/* Paper Dimensions & Scope */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Paper Dimensions</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaperFormat('legal')}
                    className={`flex-1 rounded-xl py-1 text-xs font-semibold border transition-all cursor-pointer ${
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
                    className={`flex-1 rounded-xl py-1 text-xs font-semibold border transition-all cursor-pointer ${
                      paperFormat === 'a4'
                        ? 'border-brand-600 bg-white text-brand-900 font-bold shadow-2xs'
                        : 'border-line text-muted hover:bg-white'
                    }`}
                  >
                    A4 (8.3&quot; &times; 11.7&quot;)
                  </button>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-ink">Top gap on Page 1 only:</span>
                  <button
                    type="button"
                    onClick={() => setFirstPageOnly(!firstPageOnly)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      firstPageOnly
                        ? 'bg-brand-600 text-white'
                        : 'bg-paper border border-line text-muted'
                    }`}
                  >
                    {firstPageOnly ? 'Yes (Standard)' : 'All Pages'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Fallback Text Editor Accordion if user wants to write directly */}
          {showTextEditor && (
            <div className="rounded-2xl border border-line bg-paper/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink">Document Text Editor (Direct Mode)</span>
                <span className="text-[10px] text-muted">Formatted automatically on the sheet</span>
              </div>
              <input
                type="text"
                value={agreementTitle}
                onChange={(e) => setAgreementTitle(e.target.value)}
                placeholder="AGREEMENT TITLE"
                className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-ink focus:outline-none"
              />
              <textarea
                rows={3}
                value={agreementText}
                onChange={(e) => setAgreementText(e.target.value)}
                className="w-full rounded-xl border border-line bg-white p-2.5 text-[11px] font-mono text-ink focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Visual Paper Simulation Stage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Maximize2 className="h-3.5 w-3.5 text-brand-600" />
                  Visual Stamp Paper Preview &middot; {paperFormat === 'legal' ? '8.5" × 14"' : 'A4'}
                </span>
                {file && (
                  <span className="text-[11px] text-muted truncate max-w-[200px]">
                    ({file.name})
                  </span>
                )}
              </div>

              {/* Multi-page controller */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 bg-paper px-2.5 py-1 rounded-xl border border-line text-xs">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="p-1 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-bold text-ink px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="p-1 rounded hover:bg-white disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Central Canvas Container */}
            <div className="flex justify-center rounded-2xl border border-line bg-slate-200/70 p-4 sm:p-6 overflow-hidden">
              <div
                className={`relative w-full rounded-xl bg-white shadow-2xl border border-slate-300 overflow-hidden ${
                  paperFormat === 'legal'
                    ? 'max-w-[380px] aspect-[1/1.647]'
                    : 'max-w-[380px] aspect-[1/1.414]'
                }`}
              >
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              </div>
            </div>

            {/* Margin Status Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted bg-paper p-2.5 rounded-xl border border-line">
              <div className="flex items-center gap-3">
                <span>
                  Top Gap: <strong className="text-ink">{topGapMm}mm</strong>
                </span>
                <span>&middot;</span>
                <span>
                  Left Margin: <strong className="text-ink">{leftMarginMm}mm</strong>
                </span>
                <span>&middot;</span>
                <span>
                  Format: <strong className="text-ink">{paperFormat.toUpperCase()}</strong>
                </span>
              </div>
              <span className="text-success-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />
                Zero overlap with Government Stamp emblem
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-line bg-paper">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-muted hover:text-ink hover:bg-paper transition-colors cursor-pointer"
          >
            Cancel / Close
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{confirming ? 'Formatting Sheet…' : 'Confirm Layout & Ready to Print'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
