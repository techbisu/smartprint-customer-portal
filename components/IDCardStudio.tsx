'use client'

import { useState, useRef, useEffect } from 'react'
import {
  CreditCard,
  Scissors,
  RotateCw,
  Sparkles,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  Sliders,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  Upload,
} from 'lucide-react'

interface Props {
  onLayoutReady: (file: File, previewUrl: string) => void
  onCancel?: () => void
}

type LayoutMode = 'side-by-side' | 'stacked' | 'duplicate-2x'

export default function IDCardStudio({ onLayoutReady, onCancel }: Props) {
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('side-by-side')
  const [frontRotation, setFrontRotation] = useState(0)
  const [backRotation, setBackRotation] = useState(0)
  const [cardScale, setCardScale] = useState(1.0) // 1.0 = standard CR80 85.6mm x 54mm
  const [gapSize, setGapSize] = useState(10) // mm gap between front and back
  const [contrastBoost, setContrastBoost] = useState(true)
  const [showSheetHeader, setShowSheetHeader] = useState(false)
  const [sheetTitle, setSheetTitle] = useState('Smart ID Card Sheet')
  const [generating, setGenerating] = useState(false)
  const [outputReady, setOutputReady] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Standard sample IDs for instant testing without needing real cards
  const loadSampleCards = () => {
    // Front sample: Aadhaar / Smart ID template canvas
    const frontCanvas = document.createElement('canvas')
    frontCanvas.width = 856
    frontCanvas.height = 540
    const ctxF = frontCanvas.getContext('2d')!

    // Front design
    ctxF.fillStyle = '#FFFFFF'
    ctxF.fillRect(0, 0, 856, 540)
    // Saffron strip
    ctxF.fillStyle = '#FF9933'
    ctxF.fillRect(0, 0, 856, 40)
    // Green strip
    ctxF.fillStyle = '#138808'
    ctxF.fillRect(0, 500, 856, 40)
    // Government header
    ctxF.fillStyle = '#1E293B'
    ctxF.font = 'bold 26px sans-serif'
    ctxF.fillText('GOVERNMENT OF INDIA / SMART IDENTITY CARD', 160, 80)
    // Avatar photo box
    ctxF.fillStyle = '#E2E8F0'
    ctxF.fillRect(50, 110, 180, 230)
    ctxF.strokeStyle = '#94A3B8'
    ctxF.lineWidth = 3
    ctxF.strokeRect(50, 110, 180, 230)
    ctxF.fillStyle = '#64748B'
    ctxF.font = 'bold 20px sans-serif'
    ctxF.fillText('PHOTO', 105, 230)
    // Text fields
    ctxF.fillStyle = '#0F172A'
    ctxF.font = 'bold 28px sans-serif'
    ctxF.fillText('ARUN KUMAR VERMA', 260, 150)
    ctxF.font = '22px sans-serif'
    ctxF.fillStyle = '#334155'
    ctxF.fillText('DOB: 14/08/1992', 260, 195)
    ctxF.fillText('GENDER: MALE', 260, 235)
    ctxF.fillText('ID NO: 4920 1823 9042', 260, 275)
    // QR Code dummy
    ctxF.fillStyle = '#000000'
    ctxF.fillRect(660, 130, 140, 140)
    ctxF.fillStyle = '#FFFFFF'
    ctxF.font = 'bold 18px sans-serif'
    ctxF.fillText('QR CODE', 690, 205)
    // Bottom banner
    ctxF.fillStyle = '#B91C1C'
    ctxF.font = 'bold 28px sans-serif'
    ctxF.fillText('XXXX XXXX 9042', 320, 460)

    setFrontImage(frontCanvas.toDataURL('image/png'))

    // Back sample: Address & details
    const backCanvas = document.createElement('canvas')
    backCanvas.width = 856
    backCanvas.height = 540
    const ctxB = backCanvas.getContext('2d')!

    ctxB.fillStyle = '#FFFFFF'
    ctxB.fillRect(0, 0, 856, 540)
    ctxB.fillStyle = '#FF9933'
    ctxB.fillRect(0, 0, 856, 25)
    ctxB.fillStyle = '#138808'
    ctxB.fillRect(0, 515, 856, 25)
    // Address text
    ctxB.fillStyle = '#0F172A'
    ctxB.font = 'bold 24px sans-serif'
    ctxB.fillText('ADDRESS DETAILS / स्थाई पता', 50, 70)
    ctxB.font = '20px sans-serif'
    ctxB.fillStyle = '#334155'
    ctxB.fillText('S/O: R. K. Verma', 50, 120)
    ctxB.fillText('H.No 42, Green Park Avenue, 2nd Main Road', 50, 160)
    ctxB.fillText('Sector 14, Urban Estate, New Delhi - 110016', 50, 200)
    ctxB.fillText('Contact: 98XXXXXX10', 50, 240)
    // Barcode dummy
    ctxB.fillStyle = '#000000'
    for (let x = 50; x < 500; x += 10) {
      ctxB.fillRect(x, 320, (x % 20 === 0 ? 5 : 3), 80)
    }
    // Security hologram box
    ctxB.fillStyle = '#F8FAFC'
    ctxB.strokeStyle = '#CBD5E1'
    ctxB.strokeRect(600, 100, 200, 250)
    ctxB.fillStyle = '#94A3B8'
    ctxB.font = '16px sans-serif'
    ctxB.fillText('OFFICIAL SEAL', 645, 230)

    setBackImage(backCanvas.toDataURL('image/png'))
  }

  // Handle uploaded file for Front
  const handleFrontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setFrontImage(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  // Handle uploaded file for Back
  const handleBackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setBackImage(reader.result as string)
      reader.readAsDataURL(f)
    }
  }

  // Helper to asynchronously preload an image and guarantee width/height are available
  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(e)
      img.src = src
    })
  }

  // Draw A4 sheet composite whenever dependencies change
  useEffect(() => {
    if (!frontImage && !backImage) return

    let isMounted = true

    async function renderSheet() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Preload images first so auto-crop math has accurate dimensions
      let frontImgEl: HTMLImageElement | null = null
      let backImgEl: HTMLImageElement | null = null

      try {
        if (frontImage) {
          frontImgEl = await loadImageElement(frontImage)
        }
        if (backImage) {
          backImgEl = await loadImageElement(backImage)
        }
      } catch (err) {
        console.error('Failed to load card images', err)
      }

      if (!isMounted) return

      // Standard A4 at 150 DPI: 1240 x 1754 px
      const A4_W = 1240
      const A4_H = 1754
      canvas.width = A4_W
      canvas.height = A4_H

      // 1. Fill clean white paper
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, A4_W, A4_H)

      // 2. Draw subtle border margin (10mm printable boundary)
      ctx.strokeStyle = '#E2E8F0'
      ctx.lineWidth = 2
      ctx.setLineDash([8, 8])
      ctx.strokeRect(60, 60, A4_W - 120, A4_H - 120)
      ctx.setLineDash([])

      // Standard CR80 card at 150 DPI is approx 505px x 318px
      const cardW = Math.round(505 * cardScale)
      const cardH = Math.round(318 * cardScale)
      const gapPx = Math.round(gapSize * 5.9) // ~5.9 px per mm at 150 DPI

      // Helper to draw an image inside card dimensions with auto-crop & rotation
      const drawCard = (
        img: HTMLImageElement | null,
        x: number,
        y: number,
        rotation: number,
        label: string,
      ) => {
        // Card container outline & background
        ctx.save()
        ctx.translate(x + cardW / 2, y + cardH / 2)
        ctx.rotate((rotation * Math.PI) / 180)

        if (img) {
          // Rounded card clip (Standard CR80 3mm corner radius)
          ctx.beginPath()
          const r = 18 // rounded corner radius
          ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, r)
          ctx.clip()

          // Draw image aspect filled (Intelligent Auto-crop to exact CR80 ratio)
          const imgRatio = img.width / img.height
          const targetRatio = cardW / cardH
          let sw = img.width
          let sh = img.height
          let sx = 0
          let sy = 0

          if (imgRatio > targetRatio) {
            sw = img.height * targetRatio
            sx = (img.width - sw) / 2
          } else {
            sh = img.width / targetRatio
            sy = (img.height - sh) / 2
          }

          // Optional photocopy contrast enhancement
          if (contrastBoost) {
            ctx.filter = 'contrast(108%) brightness(102%)'
          }

          ctx.drawImage(img, sx, sy, sw, sh, -cardW / 2, -cardH / 2, cardW, cardH)
          ctx.filter = 'none'

          // Border outline
          ctx.strokeStyle = '#0F172A'
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          // Placeholder outline
          ctx.fillStyle = '#F8FAFC'
          ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH)
          ctx.strokeStyle = '#CBD5E1'
          ctx.lineWidth = 3
          ctx.setLineDash([6, 6])
          ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH)
          ctx.setLineDash([])
          ctx.fillStyle = '#94A3B8'
          ctx.font = 'bold 24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`UPLOAD ${label.toUpperCase()}`, 0, 10)
        }

        ctx.restore()

        // Card Label pill at bottom of card
        ctx.fillStyle = '#1E293B'
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(label, x + cardW / 2, y + cardH + 28)
      }

      // 3. Compute layout positions
      const topMargin = 220

      if (layoutMode === 'side-by-side') {
        const totalBlockW = cardW * 2 + gapPx
        const startX = (A4_W - totalBlockW) / 2
        const startY = topMargin

        // Draw Front Card
        drawCard(frontImgEl, startX, startY, frontRotation, 'FRONT SIDE')

        // Draw Back Card
        drawCard(backImgEl, startX + cardW + gapPx, startY, backRotation, 'BACK SIDE')

        // Center Cutting / Folding Dashed Guideline
        const foldX = startX + cardW + gapPx / 2
        ctx.strokeStyle = '#94A3B8'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(foldX, startY - 30)
        ctx.lineTo(foldX, startY + cardH + 40)
        ctx.stroke()
        ctx.setLineDash([])

        // Scissor fold instruction
        ctx.fillStyle = '#64748B'
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('✂ FOLD OR CUT HERE', foldX, startY + cardH + 70)
      } else if (layoutMode === 'stacked') {
        const startX = (A4_W - cardW) / 2
        const startY = topMargin

        // Front on Top
        drawCard(frontImgEl, startX, startY, frontRotation, 'FRONT SIDE')

        // Back on Bottom
        drawCard(backImgEl, startX, startY + cardH + gapPx + 40, backRotation, 'BACK SIDE')

        // Center Divider line
        const foldY = startY + cardH + (gapPx + 40) / 2
        ctx.strokeStyle = '#94A3B8'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 8])
        ctx.beginPath()
        ctx.moveTo(startX - 40, foldY)
        ctx.lineTo(startX + cardW + 40, foldY)
        ctx.stroke()
        ctx.setLineDash([])
      } else if (layoutMode === 'duplicate-2x') {
        // 2 complete sets on one sheet (great for customer keeping a spare)
        const totalBlockW = cardW * 2 + gapPx
        const startX = (A4_W - totalBlockW) / 2

        // Row 1 (Set 1)
        drawCard(frontImgEl, startX, 160, frontRotation, 'SET 1 - FRONT')
        drawCard(backImgEl, startX + cardW + gapPx, 160, backRotation, 'SET 1 - BACK')

        // Row 2 (Set 2)
        drawCard(frontImgEl, startX, 720, frontRotation, 'SET 2 - FRONT')
        drawCard(backImgEl, startX + cardW + gapPx, 720, backRotation, 'SET 2 - BACK')
      }

      // 4. Optional Header Watermark on A4
      if (showSheetHeader) {
        ctx.fillStyle = '#475569'
        ctx.font = 'bold 24px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(
          sheetTitle ? sheetTitle.toUpperCase() : 'SMARTPRINT ID CARD SHEET (CR80 PHYSICAL PRINT SCALE: 85.6mm × 54.0mm)',
          A4_W / 2,
          90
        )

        ctx.font = '18px sans-serif'
        ctx.fillStyle = '#94A3B8'
        ctx.fillText('Auto-Aligned & Calibrated for Standard PVC Card Lamination Pouches', A4_W / 2, 125)
      }

      setOutputReady(Boolean(frontImage && backImage))
    }

    renderSheet()

    return () => {
      isMounted = false
    }
  }, [frontImage, backImage, layoutMode, frontRotation, backRotation, cardScale, gapSize, contrastBoost, showSheetHeader, sheetTitle])

  // Export composite to File
  const handleExportPrint = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    setGenerating(true)

    canvas.toBlob((blob) => {
      setGenerating(false)
      if (blob) {
        const file = new File([blob], `ID-Card-A4-${Date.now()}.png`, { type: 'image/png' })
        const previewUrl = URL.createObjectURL(blob)
        onLayoutReady(file, previewUrl)
      }
    }, 'image/png')
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5 shadow-xs space-y-4">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">ID Card Auto-Crop &amp; A4 Layout Studio</h2>
            <p className="text-[11px] text-muted">
              Auto-crop Front &amp; Back at exact 85.6mm &times; 54mm scale for pouch lamination.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSampleCards}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/70 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-marigold-600" />
          <span>Try Sample ID Card</span>
        </button>
      </div>

      {/* Upload Dual Cards: Front & Back */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Front Box */}
        <div className="rounded-xl border border-line bg-paper p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1">
              <span>1. Front Side</span>
              {frontImage && <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />}
            </span>

            {frontImage && (
              <button
                type="button"
                onClick={() => setFrontRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-muted border border-line hover:text-ink"
                title="Rotate 90°"
              >
                <RotateCw className="h-3 w-3" />
                <span>{frontRotation}&deg;</span>
              </button>
            )}
          </div>

          {frontImage ? (
            <div className="relative aspect-[1.586/1] w-full rounded-lg overflow-hidden border border-line bg-white shadow-2xs">
              <img
                src={frontImage}
                alt="ID Card Front"
                className="w-full h-full object-cover"
                style={{ transform: `rotate(${frontRotation}deg)` }}
              />
              <label className="absolute bottom-1 right-1 cursor-pointer rounded-md bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                Change
                <input type="file" accept="image/*" onChange={handleFrontUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="flex aspect-[1.586/1] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-white p-3 text-center cursor-pointer hover:border-brand-400 transition-colors">
              <Upload className="h-6 w-6 text-muted mb-1" />
              <span className="text-xs font-semibold text-ink">Upload Front Side</span>
              <span className="text-[10px] text-muted">Aadhaar, Voter, DL, PAN</span>
              <input type="file" accept="image/*" onChange={handleFrontUpload} className="hidden" />
            </label>
          )}
        </div>

        {/* Back Box */}
        <div className="rounded-xl border border-line bg-paper p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1">
              <span>2. Back Side</span>
              {backImage && <CheckCircle2 className="h-3.5 w-3.5 text-success-600" />}
            </span>

            {backImage && (
              <button
                type="button"
                onClick={() => setBackRotation((r) => (r + 90) % 360)}
                className="flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-muted border border-line hover:text-ink"
                title="Rotate 90°"
              >
                <RotateCw className="h-3 w-3" />
                <span>{backRotation}&deg;</span>
              </button>
            )}
          </div>

          {backImage ? (
            <div className="relative aspect-[1.586/1] w-full rounded-lg overflow-hidden border border-line bg-white shadow-2xs">
              <img
                src={backImage}
                alt="ID Card Back"
                className="w-full h-full object-cover"
                style={{ transform: `rotate(${backRotation}deg)` }}
              />
              <label className="absolute bottom-1 right-1 cursor-pointer rounded-md bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                Change
                <input type="file" accept="image/*" onChange={handleBackUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <label className="flex aspect-[1.586/1] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-white p-3 text-center cursor-pointer hover:border-brand-400 transition-colors">
              <Upload className="h-6 w-6 text-muted mb-1" />
              <span className="text-xs font-semibold text-ink">Upload Back Side</span>
              <span className="text-[10px] text-muted">Address & barcode side</span>
              <input type="file" accept="image/*" onChange={handleBackUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Arrangement & Printing Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
            Sheet Arrangement
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setLayoutMode('side-by-side')}
              className={`flex-1 rounded-lg py-1.5 px-2 text-xs font-semibold border transition-all ${
                layoutMode === 'side-by-side'
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-line text-muted hover:bg-paper'
              }`}
            >
              Side by Side
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('stacked')}
              className={`flex-1 rounded-lg py-1.5 px-2 text-xs font-semibold border transition-all ${
                layoutMode === 'stacked'
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-line text-muted hover:bg-paper'
              }`}
            >
              Stacked
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('duplicate-2x')}
              className={`flex-1 rounded-lg py-1.5 px-2 text-xs font-semibold border transition-all ${
                layoutMode === 'duplicate-2x'
                  ? 'border-brand-600 bg-brand-50 text-brand-900'
                  : 'border-line text-muted hover:bg-paper'
              }`}
            >
              2x Sets
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Card Gap: {gapSize}mm
            </label>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={gapSize}
            onChange={(e) => setGapSize(Number(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-3 py-2">
          <div>
            <span className="text-xs font-semibold text-ink block">Photocopy Boost</span>
            <span className="text-[10px] text-muted">Sharp text &amp; lines</span>
          </div>
          <input
            type="checkbox"
            checked={contrastBoost}
            onChange={(e) => setContrastBoost(e.target.checked)}
            className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Header Watermark Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-line bg-paper p-3">
        <div className="flex items-center gap-2">
          <input
            id="sheet-header-toggle"
            type="checkbox"
            checked={showSheetHeader}
            onChange={(e) => setShowSheetHeader(e.target.checked)}
            className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
          <label htmlFor="sheet-header-toggle" className="cursor-pointer">
            <span className="text-xs font-semibold text-ink block">Show Header Title on A4 Sheet</span>
            <span className="text-[10px] text-muted">Leave unchecked for clean photo paper without text watermark</span>
          </label>
        </div>
        {showSheetHeader && (
          <input
            type="text"
            value={sheetTitle}
            onChange={(e) => setSheetTitle(e.target.value)}
            placeholder="e.g. Smart ID Card Sheet"
            className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-ink focus:border-brand-500 focus:outline-none max-w-xs"
          />
        )}
      </div>

      {/* Real-time A4 Sheet Preview Canvas */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <Maximize2 className="h-3.5 w-3.5 text-brand-600" />
            Live A4 Print Sheet Preview (210mm &times; 297mm)
          </span>
          <span className="text-[10px] bg-paper px-2 py-0.5 rounded border border-line text-muted font-mono">
            Scale: 100% Real ID Size
          </span>
        </div>

        {/* Paper Container */}
        <div className="flex justify-center rounded-2xl border border-line bg-slate-100 p-4 overflow-hidden">
          <div className="relative aspect-[1/1.414] w-full max-w-[340px] rounded-lg bg-white shadow-lg border border-slate-300 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
          </div>
        </div>
      </div>

      {/* Confirmation & Apply Button */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <Info className="h-4 w-4 text-brand-600 flex-shrink-0" />
          <span>Includes folding line &amp; scissor guides for lamination.</span>
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
            disabled={!frontImage && !backImage}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{generating ? 'Compiling Sheet…' : 'Use ID Sheet For Print'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
