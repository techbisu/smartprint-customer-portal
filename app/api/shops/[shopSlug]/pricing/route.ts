import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops, mockRateCards } from '@/lib/supabaseAdmin'
import { RateCardItem } from '@/lib/types'

async function getTargetShop(shopSlug: string) {
  const cleanSlug = shopSlug.toLowerCase().trim()
  const { data: dbShop } = await supabaseAdmin
    .from('shops')
    .select('id, slug, shop_name')
    .eq('slug', cleanSlug)
    .maybeSingle()

  if (dbShop) return dbShop
  return mockShops.find((s) => s.slug.toLowerCase() === cleanSlug) || null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { data: dbItems } = await supabaseAdmin
    .from('shop_rate_card')
    .select('*')
    .eq('shop_id', shop.id)
    .order('category', { ascending: true })

  if (dbItems && dbItems.length > 0) {
    return NextResponse.json({ items: dbItems })
  }

  const items = mockRateCards.filter((item) => item.shop_id === shop.id)
  return NextResponse.json({ items })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const {
    display_name,
    category,
    service_code,
    pricing_model,
    price_bw,
    price_color,
    supports_duplex,
    is_active,
  } = body

  if (!display_name || price_bw === undefined) {
    return NextResponse.json({ error: 'Display name and B&W price are required' }, { status: 400 })
  }

  let baseCode = service_code
    ? String(service_code).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : String(display_name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
  if (!baseCode) baseCode = 'service_' + Date.now().toString().slice(-4)

  // Check if service_code already exists for this shop to avoid Postgres unique constraint violation
  const { data: existingCodeItem } = await supabaseAdmin
    .from('shop_rate_card')
    .select('id')
    .eq('shop_id', shop.id)
    .eq('service_code', baseCode)
    .maybeSingle()

  if (existingCodeItem) {
    baseCode = `${baseCode}_${crypto.randomUUID().slice(0, 4)}`
  }

  const newItem: RateCardItem = {
    id: crypto.randomUUID(),
    shop_id: shop.id,
    display_name: String(display_name).trim(),
    category: category ? String(category).trim() : 'General',
    service_code: baseCode,
    pricing_model: pricing_model || 'per_page',
    price_bw: Number(price_bw),
    price_color: price_color !== null && price_color !== undefined && price_color !== '' ? Number(price_color) : null,
    supports_duplex: Boolean(supports_duplex),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
  }

  const { data: insertedItem, error: insertError } = await supabaseAdmin
    .from('shop_rate_card')
    .insert(newItem)
    .select()
    .maybeSingle()

  if (insertError) {
    console.error('[Pricing POST] Failed to insert service into database:', insertError)
    return NextResponse.json({ error: insertError.message || 'Failed to add service to database' }, { status: 500 })
  }

  const finalItem = insertedItem || newItem
  mockRateCards.push(finalItem)
  return NextResponse.json({ success: true, item: finalItem })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { id, display_name, category, price_bw, price_color, supports_duplex, is_active } = body

  if (!id) {
    return NextResponse.json({ error: 'Rate card ID is required' }, { status: 400 })
  }

  const updatePayload: Partial<RateCardItem> = {}
  if (display_name !== undefined) updatePayload.display_name = String(display_name).trim()
  if (category !== undefined) updatePayload.category = String(category).trim()
  if (price_bw !== undefined) updatePayload.price_bw = Number(price_bw)
  if (price_color !== undefined) {
    updatePayload.price_color = price_color === null || price_color === '' ? null : Number(price_color)
  }
  if (supports_duplex !== undefined) updatePayload.supports_duplex = Boolean(supports_duplex)
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)

  const { data, error } = await supabaseAdmin
    .from('shop_rate_card')
    .update(updatePayload)
    .eq('id', id)
    .eq('shop_id', shop.id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('[Pricing PUT] Failed to update service in database:', error)
    return NextResponse.json({ error: error.message || 'Failed to update service in database' }, { status: 500 })
  }

  const idx = mockRateCards.findIndex((i) => i.id === id)
  if (idx !== -1) {
    mockRateCards[idx] = { ...mockRateCards[idx], ...updatePayload }
  }

  const returnItem = data || (idx !== -1 ? mockRateCards[idx] : { id, shop_id: shop.id, ...updatePayload })
  return NextResponse.json({ success: true, item: returnItem })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

  const { error } = await supabaseAdmin.from('shop_rate_card').delete().eq('id', id).eq('shop_id', shop.id)

  if (error) {
    console.error('[Pricing DELETE] Failed to delete service from database:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete service from database' }, { status: 500 })
  }

  const idx = mockRateCards.findIndex((i) => i.id === id && i.shop_id === shop.id)
  if (idx !== -1) {
    mockRateCards.splice(idx, 1)
  }

  return NextResponse.json({ success: true })
}
