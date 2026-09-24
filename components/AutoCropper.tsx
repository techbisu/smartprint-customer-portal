'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { autoProcessDocument, checkOpenCV } from '@/lib/imageProcessing'
import { Loader2, CheckCircle, RefreshCcw } from 'lucide-react'

interface AutoCropperProps {
  file: File
  onComplete: (file: File, previewUrl: string) => void
  onCancel: () => void
}

export default function AutoCropper({ file, onComplete, onCancel }: AutoCropperProps) {
  const [status, setStatus] = useState<'loading_cv' | 'processing' | 'done' | 'error'>('loading_cv')
  const [processedFile, setProcessedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // When OpenCV is ready, start processing
  const startProcessing = async () => {
    setStatus('processing')
    try {
      const { blob } = await autoProcessDocument(file)
      // Convert Blob to File
      const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_scanned.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      })
      const url = URL.createObjectURL(newFile)
      setProcessedFile(newFile)
      setPreviewUrl(url)
      setStatus('done')
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Failed to process document.')
      setStatus('error')
    }
  }

  // Effect to check if OpenCV is already loaded
  useEffect(() => {
    if (checkOpenCV() && status === 'loading_cv') {
      startProcessing()
    }
  }, [file])

  const handleConfirm = () => {
    if (processedFile && previewUrl) {
      onComplete(processedFile, previewUrl)
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-white/50 backdrop-blur-md rounded-2xl border shadow-sm mt-4 min-h-[400px]">
      <Script 
        src="https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0/build/opencv.js" 
        strategy="lazyOnload"
        onLoad={() => {
          if (status === 'loading_cv') {
            startProcessing()
          }
        }}
      />

      {(status === 'loading_cv' || status === 'processing') && (
        <div className="flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              {status === 'loading_cv' ? 'Loading Scanner Engine...' : 'Scanning your document...'}
            </h3>
            <p className="text-gray-500 mt-1">Applying smart crop and auto-enhancement</p>
          </div>
        </div>
      )}

      {status === 'done' && previewUrl && (
        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center text-green-600 mb-4 space-x-2">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-xl font-semibold text-gray-800">Perfect! Ready to Print</h3>
          </div>
          
          <div className="relative w-full max-w-sm aspect-[1/1.414] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
            <img 
              src={previewUrl} 
              alt="Scanned Document Preview" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex w-full max-w-sm gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-[1.02]"
            >
              Confirm & Use
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Oops, something went wrong</h3>
            <p className="text-gray-500 mt-1">{errorMsg}</p>
          </div>
          <button
            onClick={onCancel}
            className="mt-4 py-2 px-6 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
