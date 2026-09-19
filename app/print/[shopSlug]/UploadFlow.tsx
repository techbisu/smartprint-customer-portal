'use client'

import { useMemo, useState } from 'react'
import { RateCardItem, Shop, ShopBanner, PaymentMethod } from '@/lib/types'
import { calculatePrice } from '@/lib/pricing'
import { supabaseBrowser, UPLOAD_BUCKET, MAX_UPLOAD_BYTES } from '@/lib/supabaseBrowser'
import { countPdfPages } from '@/lib/pdfPageCount'
import ServiceSelector from '@/components/ServiceSelector'
import UploadDropzone from '@/components/UploadDropzone'
import JobOptions from '@/components/JobOptions'
import PriceBar from '@/components/PriceBar'
import ConfirmationScreen from '@/components/ConfirmationScreen'
import PageSelection from '@/components/PageSelection'
import ShopHeader from '@/components/ShopHeader'
import BannerSlider from '@/components/BannerSlider'
import HowItWorksBanner from '@/components/HowItWorksBanner'
import IDCardStudio from '@/components/IDCardStudio'
import LegalStampStudio from '@/components/LegalStampStudio'
import LegalStampModal, { LegalStampSettings } from '@/components/LegalStampModal'
import CashfreeModal from '@/components/CashfreeModal'
import PaymentMethodModal from '@/components/PaymentMethodModal'
import DocumentBatchList, { DocumentItem } from '@/components/DocumentBatchList'
import { ConfirmedDocumentItem } from '@/components/ConfirmationScreen'
import { pageSelectionLabel, PageSelectionMode, selectedPageCount } from '@/lib/pageSelection'
import { Language, translations } from '@/lib/translations'
import {
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Scale,
  Sparkles,
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  Check,
  LayoutGrid,
  ChevronRight,
  Loader2,
} from 'lucide-react'

interface Props {
  shop: Shop
  items: RateCardItem[]
  banners?: ShopBanner[]
}

type Stage = 'select-service' | 'configure' | 'done'
type StudioType = 'none' | 'id-card' | 'legal-stamp'

export default function UploadFlow({ shop, items, banners = [] }: Props) {
  // Only provide services that are currently active in shop settings
  const availableItems = useMemo(() => {
    const active = items.filter((i) => i.is_active !== false)
    if (active.length > 0) return active

    // Fallback only if no items were provided at all
    const hasLegal = items.some(
      (i) =>
        i.display_name.toLowerCase().includes('legal') ||
        i.display_name.toLowerCase().includes('stamp') ||
        i.service_code === 'rent_agreement' ||
        i.service_code === 'legal_stamp'
    )
    if (hasLegal) return items.filter((i) => i.is_active !== false)

    const legalItem: RateCardItem = {
      id: 'default-legal-stamp-item',
      shop_id: shop.id,
      category: 'Legal & Official',
      service_code: 'rent_agreement',
      display_name: 'Legal / Stamp Paper',
      pricing_model: 'per_page',
      price_bw: 5.0,
      price_color: null,
      supports_duplex: false,
      is_active: true,
    }
    return [...items.filter((i) => i.is_active !== false), legalItem]
  }, [items, shop.id])

  // Find Document Print as default front-page option
  const initialDefaultItem = useMemo(() => {
    return (
      availableItems.find((i) => i.display_name.toLowerCase().includes('document print')) ||
      availableItems.find((i) => i.service_code === 'standard_print') ||
      availableItems.find((i) => i.display_name.toLowerCase().includes('document')) ||
      availableItems.find((i) => i.display_name.toLowerCase().includes('standard')) ||
      availableItems[0] ||
      null
    )
  }, [availableItems])

  const [stage, setStage] = useState<Stage>('configure')
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem(`smartprint_lang_${shop.slug}`) || localStorage.getItem('smartprint_lang')) as Language
      if (saved && (saved === 'en' || saved === 'bn' || saved === 'hi')) return saved
    }
    const defaultLang = shop.default_language as Language
    if (defaultLang && (defaultLang === 'en' || defaultLang === 'bn' || defaultLang === 'hi')) {
      return defaultLang
    }
    return 'en'
  })

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`smartprint_lang_${shop.slug}`, newLang)
      localStorage.setItem('smartprint_lang', newLang)
    }
  }

  const t = translations[lang] || translations.en
  const [selectedItem, setSelectedItem] = useState<RateCardItem | null>(initialDefaultItem || null)
  const [showAllServicesModal, setShowAllServicesModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [rawUploadedFile, setRawUploadedFile] = useState<File | null>(null)
  const [studioPreviewUrl, setStudioPreviewUrl] = useState<string | null>(null)
  const [activeStudio, setActiveStudio] = useState<StudioType>('none')
  const [showLegalStampModal, setShowLegalStampModal] = useState<boolean>(false)
  const [legalStampSettings, setLegalStampSettings] = useState<LegalStampSettings | null>(null)

  // Multi-document batch print queue state
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false)
  const [uploadStatusText, setUploadStatusText] = useState<string>('')

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
  const [confirmedJob, setConfirmedJob] = useState<{
    jobId: string
    jobIds?: string[]
    total: number
    method: PaymentMethod
    itemsList?: ConfirmedDocumentItem[]
  } | null>(null)
  const [cashfreeOrderData, setCashfreeOrderData] = useState<{
    jobId: string
    jobIds?: string[]
    total: number
    paymentSessionId?: string
    cashfreeEnv?: 'sandbox' | 'production'
    itemsList?: ConfirmedDocumentItem[]
  } | null>(null)

  // Auto-detect if selected item is ID card or Legal
  const checkServiceType = (item: RateCardItem): StudioType => {
    const name = (item.display_name + ' ' + item.category + ' ' + item.service_code).toLowerCase()
    if (name.includes('id') || name.includes('card') || name.includes('aadhaar') || name.includes('voter')) {
      return 'id-card'
    }
    if (name.includes('legal') || name.includes('stamp') || name.includes('agreement') || name.includes('affidavit')) {
      return 'legal-stamp'
    }
    return 'none'
  }

  const getServiceIcon = (item: RateCardItem) => {
    const code = (item.service_code || item.display_name || '').toLowerCase()
    if (code.includes('id') || code.includes('card')) return '🪪'
    if (code.includes('legal') || code.includes('stamp')) return '📜'
    if (code.includes('bind') || code.includes('spiral')) return '📚'
    if (code.includes('photo')) return '🖼️'
    if (code.includes('glossy') || code.includes('laminat')) return '✨'
    return '📄'
  }

  const selectService = (item: RateCardItem) => {
    setSelectedItem(item)
    setStage('configure')
    const detected = checkServiceType(item)
    setActiveStudio(detected)

    if (detected === 'legal-stamp') {
      // If document is already uploaded, open the visual preview modal automatically to confirm the legal layout!
      if (rawUploadedFile || file) {
        setShowLegalStampModal(true)
      }
    } else {
      // If switching away from legal-stamp, restore raw file if needed
      if (rawUploadedFile && file && file !== rawUploadedFile) {
        setFile(rawUploadedFile)
        setStudioPreviewUrl(null)
      }
      setLegalStampSettings(null)
      if (detected === 'none' && activeStudio !== 'none') {
        setStudioPreviewUrl(null)
      }
    }
  }

  const selectedPages = selectedPageCount(pages, pageSelectionMode, customPages)
  const pageSelectionError =
    file && !detectingPages && selectedPages == null
      ? `Enter page numbers between 1 and ${pages}, for example 1-3, 5, 8-10.`
      : undefined

  const pricing = useMemo(() => {
    if (!selectedItem || !selectedPages) return null
    return calculatePrice({ item: selectedItem, pages: selectedPages, copies, isColor, isDuplex })
  }, [selectedItem, selectedPages, copies, isColor, isDuplex])

  // Merged grand total and billed pages across all queued documents
  const grandTotal = useMemo(() => {
    if (documents.length > 0) {
      return documents.reduce((sum, d) => sum + d.pricing.total, 0)
    }
    return pricing ? pricing.total : 0
  }, [documents, pricing])

  const grandBilledUnits = useMemo(() => {
    if (documents.length > 0) {
      return documents.reduce((sum, d) => sum + (d.pricing.billedUnits * d.copies), 0)
    }
    return pricing ? pricing.billedUnits : 1
  }, [documents, pricing])

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId) || null
  }, [documents, activeDocId])

  // Synchronize options changes back into the active document within the batch list
  const handleCopiesChange = (newCopies: number) => {
    setCopies(newCopies)
    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const p = selectedPageCount(doc.pages, doc.pageSelectionMode, doc.customPages) ?? doc.pages
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: p,
              copies: newCopies,
              isColor: doc.isColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              copies: newCopies,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  const handleColorChange = (newColor: boolean) => {
    setIsColor(newColor)
    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const p = selectedPageCount(doc.pages, doc.pageSelectionMode, doc.customPages) ?? doc.pages
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: p,
              copies: doc.copies,
              isColor: newColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              isColor: newColor,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  const handleDuplexChange = (newDuplex: boolean) => {
    setIsDuplex(newDuplex)
    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const p = selectedPageCount(doc.pages, doc.pageSelectionMode, doc.customPages) ?? doc.pages
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: p,
              copies: doc.copies,
              isColor: doc.isColor,
              isDuplex: newDuplex,
            })
            return {
              ...doc,
              isDuplex: newDuplex,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  const handlePageModeChange = (newMode: PageSelectionMode) => {
    setPageSelectionMode(newMode)
    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const p = selectedPageCount(doc.pages, newMode, doc.customPages) ?? doc.pages
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: p,
              copies: doc.copies,
              isColor: doc.isColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              pageSelectionMode: newMode,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  const handleCustomPagesChange = (val: string) => {
    setCustomPages(val)
    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const p = selectedPageCount(doc.pages, doc.pageSelectionMode, val) ?? doc.pages
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: p,
              copies: doc.copies,
              isColor: doc.isColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              customPages: val,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  // Switch which document is actively being configured
  const handleSelectDoc = (id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return
    setActiveDocId(id)
    setIsAddingNew(false)
    setFile(doc.file)
    setRawUploadedFile(doc.rawUploadedFile || doc.file)
    setSelectedItem(doc.serviceItem)
    setPages(doc.pages)
    setPageSelectionMode(doc.pageSelectionMode)
    setCustomPages(doc.customPages)
    setCopies(doc.copies)
    setIsColor(doc.isColor)
    setIsDuplex(doc.isDuplex)
    setStudioPreviewUrl(doc.studioPreviewUrl || null)
    setLegalStampSettings(doc.legalStampSettings || null)
  }

  // Remove a document from the queue
  const handleRemoveDoc = (id: string) => {
    const remaining = documents.filter((d) => d.id !== id)
    setDocuments(remaining)
    if (activeDocId === id) {
      if (remaining.length > 0) {
        handleSelectDoc(remaining[remaining.length - 1].id)
      } else {
        resetFlow()
      }
    }
  }

  // Open the dropzone to add another document into this session
  const handleAddAnother = () => {
    setIsAddingNew(true)
    setActiveDocId(null)
    setFile(null)
    setRawUploadedFile(null)
    setStudioPreviewUrl(null)
    setLegalStampSettings(null)
    setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    setCopies(1)
    setIsColor(false)
    setIsDuplex(false)
    setTimeout(() => {
      const el = document.getElementById('upload-dropzone-container')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  async function handleFile(f: File) {
    setFileError(undefined)

    // Strictly reject DOCX / Word files
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    if (
      f.name === 'DOCX_NOT_ALLOWED' ||
      ['doc', 'docx'].includes(ext) ||
      f.type.includes('word') ||
      f.type.includes('officedocument')
    ) {
      setFileError('DOCX / Word files cannot be uploaded directly. Please convert your file to PDF, or upload an image (JPG, PNG).')
      setFile(null)
      return
    }

    const isPdf = f.type === 'application/pdf' || ext === 'pdf'
    const isImage = f.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext)

    if (!isPdf && !isImage) {
      setFileError('Only PDF and Image files (JPG, JPEG, PNG, WEBP) are supported.')
      setFile(null)
      return
    }

    if (f.size > MAX_UPLOAD_BYTES) {
      setFileError('That file is larger than 40 MB. Please choose a smaller file.')
      return
    }

    setFile(f)
    setRawUploadedFile(f)
    setStudioPreviewUrl(null)
    setLegalStampSettings(null)
    setPageSelectionMode('all')
    setCustomPages('')

    let detectedCount = 1
    if (f.type === 'application/pdf') {
      setDetectingPages(true)
      try {
        detectedCount = await countPdfPages(f)
        setPages(detectedCount)
      } catch {
        setFileError('Could not read this PDF. It may be password-protected or non-standard.')
        detectedCount = 1
        setPages(1)
      } finally {
        setDetectingPages(false)
      }
    } else {
      setPages(1)
    }

    const currentItem = selectedItem || initialDefaultItem
    if (currentItem) {
      const priceCalc = calculatePrice({
        item: currentItem,
        pages: detectedCount,
        copies: 1,
        isColor: false,
        isDuplex: false,
      })
      const unitLabel = currentItem.pricing_model === 'per_page' ? 'pages' : 'item'
      const fallbackPricing = {
        unitPrice: currentItem.price_bw,
        billedUnits: detectedCount,
        unitLabel,
        total: currentItem.price_bw * detectedCount,
      }

      if (isAddingNew || documents.length === 0) {
        const newDocId = crypto.randomUUID()
        const newDoc: DocumentItem = {
          id: newDocId,
          file: f,
          rawUploadedFile: f,
          serviceItem: currentItem,
          pages: detectedCount,
          pageSelectionMode: 'all',
          customPages: '',
          copies: 1,
          isColor: false,
          isDuplex: false,
          pricing: priceCalc || fallbackPricing,
          studioPreviewUrl: null,
          legalStampSettings: null,
        }
        setDocuments((prev) => [...prev, newDoc])
        setActiveDocId(newDocId)
        setIsAddingNew(false)
      } else if (activeDocId) {
        // Replace current active document file
        setDocuments((prev) =>
          prev.map((doc) => {
            if (doc.id === activeDocId) {
              return {
                ...doc,
                file: f,
                rawUploadedFile: f,
                pages: detectedCount,
                pageSelectionMode: 'all',
                customPages: '',
                pricing: priceCalc || fallbackPricing,
              }
            }
            return doc
          })
        )
      }
    }

    // If selected service is Legal/Stamp Paper, auto-open the visual preview modal!
    if (selectedItem && checkServiceType(selectedItem) === 'legal-stamp') {
      setShowLegalStampModal(true)
    }
  }

  // Handle multiple files dropped or selected simultaneously
  async function handleMultipleFiles(fileList: File[]) {
    setDetectingPages(true)
    try {
      const currentItem = selectedItem || initialDefaultItem
      if (!currentItem) return

      const newDocs: DocumentItem[] = []
      for (const f of fileList) {
        const ext = f.name.split('.').pop()?.toLowerCase() || ''
        if (
          f.name === 'DOCX_NOT_ALLOWED' ||
          ['doc', 'docx'].includes(ext) ||
          f.type.includes('word') ||
          f.type.includes('officedocument')
        ) {
          continue
        }
        if (f.size > MAX_UPLOAD_BYTES) continue

        let count = 1
        if (f.type === 'application/pdf') {
          try {
            count = await countPdfPages(f)
          } catch {
            count = 1
          }
        }

        const priceCalc = calculatePrice({
          item: currentItem,
          pages: count,
          copies: 1,
          isColor: false,
          isDuplex: false,
        })
        const unitLabel = currentItem.pricing_model === 'per_page' ? 'pages' : 'item'

        newDocs.push({
          id: crypto.randomUUID(),
          file: f,
          rawUploadedFile: f,
          serviceItem: currentItem,
          pages: count,
          pageSelectionMode: 'all',
          customPages: '',
          copies: 1,
          isColor: false,
          isDuplex: false,
          pricing: priceCalc || {
            unitPrice: currentItem.price_bw,
            billedUnits: count,
            unitLabel,
            total: currentItem.price_bw * count,
          },
          studioPreviewUrl: null,
          legalStampSettings: null,
        })
      }

      if (newDocs.length > 0) {
        setDocuments((prev) => [...prev, ...newDocs])
        handleSelectDoc(newDocs[0].id)
        setIsAddingNew(false)
      }
    } finally {
      setDetectingPages(false)
    }
  }

  // Handle Legal Stamp confirmed layout
  const handleLegalStampConfirmed = (
    formattedFile: File,
    previewUrl: string,
    settings: LegalStampSettings
  ) => {
    setFile(formattedFile)
    setStudioPreviewUrl(previewUrl)
    setLegalStampSettings(settings)
    setShowLegalStampModal(false)
    setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    setActiveStudio('none')

    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: 1,
              copies: doc.copies,
              isColor: doc.isColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              file: formattedFile,
              studioPreviewUrl: previewUrl,
              legalStampSettings: settings,
              pages: 1,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  // Handle studio generated output (ID Card A4 sheet or Legal Stamp sheet)
  const handleStudioLayoutReady = (generatedFile: File, previewUrl: string) => {
    setFile(generatedFile)
    setStudioPreviewUrl(previewUrl)
    setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    setActiveStudio('none') // Collapse studio back to configuration summary

    if (activeDocId) {
      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id === activeDocId) {
            const price = calculatePrice({
              item: doc.serviceItem,
              pages: 1,
              copies: doc.copies,
              isColor: doc.isColor,
              isDuplex: doc.isDuplex,
            })
            return {
              ...doc,
              file: generatedFile,
              studioPreviewUrl: previewUrl,
              pages: 1,
              pricing: price || doc.pricing,
            }
          }
          return doc
        })
      )
    }
  }

  async function handleSubmit(method: PaymentMethod) {
    if (documents.length === 0 && (!selectedItem || !file || !pricing || !selectedPages)) return
    setSubmitting(true)
    setSubmittingMethod(method)
    setSubmitError(undefined)

    // Build the collection of documents to submit
    const docsToSubmit: DocumentItem[] =
      documents.length > 0
        ? documents
        : file && selectedItem && pricing
        ? [
            {
              id: crypto.randomUUID(),
              file,
              rawUploadedFile: file,
              serviceItem: selectedItem,
              pages,
              pageSelectionMode,
              customPages,
              copies,
              isColor,
              isDuplex,
              pricing,
              studioPreviewUrl,
              legalStampSettings,
            },
          ]
        : []

    if (docsToSubmit.length === 0) {
      setSubmitting(false)
      return
    }

    const totalAmount = docsToSubmit.reduce((sum, d) => sum + d.pricing.total, 0)
    const itemsListForReceipt: ConfirmedDocumentItem[] = docsToSubmit.map((d) => ({
      name: d.file.name,
      pages: d.pricing.billedUnits,
      copies: d.copies,
      isColor: d.isColor,
      amount: d.pricing.total,
    }))

    try {
      const uploadedJobs = []

      for (let i = 0; i < docsToSubmit.length; i++) {
        const doc = docsToSubmit[i]
        setUploadStatusText(
          docsToSubmit.length > 1
            ? `Uploading Document ${i + 1} of ${docsToSubmit.length}: ${doc.file.name}...`
            : `Uploading ${doc.file.name}...`
        )

        const path = `${shop.id}/${crypto.randomUUID()}-${doc.file.name}`
        const { error: uploadError } = await supabaseBrowser.storage.from(UPLOAD_BUCKET).upload(path, doc.file, {
          contentType: doc.file.type,
          upsert: false,
        })

        if (uploadError) throw new Error(`Upload failed for ${doc.file.name}. Check your connection and try again.`)

        const { data: publicUrlData } = supabaseBrowser.storage.from(UPLOAD_BUCKET).getPublicUrl(path)

        uploadedJobs.push({
          serviceCode: doc.serviceItem.service_code,
          filename: doc.file.name,
          fileUrl: publicUrlData.publicUrl,
          fileType: doc.file.type === 'application/pdf' ? 'pdf' : doc.file.type.split('/')[1] ?? 'pdf',
          pages: doc.pages,
          pageSelection: pageSelectionLabel(doc.pageSelectionMode, doc.customPages),
          copies: doc.copies,
          isColor: doc.isColor,
          isDuplex: doc.isDuplex,
          totalAmount: doc.pricing.total,
        })
      }

      setUploadStatusText('Queueing all prints at shop counter...')

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopSlug: shop.slug,
          paymentMethod: method,
          totalAmount,
          jobs: uploadedJobs,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong. Please try again.')
      }

      const data = await res.json()

      if (method === 'cashfree') {
        setCashfreeOrderData({
          jobId: data.jobId,
          jobIds: data.jobIds || [data.jobId],
          total: totalAmount,
          paymentSessionId: data.paymentSessionId,
          cashfreeEnv: data.cashfreeEnv,
          itemsList: itemsListForReceipt,
        })
        return
      }

      if (method === 'upi' && data.upiIntentUrl) {
        window.location.href = data.upiIntentUrl
      }

      const newJobRecord = { jobId: data.jobId, total: totalAmount }
      try {
        const key = `print-history-${shop.shop_name}`
        const existing = JSON.parse(sessionStorage.getItem(key) || '[]')
        sessionStorage.setItem(key, JSON.stringify([...existing, newJobRecord]))
      } catch (e) {}

      setConfirmedJob({
        jobId: data.jobId,
        jobIds: data.jobIds || [data.jobId],
        total: totalAmount,
        method,
        itemsList: itemsListForReceipt,
      })
      setStage('done')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
      setSubmittingMethod(undefined)
      setUploadStatusText('')
    }
  }

  function resetFlow() {
    setDocuments([])
    setActiveDocId(null)
    setIsAddingNew(false)
    setFile(null)
    setRawUploadedFile(null)
    setStudioPreviewUrl(null)
    setActiveStudio('none')
    setPages(1)
    setPageSelectionMode('all')
    setCustomPages('')
    setCopies(1)
    setIsColor(false)
    setIsDuplex(false)
    setFileError(undefined)
    setSubmitError(undefined)
    setConfirmedJob(null)
    setStage('configure')
    setSelectedItem(initialDefaultItem)
  }

  if (stage === 'done' && confirmedJob) {
    return (
      <ConfirmationScreen
        jobId={confirmedJob.jobId}
        jobIds={confirmedJob.jobIds}
        total={confirmedJob.total}
        paymentMethod={confirmedJob.method}
        shopName={shop.shop_name}
        shopUpiVpa={shop.upi_vpa}
        itemsList={confirmedJob.itemsList}
        language={lang}
        onPrintAnother={resetFlow}
      />
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-md pb-36 bg-paper">
      {/* Redesigned Shop Header - Admin Link hidden on public customer front */}
      <ShopHeader
        shop={shop}
        showAdminLink={false}
        language={lang}
        onLanguageChange={handleLanguageChange}
      />

      <div className="animate-rise space-y-4 px-4 py-4">
        {/* Banner Slider Section */}
        <BannerSlider banners={banners} />

        {/* Value Proposition & 4-Step Highlight Banner */}
        <HowItWorksBanner language={lang} />

        {/* Offline Warning Notice if shop paused */}
        {!shop.is_online && (
          <div className="flex items-center gap-2 rounded-xl bg-danger-50 p-3.5 text-xs text-danger-600 border border-danger-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-bold">{t.shopOfflineTitle}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{t.shopOfflineMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1 & 2 Unified: Direct Front-Page Service Switcher & Standard Print Upload */}
        {selectedItem && (
          <div className="space-y-4 pt-1">
            {/* Service Switcher Bar: Easily switch between Standard Print, ID Card, Stamp, etc. */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted">
                  {t.choosePrintService}
                </span>
                {availableItems.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setShowAllServicesModal(true)}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{t.allServicesAndRates}</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {availableItems.map((it) => {
                  const isSelected = selectedItem.id === it.id
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => selectService(it)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-xs scale-[1.01]'
                          : 'border border-line bg-white text-ink hover:bg-brand-50/40 hover:border-brand-300'
                      }`}
                    >
                      <span>{getServiceIcon(it)}</span>
                      <span>{it.display_name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-white ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Quick Specialized Studio Toggles - only show if respective service is active */}
            {(availableItems.some((it) => checkServiceType(it) === 'id-card') ||
              availableItems.some((it) => checkServiceType(it) === 'legal-stamp')) && (
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-paper border border-line">
                {availableItems.some((it) => checkServiceType(it) === 'id-card') && (
                  <button
                    type="button"
                    onClick={() => setActiveStudio(activeStudio === 'id-card' ? 'none' : 'id-card')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeStudio === 'id-card'
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>ID Card A4 Tool</span>
                  </button>
                )}

                {availableItems.some((it) => checkServiceType(it) === 'legal-stamp') && (
                  <button
                    type="button"
                    onClick={() => {
                      const stampItem =
                        availableItems.find((it) => checkServiceType(it) === 'legal-stamp') ||
                        selectedItem
                      selectService(stampItem)
                      setShowLegalStampModal(true)
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      checkServiceType(selectedItem) === 'legal-stamp'
                        ? 'bg-brand-600 text-white shadow-2xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <Scale className="h-3.5 w-3.5" />
                    <span>Legal/Stamp Tool</span>
                  </button>
                )}
              </div>
            )}

            {/* Legal / Stamp Paper Specialized Banner & Confirmation Card */}
            {checkServiceType(selectedItem) === 'legal-stamp' && (
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-50/50 p-4 space-y-3 animate-fade-in shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xs flex-shrink-0">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-brand-900">
                          Legal / Stamp Paper Print Mode
                        </h4>
                        <span className="rounded-full bg-brand-200/70 px-2 py-0.5 text-[10px] font-bold text-brand-900">
                          Auto-Margin Predefined
                        </span>
                      </div>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">
                        Guaranteed 75mm top gap for Government stamp seals &amp; 32mm court margin for punch-hole filing.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLegalStampModal(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{legalStampSettings ? 'Adjust Margins' : 'Preview Layout'}</span>
                  </button>
                </div>

                {/* Confirmed / Pending Status Banner */}
                {legalStampSettings ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2.5 border border-brand-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2 text-ink">
                      <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
                      <span>
                        <strong>Layout Confirmed:</strong> {legalStampSettings.topGapMm}mm Top Clearance &middot; {legalStampSettings.leftMarginMm}mm Court Margin &middot; {legalStampSettings.paperFormat.toUpperCase()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLegalStampModal(true)}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      Re-preview / Change
                    </button>
                  </div>
                ) : file ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>Document uploaded. Please confirm legal margins before printing.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLegalStampModal(true)}
                      className="rounded-lg bg-amber-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-amber-700 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      Review &amp; Confirm
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[11px] text-brand-700 bg-white/80 p-2 rounded-xl border border-brand-100">
                    <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Upload your agreement or contract below — visual preview modal will open automatically!</span>
                  </div>
                )}
              </div>
            )}

            {/* 1. Specialized Studio: ID CARD AUTO CROP & SIDE-BY-SIDE A4 */}
            {activeStudio === 'id-card' && (
              <IDCardStudio
                onLayoutReady={handleStudioLayoutReady}
                onCancel={() => setActiveStudio('none')}
              />
            )}

            {/* 2. Specialized Studio: LEGAL & STAMP PAPER MARGIN FORMATTER */}
            {activeStudio === 'legal-stamp' && (
              <LegalStampStudio
                onLayoutReady={handleStudioLayoutReady}
                onCancel={() => setActiveStudio('none')}
              />
            )}

            {/* If Studio generated a sheet, show rich formatted preview card */}
            {studioPreviewUrl && file && activeStudio === 'none' && (
              <div className="rounded-2xl border-2 border-brand-500 bg-brand-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-900">
                    <CheckCircle2 className="h-4 w-4 text-success-600" />
                    Specialized Sheet Generated &middot; Ready for Print
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = checkServiceType(selectedItem)
                      setActiveStudio(detected !== 'none' ? detected : 'id-card')
                    }}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline"
                  >
                    Modify Layout
                  </button>
                </div>

                <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-line">
                  <div className="h-16 w-12 rounded border border-line bg-paper overflow-hidden flex-shrink-0 shadow-xs">
                    <img
                      src={studioPreviewUrl}
                      alt="Sheet Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-ink truncate">{file.name}</p>
                    <p className="text-[11px] text-muted">
                      1 Sheet (Composite) &middot; {(file.size / 1024).toFixed(0)} KB
                    </p>
                    <p className="text-[10px] text-success-700 font-semibold mt-0.5">
                      ✓ Pre-calibrated margins &amp; auto-alignment applied
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Multi-Document Batch List (Merged Print Cart) */}
            {documents.length > 0 && (
              <DocumentBatchList
                documents={documents}
                activeDocId={activeDocId}
                language={lang}
                onSelectDoc={handleSelectDoc}
                onRemoveDoc={handleRemoveDoc}
                onAddAnotherClick={handleAddAnother}
                isAddingNew={isAddingNew}
              />
            )}

            {/* Standard Dropzone (when adding a document or no documents uploaded yet) */}
            {activeStudio === 'none' && !studioPreviewUrl && (isAddingNew || documents.length === 0) && (
              <div id="upload-dropzone-container" className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    {isAddingNew ? (
                      <>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-extrabold text-white">
                          {documents.length + 1}
                        </span>
                        <span>Add Document #{documents.length + 1}</span>
                      </>
                    ) : (
                      <span>{selectedItem.display_name} Upload</span>
                    )}
                  </label>
                  {isAddingNew ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNew(false)
                        if (documents.length > 0) {
                          handleSelectDoc(documents[documents.length - 1].id)
                        }
                      }}
                      className="text-xs font-bold text-muted hover:text-ink cursor-pointer underline"
                    >
                      Cancel
                    </button>
                  ) : (
                    <span className="text-[11px] text-muted">Max 40 MB &middot; PDF &amp; Images</span>
                  )}
                </div>

                <UploadDropzone
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  file={file}
                  onFile={handleFile}
                  multiple={true}
                  onMultipleFiles={handleMultipleFiles}
                  documentNumber={documents.length + 1}
                  onClear={() => {
                    setFile(null)
                    setPages(1)
                    setStudioPreviewUrl(null)
                  }}
                  pages={pages}
                  detectingPages={detectingPages}
                  error={fileError}
                  language={lang}
                />
              </div>
            )}

            {detectingPages && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-white p-3 text-xs text-brand-700 border border-brand-200 shadow-2xs">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                <span>Reading document page count and layout…</span>
              </div>
            )}

            {/* Print Options for Currently Selected Document */}
            {activeDoc && !detectingPages && !isAddingNew && (
              <div className="space-y-4 pt-1 animate-fade-in">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-line">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink truncate max-w-[200px]">
                    Settings: {activeDoc.file.name}
                  </span>
                  <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Doc {documents.findIndex((d) => d.id === activeDoc.id) + 1} of {documents.length}
                  </span>
                </div>

                {activeDoc.file.type === 'application/pdf' && pages > 1 && (
                  <PageSelection
                    totalPages={pages}
                    mode={pageSelectionMode}
                    customPages={customPages}
                    error={pageSelectionError}
                    language={lang}
                    onModeChange={handlePageModeChange}
                    onCustomPagesChange={handleCustomPagesChange}
                  />
                )}

                <JobOptions
                  item={activeDoc.serviceItem}
                  copies={copies}
                  isColor={isColor}
                  isDuplex={isDuplex}
                  language={lang}
                  onCopiesChange={handleCopiesChange}
                  onColorChange={handleColorChange}
                  onDuplexChange={handleDuplexChange}
                />

                {/* Clear "Add Another Document" prompt */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddAnother}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand-700 font-bold text-xs transition-all shadow-2xs cursor-pointer hover:border-brand-500"
                  >
                    <span>+ Add Another Document (Merge &amp; Pay Together)</span>
                  </button>
                </div>
              </div>
            )}

            {submitError && (
              <div className="rounded-xl bg-danger-50 p-3 text-xs text-danger-500 border border-danger-200">
                {submitError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Unified Fixed Bottom Price & Pay Bar */}
      {selectedItem && (pricing || documents.length > 0) && (
        <PriceBar
          total={grandTotal}
          billedUnits={grandBilledUnits}
          language={lang}
          unitLabel={
            documents.length > 1
              ? 'pages'
              : selectedItem.pricing_model === 'per_page'
              ? isDuplex && selectedItem.supports_duplex
                ? 'sheets'
                : 'pages'
              : 'item'
          }
          copies={documents.length > 1 ? 1 : copies}
          disabled={(documents.length === 0 && !file) || detectingPages || !shop.is_online}
          hasFile={documents.length > 0 || !!file}
          fileName={
            documents.length === 1
              ? documents[0].file.name
              : documents.length > 1
              ? `${documents.length} Documents in Queue`
              : file?.name
          }
          serviceName={documents.length > 1 ? `${documents.length} Documents (Merged Total)` : selectedItem.display_name}
          isColor={documents.length === 1 ? isColor : documents.some((d) => d.isColor)}
          isDuplex={documents.length === 1 ? isDuplex : documents.some((d) => d.isDuplex)}
          unitPrice={isColor ? (selectedItem.price_color ?? selectedItem.price_bw) : selectedItem.price_bw}
          isOnline={shop.is_online}
          detectingPages={detectingPages}
          submitting={submitting}
          submittingMethod={submittingMethod}
          itemsCount={documents.length}
          itemsBreakdown={documents.map((d) => ({
            id: d.id,
            name: d.file.name,
            details: `${d.pricing.billedUnits} pgs, ${d.isColor ? 'Color' : 'B&W'}${d.copies > 1 ? ` × ${d.copies}` : ''}`,
            amount: d.pricing.total,
          }))}
          onPayClick={() => setShowPaymentModal(true)}
          onUploadClick={() => {
            const input = document.getElementById('smartprint-file-input') as HTMLInputElement
            if (input) {
              input.click()
            } else {
              const dropzone = document.getElementById('upload-dropzone-container')
              dropzone?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }}
        />
      )}

      {/* Payment Method Selection Popup Modal */}
      {selectedItem && (pricing || documents.length > 0) && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          total={grandTotal}
          billedUnits={grandBilledUnits}
          language={lang}
          unitLabel={
            documents.length > 1
              ? 'pages'
              : selectedItem.pricing_model === 'per_page'
              ? isDuplex && selectedItem.supports_duplex
                ? 'sheets'
                : 'pages'
              : 'item'
          }
          copies={documents.length > 1 ? 1 : copies}
          fileName={
            documents.length === 1
              ? documents[0].file.name
              : documents.length > 1
              ? `${documents.length} Documents`
              : file?.name
          }
          serviceName={documents.length > 1 ? `${documents.length} Documents` : selectedItem.display_name}
          enableCounter={shop.enable_counter_pay !== false}
          enableUpi={shop.enable_upi_pay !== false}
          enableOnline={shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false}
          submitting={submitting}
          submittingMethod={submittingMethod}
          itemsCount={documents.length}
          itemsBreakdown={documents.map((d) => ({
            id: d.id,
            name: d.file.name,
            details: `${d.pricing.billedUnits} pgs, ${d.isColor ? 'Color' : 'B&W'}${d.copies > 1 ? ` × ${d.copies}` : ''}`,
            amount: d.pricing.total,
          }))}
          onSelectMethod={(method) => {
            setShowPaymentModal(false)
            handleSubmit(method)
          }}
        />
      )}

      {/* Submitting Progress Overlay with Real-time Status */}
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl border border-line animate-rise space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">
                {uploadStatusText ||
                  (submittingMethod === 'cashfree'
                    ? 'Connecting to Cashfree Gateway...'
                    : submittingMethod === 'upi'
                    ? 'Preparing Instant UPI App...'
                    : 'Dispatching Print Order...')}
              </h3>
              <p className="mt-1 text-xs text-muted leading-relaxed">
                {submittingMethod === 'cashfree'
                  ? 'Initializing secure payment session for Cards, NetBanking, and UPI...'
                  : 'Your documents are being queued and sent directly to the shop counter agent.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Services & Rate Card Catalog Modal */}
      {showAllServicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-line animate-rise overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-line bg-paper">
              <div>
                <h3 className="text-sm font-bold text-ink">All Print Services &amp; Rates</h3>
                <p className="text-[11px] text-muted">Tap any service to select for printing</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllServicesModal(false)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              <ServiceSelector
                items={availableItems}
                language={lang}
                onSelect={(it) => {
                  selectService(it)
                  setShowAllServicesModal(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legal & Stamp Paper Visual Preview Modal */}
      {showLegalStampModal && (
        <LegalStampModal
          isOpen={showLegalStampModal}
          file={rawUploadedFile || file}
          initialSettings={legalStampSettings || undefined}
          onClose={() => setShowLegalStampModal(false)}
          onConfirm={handleLegalStampConfirmed}
        />
      )}

      {/* Cashfree Payment Modal */}
      {cashfreeOrderData && (
        <CashfreeModal
          isOpen={Boolean(cashfreeOrderData)}
          total={cashfreeOrderData.total}
          jobId={cashfreeOrderData.jobId}
          jobIds={cashfreeOrderData.jobIds}
          paymentSessionId={cashfreeOrderData.paymentSessionId}
          cashfreeEnv={cashfreeOrderData.cashfreeEnv}
          shopName={shop.shop_name}
          onClose={() => setCashfreeOrderData(null)}
          onSuccess={() => {
            const newJobRecord = { jobId: cashfreeOrderData.jobId, total: cashfreeOrderData.total }
            try {
              const key = `print-history-${shop.shop_name}`
              const existing = JSON.parse(sessionStorage.getItem(key) || '[]')
              sessionStorage.setItem(key, JSON.stringify([...existing, newJobRecord]))
            } catch (e) {}

            setConfirmedJob({
              jobId: cashfreeOrderData.jobId,
              jobIds: cashfreeOrderData.jobIds,
              total: cashfreeOrderData.total,
              method: 'cashfree',
              itemsList: cashfreeOrderData.itemsList,
            })
            setCashfreeOrderData(null)
            setStage('done')
          }}
        />
      )}
    </main>
  )
}
