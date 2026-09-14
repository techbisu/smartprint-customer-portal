'use client'

import { useMemo, useState } from 'react'
import { RateCardItem, Shop, PaymentMethod } from '@/lib/types'
import { calculatePrice } from '@/lib/pricing'
import { supabaseBrowser, UPLOAD_BUCKET, MAX_UPLOAD_BYTES } from '@/lib/supabaseBrowser'
import { countPdfPages } from '@/lib/pdfPageCount'
import ServiceSelector from '@/components/ServiceSelector'
import UploadDropzone from '@/components/UploadDropzone'
import JobOptions from '@/components/JobOptions'
import PriceBar from '@/components/PriceBar'
import ConfirmationScreen from '@/components/ConfirmationScreen'

interface Props {
  shop: Shop
  items: RateCardItem[]
}

type Stage = 'select-service' | 'configure' | 'done'

export default function UploadFlow({ shop, items }: Props) {
  const [stage, setStage] = useState<Stage>(items.length === 1 ? 'configure' : 'select-service')
  const [selectedItem, setSelectedItem] = useState<RateCardItem | null>(items.length === 1 ? items[0] : null)

  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState(1)
  const [copies, setCopies] = useState(1)
  const [isColor, setIsColor] = useState(false)
  const [isDuplex, setIsDuplex] = useState(false)

  const [fileError, setFileError] = useState<string>()
  const [detectingPages, setDetectingPages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string>()
  const [confirmedJob, setConfirmedJob] = useState<{ jobId: string; total: number; method: PaymentMethod } | null>(
    null,
  )

  const pricing = useMemo(() => {
    if (!selectedItem) return null
    return calculatePrice({ item: selectedItem, pages, copies, isColor, isDuplex })
  }, [selectedItem, pages, copies, isColor, isDuplex])

  async function handleFile(f: File) {
    setFileError(undefined)
    if (f.size > MAX_UPLOAD_BYTES) {
      setFileError('That file is larger than 40 MB. Please choose a smaller file.')
      return
    }
    setFile(f)

    if (f.type === 'application/pdf') {
      setDetectingPages(true)
      try {
        const count = await countPdfPages(f)
        setPages(count)
      } catch {
        setFileError('Could not read this PDF. It may be corrupted or password-protected.')
        setPages(1)
      } finally {
        setDetectingPages(false)
      }
    } else {
      setPages(1)
    }
  }

  async function handleSubmit(method: PaymentMethod) {
    if (!selectedItem || !file || !pricing) return
    setSubmitting(true)
    setSubmitError(undefined)

    try {
      const path = `${shop.id}/${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabaseBrowser.storage.from(UPLOAD_BUCKET).upload(path, file, {
        contentType: file.type,
        upsert: false,
      })
      if (uploadError) throw new Error('Upload failed. Check your connection and try again.')

      const { data: publicUrlData } = supabaseBrowser.storage.from(UPLOAD_BUCKET).getPublicUrl(path)

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: shop.slug,
          serviceCode: selectedItem.service_code,
          filename: file.name,
          fileUrl: publicUrlData.publicUrl,
          fileType: file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1] ?? 'pdf',
          pages,
          copies,
          isColor,
          isDuplex,
          totalAmount: pricing.total,
          paymentMethod: method,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong. Please try again.')
      }

      const data = await res.json()

      if (method === 'upi' && data.upiIntentUrl) {
        window.location.href = data.upiIntentUrl
      }

      setConfirmedJob({ jobId: data.jobId, total: pricing.total, method })
      setStage('done')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (stage === 'done' && confirmedJob) {
    return (
      <ConfirmationScreen
        jobId={confirmedJob.jobId}
        total={confirmedJob.total}
        paymentMethod={confirmedJob.method}
        shopName={shop.shop_name}
      />
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-md pb-32">
      <header className="flex items-center justify-between border-b border-line px-4 py-4">
        <h1 className="text-base font-semibold">{shop.shop_name}</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          Accepting print jobs
        </span>
      </header>

      <div className="animate-rise space-y-5 px-4 py-5">
        {stage === 'select-service' && (
          <ServiceSelector
            items={items}
            onSelect={(item) => {
              setSelectedItem(item)
              setStage('configure')
            }}
          />
        )}

        {stage === 'configure' && selectedItem && (
          <>
            {items.length > 1 && (
              <button
                onClick={() => {
                  setStage('select-service')
                  setSelectedItem(null)
                  setFile(null)
                }}
                className="text-sm text-brand-600"
              >
                &larr; Change service
              </button>
            )}

            <div>
              <h2 className="text-sm font-medium text-muted">{selectedItem.display_name}</h2>
            </div>

            <UploadDropzone
              accept="application/pdf,image/*"
              file={file}
              onFile={handleFile}
              error={fileError}
            />

            {detectingPages && <p className="text-sm text-muted">Reading document…</p>}

            {file && !detectingPages && (
              <JobOptions
                item={selectedItem}
                copies={copies}
                isColor={isColor}
                isDuplex={isDuplex}
                onCopiesChange={setCopies}
                onColorChange={setIsColor}
                onDuplexChange={setIsDuplex}
              />
            )}

            {submitError && <p className="text-sm text-danger-500">{submitError}</p>}
          </>
        )}
      </div>

      {stage === 'configure' && selectedItem && pricing && (
        <PriceBar
          total={pricing.total}
          billedUnits={pricing.billedUnits}
          unitLabel={selectedItem.pricing_model === 'per_page' ? (isDuplex && selectedItem.supports_duplex ? 'sheets' : 'pages') : 'item'}
          copies={copies}
          disabled={!file || detectingPages}
          submitting={submitting}
          onPayUpi={() => handleSubmit('upi')}
          onPayCounter={() => handleSubmit('counter')}
        />
      )}
    </main>
  )
}
