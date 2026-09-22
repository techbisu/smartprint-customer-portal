'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Wifi,
  Printer,
  Key,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  HelpCircle,
  Play,
  Flame,
  Globe,
  Download,
} from 'lucide-react'
import { Shop } from '@/lib/types'

const AGENT_DOWNLOAD_PATH =
  process.env.NEXT_PUBLIC_DESKTOP_AGENT_DOWNLOAD_URL || '/downloads/SmartPrint-Agent-Setup.exe'


interface AgentTroubleshootModalProps {
  isOpen: boolean
  onClose: () => void
  shop: Shop
  isOnline: boolean
  lastSeen: number | null
  activePrinter?: string
  onReconnect: () => Promise<void>
  reconnecting: boolean
  onSimulateHeartbeat: (status: 'online' | 'offline') => Promise<void>
}

export default function AgentTroubleshootModal({
  isOpen,
  onClose,
  shop,
  isOnline,
  lastSeen,
  activePrinter,
  onReconnect,
  reconnecting,
  onSimulateHeartbeat,
}: AgentTroubleshootModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [simulating, setSimulating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !mounted) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const copyAllConfig = () => {
    const authUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`
    const text = [
      `# SmartPrint Desktop Agent Configuration`,
      `PORTAL_URL=${typeof window !== 'undefined' ? window.location.origin : ''}`,
      `AUTH_ENDPOINT=${authUrl}`,
      `SHOP_ID=${shop.id}`,
      `AGENT_AUTH_TOKEN=${shop.agent_auth_token || 'demo-agent-auth-token-12345'}`,
      `PUSHER_KEY=${shop.pusher_key || process.env.NEXT_PUBLIC_PUSHER_KEY || '2e5517c16c8d36b2969d'}`,
      `PUSHER_CLUSTER=${shop.pusher_cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'}`,
    ].join('\n')
    copyToClipboard(text, 'all_config')
  }

  const formatLastSeen = (timestamp: number | null) => {
    if (!timestamp) return 'No heartbeat recorded yet'
    const diffSeconds = Math.round((Date.now() - timestamp) / 1000)
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`
    const diffMinutes = Math.round(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
    const diffHours = Math.round(diffMinutes / 60)
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  }

  const handleSimulate = async (mode: 'online' | 'offline') => {
    setSimulating(true)
    try {
      await onSimulateHeartbeat(mode)
    } finally {
      setSimulating(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 backdrop-blur-xs p-3 sm:p-5 md:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-troubleshoot-title"
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="relative w-full max-w-2xl my-auto max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] flex flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header (Sticky, cannot shrink) */}
          <div className="flex-shrink-0 flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-line bg-surface/80">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ink">Desktop Agent Troubleshooting</h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isOnline
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {isOnline ? 'Active / Online' : 'Inactive / Offline'}
                </span>
              </div>
              <p className="text-xs text-muted">
                Connect your shop&apos;s physical printer workstation with the SmartPrint cloud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-paper hover:text-ink transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 text-ink text-sm overscroll-contain">
          {/* Status Diagnostic Card */}
          <div
            className={`rounded-xl p-4 border ${
              isOnline
                ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  {isOnline ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Desktop Agent is Connected & Ready to Print</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span>Desktop Agent Not Detected on Pusher</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted">
                  Last Heartbeat: <span className="font-semibold text-ink">{formatLastSeen(lastSeen)}</span>
                  {activePrinter && isOnline ? ` • Printer: ${activePrinter}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={onReconnect}
                  disabled={reconnecting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-ink border border-line shadow-2xs hover:bg-paper active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-brand-600 ${reconnecting ? 'animate-spin' : ''}`} />
                  <span>{reconnecting ? 'Pinging Agent...' : 'Reconnect Now'}</span>
                </button>
              </div>
            </div>

            {/* Quick Auth Endpoint URL copy */}
            <div className="mt-3 pt-3 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex-shrink-0">
                  Auth Endpoint URL:
                </span>
                <span className="font-mono text-xs text-ink bg-white/90 border border-line rounded px-2 py-0.5 truncate select-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`,
                    'authEndpointTop'
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-line shadow-2xs px-2.5 py-1 rounded-lg transition-all cursor-pointer flex-shrink-0 self-start sm:self-auto"
              >
                {copiedField === 'authEndpointTop' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success-600" />
                    <span className="text-success-700 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-brand-600" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Troubleshooting Checklist */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              Follow These Steps to Fix Offline Status
            </h3>

            {/* Step 1: Check Application Running & Download */}
            <div className="rounded-xl border border-line p-4 space-y-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-bold text-ink text-sm">Install & Run the Desktop Agent</h4>
                    <p className="text-xs text-muted leading-relaxed mt-0.5">
                      The SmartPrint Desktop Agent is a lightweight background service running in your Windows Taskbar tray.
                      If not yet installed on this PC, download and run the setup below.
                    </p>
                  </div>

                  <div className="pt-1">
                    <a
                      href={AGENT_DOWNLOAD_PATH}
                      download="SmartPrint-Agent-Setup.exe"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Desktop Agent (.exe)</span>
                    </a>
                  </div>

                  <div className="mt-2 rounded-lg bg-paper p-2.5 text-xs text-muted font-mono flex items-center justify-between">
                    <span>Target: SmartPrint Desktop Agent (Windows x64)</span>
                    <span className="text-[11px] bg-white px-2 py-0.5 rounded border border-line">Tray Service</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Match Auth Credentials */}
            <div className="rounded-xl border border-line p-4 space-y-3 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="space-y-2 flex-1">
                  <h4 className="font-bold text-ink text-sm">Verify Shop ID, Token & Auth Endpoint</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Open the Desktop Agent Settings window and verify that the <strong>Shop ID</strong>,{' '}
                    <strong>Access Token</strong>, and <strong>Auth Endpoint URL</strong> match below:
                  </p>

                  <div className="space-y-2 pt-1">
                    {/* Shop ID */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted mb-1">
                        <span>Shop ID</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-xs">
                        <span className="flex-1 truncate select-all">{shop.id}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(shop.id, 'shopId')}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-sans text-xs font-semibold"
                        >
                          {copiedField === 'shopId' ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedField === 'shopId' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Agent Token */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted mb-1">
                        <span>Agent Access Token</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-xs">
                        <span className="flex-1 truncate select-all">
                          {showToken ? (shop.agent_auth_token || 'demo-agent-auth-token-12345') : '••••••••••••••••••••••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="text-muted hover:text-ink p-0.5"
                          title={showToken ? 'Hide token' : 'Show token'}
                        >
                          {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(shop.agent_auth_token || 'demo-agent-auth-token-12345', 'token')
                          }
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-sans text-xs font-semibold"
                        >
                          {copiedField === 'token' ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Auth Endpoint URL */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted mb-1">
                        <span>Auth Endpoint URL</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-xs">
                        <span className="flex-1 truncate select-all">
                          {typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`,
                              'authEndpoint'
                            )
                          }
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-sans text-xs font-semibold"
                        >
                          {copiedField === 'authEndpoint' ? <Check className="h-3.5 w-3.5 text-success-600" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedField === 'authEndpoint' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Pusher Realtime Coordinates */}
            <div className="rounded-xl border border-line p-4 space-y-2 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="font-bold text-ink text-sm">Check Pusher Realtime Connection & Firewall</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    The desktop agent establishes a secure WebSocket to Pusher (<code className="font-mono text-[11px] bg-paper px-1 py-0.5 rounded">wss://ws-ap2.pusher.com</code> on port 443).
                    Ensure your counter computer is connected to the internet and antivirus/firewall is not blocking WebSocket ports.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-paper border border-line/60">
                      <span className="block text-muted text-[10px]">App Key</span>
                      <span className="truncate block font-semibold">{shop.pusher_key || '2e5517c16c8d36b2969d'}</span>
                    </div>
                    <div className="p-2 rounded bg-paper border border-line/60">
                      <span className="block text-muted text-[10px]">Cluster</span>
                      <span className="font-semibold">{shop.pusher_cluster || 'ap2'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Printer Spooler & Hardware */}
            <div className="rounded-xl border border-line p-4 space-y-2 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  4
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-ink text-sm">Check Physical Printer Hardware</h4>
                  <ul className="list-disc list-inside text-xs text-muted space-y-1 pl-1">
                    <li>Ensure your printer (HP, Canon, Epson, Brother) is powered <strong>ON</strong>.</li>
                    <li>Verify the USB cable or local Wi-Fi / Ethernet connection to the counter PC.</li>
                    <li>Clear any paper jams or Windows Print Spooler queue errors.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Test & Simulation Sandbox */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-brand-600" />
                  <h4 className="font-bold text-ink text-xs uppercase tracking-wide">
                    Live Testing & Simulation Sandbox
                  </h4>
                </div>
                <span className="text-[10px] font-semibold bg-white border border-brand-200 text-brand-800 px-2 py-0.5 rounded-full">
                  Developer & Preview Mode
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                If you are testing this dashboard without your physical shop PC running, you can simulate an agent heartbeat
                to verify that real-time Pusher status updates and live print job listeners trigger instantly.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate('online')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-brand-700 transition-all cursor-pointer"
                >
                  <Play className="h-3 w-3" />
                  <span>Simulate Agent Online (Ping)</span>
                </button>

                <button
                  type="button"
                  disabled={simulating}
                  onClick={() => handleSimulate('offline')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:bg-paper transition-all cursor-pointer"
                >
                  <span>Simulate Agent Offline</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Sticky, cannot shrink) */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-line bg-surface/90">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={AGENT_DOWNLOAD_PATH}
              download="SmartPrint-Agent-Setup.exe"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-brand-700 bg-white hover:bg-paper px-3 py-1.5 rounded-xl border border-line shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-brand-600" />
              <span>Download .exe</span>
            </a>

            <button
              type="button"
              onClick={copyAllConfig}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100/80 px-3 py-1.5 rounded-xl border border-brand-200 transition-colors cursor-pointer"
            >
              {copiedField === 'all_config' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-success-600" />
                  <span className="text-success-700">Copied Full Config (.env)!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-brand-600" />
                  <span>Copy Full Agent Config</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-ink text-white px-5 py-2 text-xs font-bold hover:bg-ink/90 transition-colors cursor-pointer ml-auto"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  </div>,
  document.body
  )
}
