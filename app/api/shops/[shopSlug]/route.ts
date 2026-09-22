import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, mockShops, mockRateCards, mockBanners } from '@/lib/supabaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const cleanSlug = shopSlug.toLowerCase().trim()

  // 1. Fetch from Supabase
  const { data: dbShop } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('slug', cleanSlug)
    .maybeSingle()

  const memoryShop = mockShops.find((s) => s.slug === cleanSlug)
  const shop = dbShop ? { ...(memoryShop || {}), ...dbShop } : memoryShop

  if (!shop) {
    return NextResponse.json({ error: 'Shop not found' }, { status: 404 })
  }

  // 2. Fetch rate cards from Supabase or fallback
  const { data: dbItems } = await supabaseAdmin
    .from('shop_rate_card')
    .select('*')
    .eq('shop_id', shop.id)
    .order('category', { ascending: true })

  const items = dbItems && dbItems.length > 0
    ? dbItems
    : mockRateCards.filter((i) => i.shop_id === shop.id)

  // 3. Fetch banners from Supabase or fallback
  let banners: any[] = []
  try {
    const { data: dbBanners } = await supabaseAdmin
      .from('shop_banners')
      .select('*')
      .eq('shop_id', shop.id)
      .order('sort_order', { ascending: true })
    banners = dbBanners || []
  } catch {
    banners = []
  }

  if (banners.length === 0) {
    banners = mockBanners
      .filter((b) => b.shop_id === shop.id)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  return NextResponse.json({ shop, items, banners })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const cleanSlug = shopSlug.toLowerCase().trim()
  const body = await req.json()

  // 1. Fetch target shop from DB or mock
  const { data: dbShop } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('slug', cleanSlug)
    .maybeSingle()

  const memoryShop = mockShops.find((s) => s.slug === cleanSlug)
  const shop = dbShop ? { ...(memoryShop || {}), ...dbShop } : memoryShop

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
  if (body.password || body.pin) {
    const rawPass = String(body.password || body.pin).trim()
    const salt = await bcrypt.genSalt(10)
    shop.password_hash = await bcrypt.hash(rawPass, salt)
  }
  if (body.pusher_app_id !== undefined) shop.pusher_app_id = String(body.pusher_app_id).trim()
  if (body.pusher_key !== undefined) shop.pusher_key = String(body.pusher_key).trim()
  if (body.pusher_secret !== undefined) shop.pusher_secret = String(body.pusher_secret).trim()
  if (body.pusher_cluster !== undefined) shop.pusher_cluster = String(body.pusher_cluster).trim()
  if (body.default_language !== undefined) {
    const lang = String(body.default_language).toLowerCase().trim()
    shop.default_language = ['en', 'bn', 'hi'].includes(lang) ? lang : 'en'
  }
  if (body.plan_type !== undefined) shop.plan_type = body.plan_type
  if (body.subscription_status !== undefined) shop.subscription_status = body.subscription_status
  if (body.trial_ends_at !== undefined) shop.trial_ends_at = body.trial_ends_at

  if (body.regenerate_token) {
    shop.agent_auth_token = crypto.randomUUID()
  }

  // Update mock in-memory if present
  if (memoryShop) {
    Object.assign(memoryShop, shop)
  }

  // 2. Update Supabase
  const fullUpdatePayload: any = {
    is_online: shop.is_online,
    shop_name: shop.shop_name,
    upi_vpa: shop.upi_vpa,
    agent_auth_token: shop.agent_auth_token,
    payment_gateway_enabled: shop.payment_gateway_enabled,
    enable_counter_pay: shop.enable_counter_pay,
    enable_upi_pay: shop.enable_upi_pay,
    enable_online_pay: shop.enable_online_pay,
    cashfree_app_id: shop.cashfree_app_id,
    cashfree_secret_key: shop.cashfree_secret_key,
    cashfree_env: shop.cashfree_env,
    default_language: shop.default_language,
    phone: shop.phone,
    address: shop.address,
    password_hash: shop.password_hash,
    pusher_app_id: shop.pusher_app_id,
    pusher_key: shop.pusher_key,
    pusher_secret: shop.pusher_secret,
    pusher_cluster: shop.pusher_cluster,
    plan_type: shop.plan_type,
    subscription_status: shop.subscription_status,
    trial_ends_at: shop.trial_ends_at,
  }

  const { error: fullUpdateError } = await supabaseAdmin
    .from('shops')
    .update(fullUpdatePayload)
    .eq('id', shop.id)

  if (fullUpdateError) {
    console.warn('[Shop PATCH] Full update failed, retrying with base columns:', fullUpdateError.message)
    const baseUpdatePayload: any = {
      is_online: shop.is_online,
      shop_name: shop.shop_name,
      upi_vpa: shop.upi_vpa,
      agent_auth_token: shop.agent_auth_token,
    }
    await supabaseAdmin
      .from('shops')
      .update(baseUpdatePayload)
      .eq('id', shop.id)
  }

  return NextResponse.json({ success: true, shop })
}
