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
import PageSelection from '@/components/PageSelection'
import { pageSelectionLabel, PageSelectionMode, selectedPageCount } from '@/lib/pageSelection'

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
  const [pageSelectionMode, setPageSelectionMode] = useState<PageSelectionMode>('all')
  const [customPages, setCustomPages] = useState('')
  const [copies, setCopies] = useState(1)
  const [isColor, setIsColor] = useState(false)
  const [isDuplex, setIsDuplex] = useState(false)

  const [fileError, setFileError] = useState<string>()
  const [detectingPages, setDetectingPages] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittingMethod, setSubmittingMethod] = useState<PaymentMethod>()
  const [submitError, setSubmitError] = useState<string>()
  const [confirmedJob, setConfirmedJob] = useState<{ jobId: string; total: number; method: PaymentMethod } | null>(
    null,
  )

  const selectedPages = selectedPageCount(pages, pageSelectionMode, customPages)
  const pageSelectionError = file && !detectingPages && selectedPages == null
    ? `Enter page numbers between 1 and ${pages}, for example 1-3, 5, 8-10.`
    : undefined

  const pricing = useMemo(() => {
    if (!selectedItem || !selectedPages) return null
    return calculatePrice({ item: selectedItem, pages: selectedPages, copies, isColor, isDuplex })
  }, [selectedItem, selectedPages, copies, isColor, isDuplex])

  async function handleFile(f: File) {
    setFileError(undefined)
    if (f.size > MAX_UPLOAD_BYTES) {
      setFileError('That file is larger than 40 MB. Please choose a smaller file.')
      return
    }
    setFile(f)
    setPageSelectionMode('all')
    setCustomPages('')

    if (f.type === 'application/pdf') {
      setDetectingPages(true)
      try {
        const count = await countPdfPages(f)
        setPages(count)
      } catch {
        setFileError('Could not read this PDF. It may be corrupted or password-protected.')
        setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
      } finally {
        setDetectingPages(false)
      }
    } else {
      setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    }
  }

  async function handleSubmit(method: PaymentMethod) {
    if (!selectedItem || !file || !pricing || !selectedPages) return
    setSubmitting(true)
    setSubmittingMethod(method)
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
          pageSelection: pageSelectionLabel(pageSelectionMode, customPages),
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

      const newJobRecord = { jobId: data.jobId, total: pricing.total }
      try {
        const key = `print-history-${shop.shop_name}`
        const existing = JSON.parse(sessionStorage.getItem(key) || '[]')
        sessionStorage.setItem(key, JSON.stringify([...existing, newJobRecord]))
      } catch (e) {}

      setConfirmedJob({ jobId: data.jobId, total: pricing.total, method })
      setStage('done')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
      setSubmittingMethod(undefined)
    }
  }

  function resetFlow() {
    setFile(null)
    setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    setCopies(1)
    setIsColor(false)
    setIsDuplex(false)
    setFileError(undefined)
    setSubmitError(undefined)
    setConfirmedJob(null)
    setStage(items.length === 1 ? 'configure' : 'select-service')
    setSelectedItem(items.length === 1 ? items[0] : null)
  }

  if (stage === 'done' && confirmedJob) {
    return (
      <ConfirmationScreen
        jobId={confirmedJob.jobId}
        total={confirmedJob.total}
        paymentMethod={confirmedJob.method}
        shopName={shop.shop_name}
        onPrintAnother={resetFlow}
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
              <>
                {file.type === 'application/pdf' && pages > 1 && (
                  <PageSelection
                    totalPages={pages}
                    mode={pageSelectionMode}
                    customPages={customPages}
                    error={pageSelectionError}
                    onModeChange={setPageSelectionMode}
                    onCustomPagesChange={setCustomPages}
                  />
                )}
                <JobOptions
                  item={selectedItem}
                  copies={copies}
                  isColor={isColor}
                  isDuplex={isDuplex}
                  onCopiesChange={setCopies}
                  onColorChange={setIsColor}
                  onDuplexChange={setIsDuplex}
                />
              </>
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
          disabled={!file || detectingPages || !selectedPages}
          submitting={submitting}
          submittingMethod={submittingMethod}
          onPayUpi={() => handleSubmit('upi')}
          onPayCounter={() => handleSubmit('counter')}
        />
      )}
    </main>
  )
}
