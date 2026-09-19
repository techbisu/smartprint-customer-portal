import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops } from '@/lib/supabaseAdmin'
import { triggerPusherEvent, getPusherChannelInfo, isConfiguredPusher } from '@/lib/pusherTrigger'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { shopId, shopSlug } = body

    if (!shopId && !shopSlug) {
      return NextResponse.json({ error: 'Missing shopId or shopSlug' }, { status: 400 })
    }

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

    const now = Date.now()

    // 1. Broadcast an agent-ping event over Pusher
    let pusherTriggered = false
    const credentials = {
      appId: targetShop.pusher_app_id,
      key: targetShop.pusher_key,
      secret: targetShop.pusher_secret,
      cluster: targetShop.pusher_cluster,
    }

    if (isConfiguredPusher(credentials)) {
      try {
        await triggerPusherEvent({
          channel: `private-shop-${targetShop.id}`,
          event: 'agent-ping',
          data: {
            timestamp: now,
            shopId: targetShop.id,
            origin: 'admin-dashboard',
          },
          credentials,
        })
        pusherTriggered = true
      } catch (err) {
        console.warn('[Agent Ping] Trigger failed:', err)
      }
    }

    // 2. Query Pusher channel info if available
    let channelInfo: any = null
    if (isConfiguredPusher(credentials)) {
      try {
        channelInfo = await getPusherChannelInfo(`private-shop-${targetShop.id}`, credentials)
      } catch {
        // Fallback
      }
    }

    return NextResponse.json({
      success: true,
      shopId: targetShop.id,
      timestamp: now,
      pusherTriggered,
      channelInfo,
    })
  } catch (err: any) {
    console.error('[Agent Ping] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
