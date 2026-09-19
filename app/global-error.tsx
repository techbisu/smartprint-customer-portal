'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center p-4 text-center font-sans">
        <h2 className="text-2xl font-bold">A critical error occurred</h2>
        <p className="mt-2 text-muted-foreground">The application encountered a fatal error.</p>
        <button
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
        >
          Recover
        </button>
      </body>
    </html>
  )
}
