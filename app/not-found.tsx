export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
      <a href="/" className="mt-4 text-brand-600 hover:underline">
        Go back home
      </a>
    </div>
  )
}
