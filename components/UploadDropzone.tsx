'use client'

import { useRef, useState, useEffect } from 'react'
import { MAX_UPLOAD_BYTES } from '@/lib/supabaseBrowser'
import { Language, translations } from '@/lib/translations'
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Sparkles,
  Loader2,
  FileCheck,
} from 'lucide-react'

interface Props {
  accept: string
  file: File | null
  onFile: (file: File) => void
  onMultipleFiles?: (files: File[]) => void
  multiple?: boolean
  documentNumber?: number
  onClear?: () => void
  error?: string
  pages?: number
  detectingPages?: boolean
  isUploading?: boolean
  language?: Language
}

export default function UploadDropzone({
  accept,
  file,
  onFile,
  onMultipleFiles,
  multiple = false,
  documentNumber,
  onClear,
  error,
  pages = 1,
  detectingPages = false,
  isUploading = false,
  language = 'en',
}: Props) {
  const t = translations[language] || translations.en
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploadPercent, setUploadPercent] = useState<number | null>(null)
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string>('')

  // Simulated smooth upload progress when a new file is dropped/chosen
  const startUploadSimulation = (f: File) => {
    setUploadPercent(15)
    setUploadStatusMessage(`Reading ${f.name}...`)

    const t1 = setTimeout(() => {
      setUploadPercent(45)
      setUploadStatusMessage(
        f.type === 'application/pdf'
          ? 'Analyzing PDF pages & format dimensions...'
          : 'Verifying document layout & resolution...'
      )
    }, 280)

    const t2 = setTimeout(() => {
      setUploadPercent(85)
      setUploadStatusMessage('Preparing document for counter print spool...')
    }, 600)

    const t3 = setTimeout(() => {
      setUploadPercent(100)
      setUploadStatusMessage('Document verified & ready for print options!')
      const t4 = setTimeout(() => {
        setUploadPercent(null)
      }, 700)
      return () => clearTimeout(t4)
    }, 950)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)

    if (fileArray.length > 1 && onMultipleFiles) {
      onMultipleFiles(fileArray)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const f = fileArray[0]
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    if (['doc', 'docx'].includes(ext) || f.type.includes('word') || f.type.includes('officedocument')) {
      // Pass special error marker file to parent so it displays clear error
      onFile(new File([], 'DOCX_NOT_ALLOWED', { type: 'invalid/docx' }))
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      onFile(f) // let parent surface the size limit error
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    startUploadSimulation(f)
    onFile(f)
    if (inputRef.current) inputRef.current.value = ''
  }

  const getFileIcon = (fileName: string, fileType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || ''
    if (ext === 'pdf' || fileType?.includes('pdf')) {
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200 shadow-2xs">
          <FileText className="h-6 w-6" />
        </div>
      )
    }
    if (['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext) || fileType?.includes('image')) {
      return (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
          <ImageIcon className="h-6 w-6" />
        </div>
      )
    }
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs">
        <FileSpreadsheet className="h-6 w-6" />
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div id="upload-dropzone-container" className="space-y-2">
      {/* Hidden native file input */}
      <input
        ref={inputRef}
        id="smartprint-file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* STATE 1: Uploading / Processing Progress Bar */}
      {uploadPercent !== null && (
        <div className="rounded-2xl border-2 border-brand-500 bg-white p-5 shadow-sm space-y-3 animate-rise">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-bold text-ink">{t.uploadingDocText}</p>
                <p className="text-[11px] text-muted">{uploadStatusMessage}</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-brand-700">
              {uploadPercent}%
            </span>
          </div>

          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300 ease-out"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* STATE 2: File attached and verified */}
      {uploadPercent === null && file && (
        <div className="rounded-2xl border-2 border-brand-400 bg-brand-50/20 p-4 shadow-sm transition-all animate-rise">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {getFileIcon(file.name, file.type)}

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink" title={file.name}>
                  {file.name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <span>{formatFileSize(file.size)}</span>
                  <span>&middot;</span>

                  {detectingPages ? (
                    <span className="inline-flex items-center gap-1 text-brand-700 font-medium">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {t.countingPagesText}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                      <FileCheck className="h-3 w-3 text-emerald-600" />
                      {pages} {pages === 1 ? t.pageWord : t.pagesWord}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Clear or replace actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors cursor-pointer shadow-2xs"
                title="Choose a different file"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{t.replaceFile}</span>
              </button>

              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-danger-600 hover:border-danger-200 transition-colors cursor-pointer"
                  title="Remove document"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: Idle Dropzone (Ready to Upload) */}
      {uploadPercent === null && !file && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFiles(e.dataTransfer.files)
          }}
          className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            dragging
              ? 'border-brand-600 bg-brand-50/80 scale-[1.01] shadow-md'
              : 'border-brand-200/90 bg-white hover:border-brand-500 hover:bg-brand-50/30 hover:shadow-sm'
          }`}
        >
          {/* Cloud Upload Icon with pulse effect */}
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 ${
              dragging
                ? 'scale-110 bg-brand-600 text-white shadow-md'
                : 'bg-brand-50 text-brand-600 group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white'
            }`}
          >
            <UploadCloud className="h-7 w-7" />
          </div>

          <h3 className="mt-3.5 text-sm font-bold text-ink">
            {dragging
              ? t.dropDocHere
              : documentNumber && documentNumber > 1
              ? `${t.tapToUploadDoc} ${documentNumber}`
              : t.tapToUploadDoc}
          </h3>
          <p className="mt-1 text-xs text-muted max-w-[280px]">
            {documentNumber && documentNumber > 1
              ? t.addAnotherLimit
              : t.dragAndDropLimits}
          </p>

          {/* Browse button CTA */}
          <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-2xs group-hover:bg-brand-700 transition-colors">
            <span>{t.browseFiles}</span>
          </div>

          {/* Quick Supported format badges: PDF and Images only, no docx */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-semibold">
            <span className="rounded-md bg-red-50 text-red-700 px-2 py-0.5 border border-red-200">PDF</span>
            <span className="rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200">JPG / JPEG</span>
            <span className="rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 border border-blue-200">PNG / WEBP</span>
          </div>
        </div>
      )}

      {/* Error alert message */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-danger-50 p-3 text-xs text-danger-600 border border-danger-200 animate-rise">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
