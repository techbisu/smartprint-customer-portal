import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops, mockBanners } from '@/lib/supabaseAdmin'
import { ShopBanner } from '@/lib/types'

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

  const { data: dbBanners } = await supabaseAdmin
    .from('shop_banners')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order', { ascending: true })

  if (dbBanners && dbBanners.length > 0) {
    return NextResponse.json({ banners: dbBanners })
  }

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
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { title, subtitle, badge, badge_color, bg_gradient, image_url, link_url, is_active } = body

  if (!title) {
    return NextResponse.json({ error: 'Banner title is required' }, { status: 400 })
  }

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
    sort_order: 1,
  }

  await supabaseAdmin.from('shop_banners').insert(newBanner)
  mockBanners.push(newBanner)
  return NextResponse.json({ success: true, banner: newBanner })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ shopSlug: string }> }
) {
  const { shopSlug } = await params
  const shop = await getTargetShop(shopSlug)
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 })

  const body = await req.json()
  const { id, title, subtitle, badge, badge_color, bg_gradient, image_url, link_url, is_active, sort_order } = body

  if (!id) {
    return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })
  }

  const updatePayload: Partial<ShopBanner> = {}
  if (title !== undefined) updatePayload.title = String(title).trim()
  if (subtitle !== undefined) updatePayload.subtitle = String(subtitle).trim()
  if (badge !== undefined) updatePayload.badge = String(badge).trim() || undefined
  if (badge_color !== undefined) updatePayload.badge_color = badge_color
  if (bg_gradient !== undefined) updatePayload.bg_gradient = bg_gradient
  if (image_url !== undefined) updatePayload.image_url = image_url
  if (link_url !== undefined) updatePayload.link_url = link_url
  if (is_active !== undefined) updatePayload.is_active = Boolean(is_active)
  if (sort_order !== undefined) updatePayload.sort_order = Number(sort_order)

  const { data } = await supabaseAdmin
    .from('shop_banners')
    .update(updatePayload)
    .eq('id', id)
    .eq('shop_id', shop.id)
    .select()
    .maybeSingle()

  const idx = mockBanners.findIndex((b) => b.id === id)
  if (idx !== -1) {
    mockBanners[idx] = { ...mockBanners[idx], ...updatePayload }
  }

  const returnBanner = data || (idx !== -1 ? mockBanners[idx] : { id, shop_id: shop.id, ...updatePayload })
  return NextResponse.json({ success: true, banner: returnBanner })
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
  if (!id) return NextResponse.json({ error: 'Banner ID is required' }, { status: 400 })

  await supabaseAdmin.from('shop_banners').delete().eq('id', id).eq('shop_id', shop.id)

  const idx = mockBanners.findIndex((b) => b.id === id && b.shop_id === shop.id)
  if (idx !== -1) {
    mockBanners.splice(idx, 1)
  }

  return NextResponse.json({ success: true })
}
