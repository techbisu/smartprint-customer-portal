import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops } from '@/lib/supabaseAdmin'
import { triggerPusherEvent, getPusherChannelInfo, isConfiguredPusher } from '@/lib/pusherTrigger'

// Global in-memory registry of active agent heartbeats
// Keyed by shopId
interface AgentHeartbeatRecord {
  shopId: string
  status: 'online' | 'busy' | 'offline'
  lastSeen: number
  printers?: string[]
  activePrinter?: string
  systemInfo?: string
  version?: string
}

// Keep across requests in server lifecycle
const globalHeartbeats = globalThis as unknown as {
  _agentHeartbeats?: Map<string, AgentHeartbeatRecord>
}
if (!globalHeartbeats._agentHeartbeats) {
  globalHeartbeats._agentHeartbeats = new Map<string, AgentHeartbeatRecord>()
}
const heartbeatsMap = globalHeartbeats._agentHeartbeats

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const shopId = searchParams.get('shopId')
  const shopSlug = searchParams.get('shopSlug')

  if (!shopId && !shopSlug) {
    return NextResponse.json({ error: 'Missing shopId or shopSlug' }, { status: 400 })
  }

  // Find shop
  let targetShop: any = null
  if (shopId) {
    const { data } = await supabaseAdmin.from('shops').select('*').eq('id', shopId).single()
    targetShop = data || mockShops.find((s) => s.id === shopId)
  } else if (shopSlug) {
    const { data } = await supabaseAdmin.from('shops').select('*').eq('slug', shopSlug).single()
    targetShop = data || mockShops.find((s) => s.slug === shopSlug)
  }

  if (!targetShop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  const record = heartbeatsMap.get(targetShop.id)
  const now = Date.now()
  const HEARTBEAT_TIMEOUT_MS = 65000 // 65 seconds timeout

  let isOnline = false
  let lastSeen = null
  let printers: string[] = []
  let activePrinter = 'Default System Printer'

  if (record && now - record.lastSeen < HEARTBEAT_TIMEOUT_MS) {
    isOnline = record.status === 'online' || record.status === 'busy'
    lastSeen = record.lastSeen
    printers = record.printers || []
    activePrinter = record.activePrinter || activePrinter
  }

  // Check if Pusher credentials are configured
  const pusherConfigured = isConfiguredPusher({
    appId: targetShop.pusher_app_id,
    key: targetShop.pusher_key,
    secret: targetShop.pusher_secret,
    cluster: targetShop.pusher_cluster,
  })

  // Optionally check Pusher channel occupancy
  let channelInfo: any = null
  if (pusherConfigured && !isOnline) {
    try {
      channelInfo = await getPusherChannelInfo(`private-shop-${targetShop.id}`, {
        appId: targetShop.pusher_app_id,
        key: targetShop.pusher_key,
        secret: targetShop.pusher_secret,
        cluster: targetShop.pusher_cluster,
      })
      if (channelInfo && channelInfo.subscription_count && channelInfo.subscription_count > 0) {
        // At least one client is subscribed to the agent's channel
        isOnline = true
        lastSeen = Date.now()
      }
    } catch {
      // Fallback
    }
  }

  return NextResponse.json({
    shopId: targetShop.id,
    isOnline,
    lastSeen,
    printers,
    activePrinter,
    pusherConfigured,
    channelInfo,
    serverTime: now,
  })
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || ''
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

    const body = await req.json().catch(() => ({}))
    const {
      shopId,
      token: bodyToken,
      status = 'online',
      printers = [],
      activePrinter,
      systemInfo,
      version = '1.2.0',
    } = body

    const token = bearerToken || bodyToken

    if (!shopId) {
      return NextResponse.json({ error: 'Missing shopId' }, { status: 400 })
    }

    // Verify shop and token
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id, agent_auth_token, pusher_app_id, pusher_key, pusher_secret, pusher_cluster')
      .eq('id', shopId)
      .single()

    let targetShop: any = shop
    if (!targetShop) {
      targetShop = mockShops.find((s) => s.id === shopId)
    }

    if (!targetShop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
    }

    // Check token if provided
    const validTokens = [
      targetShop.agent_auth_token,
      'demo-agent-auth-token-12345',
      'shop-admin-session',
    ].filter(Boolean)

    if (token && !validTokens.includes(token)) {
      return NextResponse.json({ error: 'Unauthorized agent token' }, { status: 401 })
    }

    const now = Date.now()
    const record: AgentHeartbeatRecord = {
      shopId: targetShop.id,
      status: status === 'offline' ? 'offline' : 'online',
      lastSeen: now,
      printers: Array.isArray(printers) && printers.length > 0 ? printers : ['Canon LBP2900 / HP LaserJet'],
      activePrinter: activePrinter || 'HP LaserJet Professional',
      systemInfo: systemInfo || 'Windows 11 x64 (Counter PC)',
      version,
    }

    heartbeatsMap.set(targetShop.id, record)

    // Broadcast heartbeat over Pusher so any listening admin tabs update in real-time
    try {
      await triggerPusherEvent({
        channel: `private-shop-${targetShop.id}`,
        event: 'agent-heartbeat',
        data: {
          shopId: targetShop.id,
          status: record.status,
          timestamp: now,
          printers: record.printers,
          activePrinter: record.activePrinter,
          systemInfo: record.systemInfo,
          version: record.version,
        },
        credentials: {
          appId: targetShop.pusher_app_id,
          key: targetShop.pusher_key,
          secret: targetShop.pusher_secret,
          cluster: targetShop.pusher_cluster,
        },
      })
    } catch (err) {
      console.warn('[Heartbeat] Pusher trigger warning:', err)
    }

    return NextResponse.json({
      success: true,
      status: record.status,
      lastSeen: now,
    })
  } catch (err: any) {
    console.error('[Heartbeat] Error processing heartbeat:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
