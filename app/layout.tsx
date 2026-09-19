import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SmartPrint Customer Portal',
  description: 'Scan, upload, print — mobile-first print shop customer portal for picking services, uploading files, calculating prices, and paying.',
  openGraph: {
    title: 'SmartPrint Customer Portal',
    description: 'Scan, upload, print — mobile-first print shop customer portal for picking services, uploading files, calculating prices, and paying.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="bg-paper text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
