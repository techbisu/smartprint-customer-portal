import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops, mockBanners } from '@/lib/supabaseAdmin'
import { ShopBanner } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const banners = mockBanners
    .filter((b) => b.shop_id === shop.id)
    .sort((a, b) => a.sort_order - b.sort_order)

  return NextResponse.json({ banners })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { title, subtitle, badge, badge_color, bg_gradient, image_url, link_url, is_active } = body

  if (!title) {
    return NextResponse.json({ error: 'Banner title is required' }, { status: 400 })
  }

  const existing = mockBanners.filter((b) => b.shop_id === shop.id)

  const newBanner: ShopBanner = {
    id: `banner-${crypto.randomUUID().slice(0, 8)}`,
    shop_id: shop.id,
    title: String(title).trim(),
    subtitle: subtitle ? String(subtitle).trim() : '',
    badge: badge ? String(badge).trim() : undefined,
    badge_color: badge_color || 'marigold',
    bg_gradient: bg_gradient || 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
    image_url: image_url || undefined,
    link_url: link_url || undefined,
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    sort_order: existing.length + 1,
  }

  await supabaseAdmin.from('shop_banners').insert(newBanner)
  return NextResponse.json({ success: true, banner: newBanner })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = mockShops.find((s) => s.slug === shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { id, title, subtitle, badge, badge_color, bg_gradient, is_active, sort_order } = body

  if (!id) {
    return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
  }

  const banner = mockBanners.find((b) => b.id === id && b.shop_id === shop.id)
  if (!banner) {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
  }

  if (title !== undefined) banner.title = String(title).trim()
  if (subtitle !== undefined) banner.subtitle = String(subtitle).trim()
  if (badge !== undefined) banner.badge = String(badge).trim() || undefined
  if (badge_color !== undefined) banner.badge_color = badge_color
  if (bg_gradient !== undefined) banner.bg_gradient = bg_gradient
  if (is_active !== undefined) banner.is_active = Boolean(is_active)
  if (sort_order !== undefined) banner.sort_order = Number(sort_order)

  await supabaseAdmin.from('shop_banners').update(banner).eq('id', id).eq('shop_id', shop.id)
  return NextResponse.json({ success: true, banner })
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
  if (!id) return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })

  const idx = mockBanners.findIndex((b) => b.id === id && b.shop_id === shop.id)
  if (idx !== -1) {
    mockBanners.splice(idx, 1)
  }

  await supabaseAdmin.from('shop_banners').delete().eq('id', id).eq('shop_id', shop.id)
  return NextResponse.json({ success: true })
}
