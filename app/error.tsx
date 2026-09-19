'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="mt-2 text-muted-foreground">{error.message || 'An unexpected error occurred'}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
      >
        Try again
      </button>
    </div>
  )
}
