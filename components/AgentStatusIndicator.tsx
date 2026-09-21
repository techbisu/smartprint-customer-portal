'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import { RefreshCw, AlertTriangle, CheckCircle2, HelpCircle, Cpu } from 'lucide-react'
import { Shop } from '@/lib/types'
import AgentTroubleshootModal from './AgentTroubleshootModal'

interface AgentStatusIndicatorProps {
  shop: Shop
  onToast?: (message: string) => void
}

export default function AgentStatusIndicator({ shop, onToast }: AgentStatusIndicatorProps) {
  const [isOnline, setIsOnline] = useState<boolean>(false)
  const [lastSeen, setLastSeen] = useState<number | null>(null)
  const [activePrinter, setActivePrinter] = useState<string>('HP LaserJet / Thermal')
  const [reconnecting, setReconnecting] = useState<boolean>(false)
  const [showGuide, setShowGuide] = useState<boolean>(false)
  const [pusherConnectionState, setPusherConnectionState] = useState<string>('initializing')

  const pusherRef = useRef<Pusher | null>(null)
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null)
  const onToastRef = useRef(onToast)

  useEffect(() => {
    onToastRef.current = onToast
  }, [onToast])

  // 1. Initial Status Sync via Heartbeat API
  const fetchHeartbeatStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/agent/heartbeat?shopId=${encodeURIComponent(shop.id)}`)
      if (res.ok) {
        const data = await res.json()
        setIsOnline(data.isOnline)
        if (data.lastSeen) setLastSeen(data.lastSeen)
        if (data.activePrinter) setActivePrinter(data.activePrinter)
      }
    } catch (err) {
      console.warn('[AgentStatus] Failed to fetch heartbeat status:', err)
    }
  }, [shop.id])

  // 2. Setup Pusher Realtime Connection
  useEffect(() => {
    fetchHeartbeatStatus()

    const pusherKey = shop.pusher_key || process.env.NEXT_PUBLIC_PUSHER_KEY || '2e5517c16c8d36b2969d'
    const pusherCluster = shop.pusher_cluster || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2'
    const authToken = shop.agent_auth_token || 'demo-agent-auth-token-12345'

    let pusherInstance: Pusher | null = null

    try {
      pusherInstance = new Pusher(pusherKey, {
        cluster: pusherCluster,
        channelAuthorization: {
          endpoint: '/api/pusher/auth',
          transport: 'ajax',
          params: {
            token: authToken,
            shopId: shop.id,
          },
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        },
      })

      pusherRef.current = pusherInstance

      pusherInstance.connection.bind('state_change', (states: { current: string }) => {
        setPusherConnectionState(states.current)
      })

      // Suppress noisy socket-level close warnings
      pusherInstance.connection.bind('error', (err: any) => {
        const code = err?.error?.data?.code
        if (code !== 4004) {
          console.debug('[AgentStatus] Pusher connection status:', err?.error?.data?.message || err)
        }
      })

      // Presence Channel subscription
      const presenceChannelName = `presence-shop-${shop.id}`
      const presenceChannel = pusherInstance.subscribe(presenceChannelName)

      presenceChannel.bind('pusher:subscription_succeeded', (members: any) => {
        let hasAgent = false
        if (members && typeof members.each === 'function') {
          members.each((member: any) => {
            if (member.id?.startsWith('agent-') || member.info?.role === 'agent') {
              hasAgent = true
            }
          })
        }
        if (hasAgent) {
          setIsOnline(true)
          setLastSeen(Date.now())
        }
      })

      presenceChannel.bind('pusher:member_added', (member: any) => {
        if (member.id?.startsWith('agent-') || member.info?.role === 'agent') {
          setIsOnline(true)
          setLastSeen(Date.now())
          onToastRef.current?.('Desktop Agent joined channel')
        }
      })

      presenceChannel.bind('pusher:member_removed', (member: any) => {
        if (member.id?.startsWith('agent-') || member.info?.role === 'agent') {
          setIsOnline(false)
          onToastRef.current?.('Desktop Agent disconnected')
        }
      })

      // Private Channel subscription
      const privateChannelName = `private-shop-${shop.id}`
      const privateChannel = pusherInstance.subscribe(privateChannelName)

      privateChannel.bind('agent-heartbeat', (data: any) => {
        setIsOnline(data.status !== 'offline')
        setLastSeen(data.timestamp || Date.now())
        if (data.activePrinter) setActivePrinter(data.activePrinter)
      })

      privateChannel.bind('agent-pong', (data: any) => {
        setIsOnline(true)
        setLastSeen(Date.now())
        if (data.printer) setActivePrinter(data.printer)
      })

      privateChannel.bind('agent-offline', () => {
        setIsOnline(false)
      })
    } catch (err) {
      console.warn('[AgentStatus] Pusher initialization error:', err)
    }

    // Periodic polling to guard against stale local state
    const pollInterval = setInterval(() => {
      fetchHeartbeatStatus()
    }, 25000)

    // Heartbeat expiration check (if > 65s since last heartbeat, mark offline)
    heartbeatTimerRef.current = setInterval(() => {
      setLastSeen((prev) => {
        if (prev && Date.now() - prev > 65000) {
          setIsOnline(false)
        }
        return prev
      })
    }, 15000)

    return () => {
      clearInterval(pollInterval)
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current)
      if (pusherInstance) {
        try {
          pusherInstance.disconnect()
        } catch {
          // ignore disconnect race on unmount
        }
        pusherRef.current = null
      }
    }
  }, [shop.id, shop.pusher_key, shop.pusher_cluster, shop.agent_auth_token, fetchHeartbeatStatus])

  // 2b. Listen for global open guide request
  useEffect(() => {
    const handleOpen = () => setShowGuide(true)
    window.addEventListener('open-agent-troubleshoot-guide', handleOpen)
    return () => window.removeEventListener('open-agent-troubleshoot-guide', handleOpen)
  }, [])

  // 3. Reconnect Action
  const handleReconnect = async () => {
    setReconnecting(true)
    try {
      // Re-trigger Pusher connection only if disconnected or failed
      if (pusherRef.current) {
        const state = pusherRef.current.connection.state
        if (state === 'disconnected' || state === 'failed' || state === 'unavailable') {
          pusherRef.current.connect()
        }
      }

      // Send Ping to Agent
      const res = await fetch('/api/agent/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: shop.id, shopSlug: shop.slug }),
      })

      // Wait a short moment to receive response
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const statusRes = await fetch(`/api/agent/heartbeat?shopId=${encodeURIComponent(shop.id)}`)
      if (statusRes.ok) {
        const data = await statusRes.json()
        setIsOnline(data.isOnline)
        if (data.lastSeen) setLastSeen(data.lastSeen)
        if (data.isOnline) {
          if (onToast) onToast('Desktop Agent confirmed active!')
        } else {
          if (onToast) onToast('Agent offline. Check troubleshooting guide.')
        }
      }
    } catch (err) {
      console.warn('[AgentStatus] Reconnect error:', err)
      if (onToast) onToast('Failed to reconnect to Desktop Agent')
    } finally {
      setReconnecting(false)
    }
  }

  // 4. Simulate Heartbeat for Testing
  const handleSimulateHeartbeat = async (mode: 'online' | 'offline') => {
    try {
      const res = await fetch('/api/agent/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${shop.agent_auth_token || 'demo-agent-auth-token-12345'}`,
        },
        body: JSON.stringify({
          shopId: shop.id,
          status: mode,
          printers: ['HP LaserJet Pro 400', 'Canon LBP 2900B'],
          activePrinter: 'HP LaserJet Pro 400',
          systemInfo: 'Windows 11 Pro 64-bit',
        }),
      })

      if (res.ok) {
        setIsOnline(mode === 'online')
        setLastSeen(Date.now())
        if (onToast) {
          onToast(
            mode === 'online'
              ? 'Simulated Agent heartbeat sent (Online)!'
              : 'Simulated Agent marked as Offline.'
          )
        }
      }
    } catch {
      if (onToast) onToast('Simulation failed')
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {reconnecting ? (
          <div
            id="agent-status-reconnecting"
            className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 shadow-2xs"
          >
            <RefreshCw className="h-3 w-3 text-sky-600 animate-spin" />
            <span className="hidden sm:inline">Pinging Agent...</span>
            <span className="sm:hidden">Connecting...</span>
          </div>
        ) : isOnline ? (
          <div
            id="agent-status-online"
            className="group relative flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 shadow-2xs transition-all hover:bg-emerald-100/70"
          >
            {/* Pulsing online indicator */}
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>

            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="font-bold hover:underline cursor-pointer flex items-center gap-1"
              title="Agent is active. Click for workstation details"
            >
              <span className="hidden sm:inline">Agent Online</span>
              <span className="sm:hidden">Agent Live</span>
            </button>

            {/* Reconnect / Refresh button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleReconnect()
              }}
              title="Re-ping Desktop Agent"
              className="ml-0.5 rounded-full p-0.5 text-emerald-700 hover:bg-emerald-200/80 hover:text-emerald-950 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            id="agent-status-offline"
            className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 shadow-2xs"
          >
            {/* Inactive offline indicator */}
            <span className="h-2 w-2 rounded-full bg-amber-500"></span>

            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="font-bold hover:underline cursor-pointer"
              title="Desktop agent is offline. Click to view troubleshooting guide"
            >
              Agent Offline
            </button>

            {/* Reconnect Button */}
            <button
              type="button"
              id="reconnect-agent-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleReconnect()
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-ink border border-amber-200 shadow-2xs hover:bg-amber-100/60 active:scale-95 transition-all cursor-pointer"
              title="Attempt to reconnect to local agent"
            >
              <RefreshCw className="h-2.5 w-2.5 text-brand-600" />
              <span>Reconnect</span>
            </button>

            {/* Quick guide link */}
            <button
              type="button"
              onClick={() => setShowGuide(true)}
              className="text-[11px] text-amber-800 hover:text-amber-950 underline font-medium cursor-pointer ml-0.5"
              title="Troubleshooting Guide"
            >
              Guide
            </button>
          </div>
        )}
      </div>

      {/* Troubleshooting Guide Modal */}
      <AgentTroubleshootModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
        shop={shop}
        isOnline={isOnline}
        lastSeen={lastSeen}
        activePrinter={activePrinter}
        onReconnect={handleReconnect}
        reconnecting={reconnecting}
        onSimulateHeartbeat={handleSimulateHeartbeat}
      />
    </>
  )
}
