import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops, mockRateCards, mockBanners } from '@/lib/supabaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  const items = mockRateCards.filter((i) => i.shop_id === shop.id)
  const banners = mockBanners
    .filter((b) => b.shop_id === shop.id)
    .sort((a, b) => a.sort_order - b.sort_order)

  return NextResponse.json({ shop, items, banners })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const body = await req.json()
  const shop = mockShops.find((s) => s.slug === shopSlug)

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  if (body.is_online !== undefined) shop.is_online = Boolean(body.is_online)
  if (body.payment_gateway_enabled !== undefined) {
    shop.payment_gateway_enabled = Boolean(body.payment_gateway_enabled)
    shop.enable_online_pay = shop.payment_gateway_enabled
  }
  if (body.enable_online_pay !== undefined) {
    shop.enable_online_pay = Boolean(body.enable_online_pay)
    shop.payment_gateway_enabled = shop.enable_online_pay
  }
  if (body.enable_counter_pay !== undefined) shop.enable_counter_pay = Boolean(body.enable_counter_pay)
  if (body.enable_upi_pay !== undefined) shop.enable_upi_pay = Boolean(body.enable_upi_pay)
  if (body.cashfree_app_id !== undefined) shop.cashfree_app_id = String(body.cashfree_app_id).trim()
  if (body.cashfree_secret_key !== undefined) shop.cashfree_secret_key = String(body.cashfree_secret_key).trim()
  if (body.cashfree_env !== undefined) shop.cashfree_env = body.cashfree_env === 'production' ? 'production' : 'sandbox'
  if (body.shop_name) shop.shop_name = String(body.shop_name).trim()
  if (body.upi_vpa) shop.upi_vpa = String(body.upi_vpa).trim()
  if (body.phone !== undefined) shop.phone = String(body.phone).trim()
  if (body.address !== undefined) shop.address = String(body.address).trim()
  if (body.pin !== undefined) shop.pin = String(body.pin).trim()
  if (body.pusher_app_id !== undefined) shop.pusher_app_id = String(body.pusher_app_id).trim()
  if (body.pusher_key !== undefined) shop.pusher_key = String(body.pusher_key).trim()
  if (body.pusher_secret !== undefined) shop.pusher_secret = String(body.pusher_secret).trim()
  if (body.pusher_cluster !== undefined) shop.pusher_cluster = String(body.pusher_cluster).trim()

  if (body.regenerate_token) {
    shop.agent_auth_token = `token-${crypto.randomUUID().slice(0, 18)}`
  }

  await supabaseAdmin
    .from('shops')
    .update({
      is_online: shop.is_online,
      payment_gateway_enabled: shop.payment_gateway_enabled,
      enable_counter_pay: shop.enable_counter_pay,
      enable_upi_pay: shop.enable_upi_pay,
      enable_online_pay: shop.enable_online_pay,
      cashfree_app_id: shop.cashfree_app_id,
      cashfree_secret_key: shop.cashfree_secret_key,
      cashfree_env: shop.cashfree_env,
      shop_name: shop.shop_name,
      upi_vpa: shop.upi_vpa,
      phone: shop.phone,
      address: shop.address,
      pusher_app_id: shop.pusher_app_id,
      pusher_key: shop.pusher_key,
      pusher_secret: shop.pusher_secret,
      pusher_cluster: shop.pusher_cluster,
      agent_auth_token: shop.agent_auth_token,
    })
    .eq('id', shop.id)

  return NextResponse.json({ success: true, shop })
}
