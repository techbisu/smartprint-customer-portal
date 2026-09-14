import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { signChannelAuth } from '@/lib/pusherTrigger'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  let body: { socket_id?: string; channel_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { socket_id, channel_name } = body
  if (!socket_id || !channel_name) {
    return NextResponse.json({ error: 'Missing socket_id or channel_name' }, { status: 400 })
  }

  // Verify this token belongs to the shop whose channel is being
  // requested — a shop's agent should only ever be able to subscribe to
  // its own private channel, never another shop's.
  const { data: shop, error } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('agent_auth_token', token)
    .single()

  if (error || !shop) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
  }
  if (channel_name !== `private-shop-${shop.id}`) {
    return NextResponse.json({ error: 'Token not authorized for this channel' }, { status: 403 })
  }

  const auth = await signChannelAuth(socket_id, channel_name)
  return NextResponse.json({ auth })
}
