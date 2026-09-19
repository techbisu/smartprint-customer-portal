import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops, mockRateCards } from '@/lib/supabaseAdmin'
import { RateCardItem } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const items = mockRateCards.filter((item) => item.shop_id === shop.id)
  return NextResponse.json({ items })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
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

  const newItem: RateCardItem = {
    id: crypto.randomUUID(),
    shop_id: shop.id,
    display_name: String(display_name).trim(),
    category: category ? String(category).trim() : 'General',
    service_code: service_code
      ? String(service_code).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
      : String(display_name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    pricing_model: pricing_model || 'per_page',
    price_bw: Number(price_bw),
    price_color: price_color !== null && price_color !== undefined && price_color !== '' ? Number(price_color) : null,
    supports_duplex: Boolean(supports_duplex),
    is_active: is_active !== undefined ? Boolean(is_active) : true,
  }

  await supabaseAdmin.from('shop_rate_card').insert(newItem)
  return NextResponse.json({ success: true, item: newItem })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { id, display_name, category, price_bw, price_color, supports_duplex, is_active } = body

  if (!id) {
    return NextResponse.json({ error: 'Rate card ID is required' }, { status: 400 })
  }

  const itemIndex = mockRateCards.findIndex((i) => i.id === id && i.shop_id === shop.id)
  if (itemIndex === -1) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  const target = mockRateCards[itemIndex]
  if (display_name !== undefined) target.display_name = String(display_name).trim()
  if (category !== undefined) target.category = String(category).trim()
  if (price_bw !== undefined) target.price_bw = Number(price_bw)
  if (price_color !== undefined) {
    target.price_color = price_color === null || price_color === '' ? null : Number(price_color)
  }
  if (supports_duplex !== undefined) target.supports_duplex = Boolean(supports_duplex)
  if (is_active !== undefined) target.is_active = Boolean(is_active)

  await supabaseAdmin.from('shop_rate_card').update(target).eq('id', id).eq('shop_id', shop.id)
  return NextResponse.json({ success: true, item: target })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })

  const idx = mockRateCards.findIndex((i) => i.id === id && i.shop_id === shop.id)
  if (idx !== -1) {
    mockRateCards.splice(idx, 1)
  }

  await supabaseAdmin.from('shop_rate_card').delete().eq('id', id).eq('shop_id', shop.id)
  return NextResponse.json({ success: true })
}
