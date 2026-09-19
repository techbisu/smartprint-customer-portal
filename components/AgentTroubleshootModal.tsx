'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { Shop } from '@/lib/types'

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

  if (!isOpen) return null

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-line overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/50">
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
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-ink text-sm">
          {/* Status Diagnostic Card */}
          <div
            className={`rounded-xl p-4 border ${
              isOnline
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-950'
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-ink border border-line shadow-2xs hover:bg-paper active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 text-brand-600 ${reconnecting ? 'animate-spin' : ''}`} />
                  <span>{reconnecting ? 'Pinging Agent...' : 'Reconnect Now'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Troubleshooting Checklist */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-brand-600" />
              Follow These Steps to Fix Offline Status
            </h3>

            {/* Step 1: Check Application Running */}
            <div className="rounded-xl border border-line p-4 space-y-2 bg-white">
              <div className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-700 font-bold text-xs flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="font-bold text-ink text-sm">Ensure the Desktop Agent App is Running</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    The SmartPrint Desktop Agent is a lightweight background service installed on your counter Windows PC.
                    Look for the <strong>printer icon</strong> in your Windows Taskbar tray (bottom right corner).
                  </p>
                  <div className="mt-2 rounded-lg bg-paper p-2.5 text-xs text-muted font-mono flex items-center justify-between">
                    <span>Target: SmartPrint Desktop Agent v1.2+</span>
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
                  <h4 className="font-bold text-ink text-sm">Verify Shop ID & Access Token</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Open the Desktop Agent Settings window and verify that the <strong>Shop ID</strong> and{' '}
                    <strong>Access Token</strong> match the credentials below.
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-line bg-surface/80">
          <span className="text-xs text-muted">SmartPrint Agent Gateway • Pusher Realtime</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-ink text-white px-4 py-2 text-xs font-bold hover:bg-ink/90 transition-colors cursor-pointer"
          >
            Got it, Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}
