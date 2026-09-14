export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl">
        🔍
      </div>
      <h1 className="text-lg font-semibold">We couldn't find this shop</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        The QR code or link you used doesn't match an active print shop. Ask the counter to check
        their printed QR standee.
      </p>
    </main>
  )
}
