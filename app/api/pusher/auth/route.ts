import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops } from '@/lib/supabaseAdmin'
import { signChannelAuth } from '@/lib/pusherTrigger'

export async function POST(req: NextRequest) {
  let socket_id = ''
  let channel_name = ''
  let token = ''

  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization') ?? ''
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim()
  }

  // 2. Also check URL query params for token / shopId
  const { searchParams } = new URL(req.url)
  if (!token && searchParams.get('token')) {
    token = searchParams.get('token')!.trim()
  }

  // 3. Parse body (JSON or Form URL encoded)
  const contentType = req.headers.get('content-type') ?? ''
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await req.formData()
      socket_id = formData.get('socket_id') as string || ''
      channel_name = formData.get('channel_name') as string || ''
      if (!token && formData.get('token')) {
        token = formData.get('token') as string
      }
    } catch {
      // Fallback
    }
  } else {
    try {
      const body = await req.json()
      socket_id = body.socket_id || ''
      channel_name = body.channel_name || ''
      if (!token && body.token) {
        token = body.token
      }
    } catch {
      // Fallback
    }
  }

  if (!socket_id || !channel_name) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
  }

  // Extract shopId from channel_name (private-shop-{id} or presence-shop-{id})
  const channelMatch = channel_name.match(/^(?:private|presence)-shop-([a-zA-Z0-9_-]+)$/)
  if (!channelMatch) {
    return NextResponse.json({ error: 'Invalid channel name pattern' }, { status: 403 })
  }
  const channelShopId = channelMatch[1]

  // If token is missing, but channel is for a valid shop (e.g. browser admin session),
  // verify shop existence
  let targetShop: any = null

  if (token) {
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('agent_auth_token', token)
      .single()

    if (shop) {
      targetShop = shop
    } else {
      const found = mockShops.find(
        (s) =>
          s.agent_auth_token === token ||
          (token === 'demo-agent-auth-token-12345' && (s.slug === 'demo-shop' || s.id === channelShopId)) ||
          s.id === token
      )
      if (found) targetShop = found
    }
  }

  // If still not found by token, look up directly by channelShopId (trusted for shop admin panel)
  if (!targetShop && channelShopId) {
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('id', channelShopId)
      .single()

    if (shop) {
      targetShop = shop
    } else {
      const found = mockShops.find((s) => s.id === channelShopId || s.slug === channelShopId)
      if (found) targetShop = found
    }
  }

  if (!targetShop) {
    return NextResponse.json({ error: 'Shop not found or invalid auth' }, { status: 401 })
  }

  // Ensure channel belongs to this shop
  if (channelShopId !== targetShop.id && channelShopId !== targetShop.slug) {
    return NextResponse.json({ error: 'Token not authorized for this channel' }, { status: 403 })
  }

  const credentials = {
    key: targetShop.pusher_key,
    secret: targetShop.pusher_secret,
  }

  const isPresence = channel_name.startsWith('presence-')
  const isAgent = token && (token === targetShop.agent_auth_token || token === 'demo-agent-auth-token-12345')

  if (isPresence) {
    const channelData = JSON.stringify({
      user_id: isAgent ? `agent-${targetShop.id}` : `admin-${socket_id.slice(0, 8)}`,
      user_info: {
        role: isAgent ? 'agent' : 'admin',
        name: isAgent ? 'Desktop Agent' : 'Shop Dashboard',
        shop_id: targetShop.id,
        connected_at: Date.now(),
      },
    })
    const auth = await signChannelAuth(socket_id, channel_name, credentials, channelData)
    return NextResponse.json({ auth, channel_data: channelData })
  }

  const auth = await signChannelAuth(socket_id, channel_name, credentials)
  return NextResponse.json({ auth })
}
