'use client'

import { useRef, useState } from 'react'
import { MAX_UPLOAD_BYTES } from '@/lib/supabaseBrowser'

interface Props {
  accept: string
  file: File | null
  onFile: (file: File) => void
  error?: string
}

export default function UploadDropzone({ accept, file, onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const f = files[0]
    if (f.size > MAX_UPLOAD_BYTES) {
      onFile(f) // let parent surface the size error via `error` prop after validating
      return
    }
    onFile(f)
  }

  return (
    <div>
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-4 py-10 text-center transition-colors ${
          dragging ? 'border-brand-600 bg-brand-50' : 'border-line bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {file ? (
          <>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-muted">{(file.size / (1024 * 1024)).toFixed(1)} MB &middot; tap to replace</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Tap to choose a file</p>
            <p className="mt-1 text-xs text-muted">or drag it here &middot; up to 40 MB</p>
          </>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger-500">{error}</p>}
    </div>
  )
}
