import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, mockShops, mockRateCards, mockBanners } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      shopName,
      slug,
      upiVpa,
      phone,
      address,
      password,
      initialPricing,
      pusherAppId,
      pusherKey,
      pusherSecret,
      pusherCluster,
    } = body

    if (!shopName || !slug || !upiVpa) {
      return NextResponse.json(
        { error: 'Shop name, URL slug, and UPI ID are required' },
        { status: 400 }
      )
    }

    const cleanSlug = String(slug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')

    // Check if slug already exists
    const existing = mockShops.find((s) => s.slug === cleanSlug)
    if (existing) {
      return NextResponse.json(
        { error: 'This shop URL slug is already taken. Please pick another one.' },
        { status: 409 }
      )
    }

    const shopId = crypto.randomUUID()
    const agentToken = `token-${crypto.randomUUID().slice(0, 18)}`

    // Hash password with bcrypt
    const rawPassword = password ? String(password).trim() : '1234'
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(rawPassword, salt)

    const newShop = {
      id: shopId,
      slug: cleanSlug,
      shop_name: shopName.trim(),
      upi_vpa: upiVpa.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      is_online: true,
      agent_auth_token: agentToken,
      password_hash: passwordHash,
      pin: rawPassword,
      pusher_app_id: pusherAppId?.trim() || process.env.PUSHER_APP_ID || '',
      pusher_key: pusherKey?.trim() || process.env.PUSHER_KEY || '2e5517c16c8d36b2969d',
      pusher_secret: pusherSecret?.trim() || process.env.PUSHER_SECRET || '',
      pusher_cluster: pusherCluster?.trim() || process.env.PUSHER_CLUSTER || 'ap2',
      created_at: new Date().toISOString(),
    }

    mockShops.push(newShop as any)
    await supabaseAdmin.from('shops').insert(newShop)

    // Create default rate cards for the shop
    const defaultCards = initialPricing && initialPricing.length > 0
      ? initialPricing.map((item: any) => ({
          ...item,
          id: crypto.randomUUID(),
          shop_id: shopId,
          is_active: item.is_active !== undefined ? item.is_active : true,
        }))
      : [
          {
            id: crypto.randomUUID(),
            shop_id: shopId,
            category: 'Standard Print',
            service_code: 'standard_print',
            display_name: 'Document Print (A4)',
            pricing_model: 'per_page',
            price_bw: 2.0,
            price_color: 8.0,
            supports_duplex: true,
            is_active: true,
          },
          {
            id: crypto.randomUUID(),
            shop_id: shopId,
            category: 'ID Card & Badges',
            service_code: 'smart_id_a4',
            display_name: 'Smart ID Card & Lamination',
            pricing_model: 'flat_fee',
            price_bw: 15.0,
            price_color: 30.0,
            supports_duplex: false,
            is_active: true,
          },
          {
            id: crypto.randomUUID(),
            shop_id: shopId,
            category: 'Legal & Official',
            service_code: 'rent_agreement',
            display_name: 'Legal / Stamp Paper Print',
            pricing_model: 'per_page',
            price_bw: 5.0,
            price_color: null,
            supports_duplex: false,
            is_active: true,
          },
        ]

    for (const card of defaultCards) {
      await supabaseAdmin.from('shop_rate_card').insert(card)
    }

    // Default welcome banner
    const welcomeBanner = {
      id: `banner-${crypto.randomUUID().slice(0, 8)}`,
      shop_id: shopId,
      title: `Welcome to ${shopName}!`,
      subtitle: 'Scan QR code, upload your file and pay online or at the counter.',
      badge: 'OFFER',
      badge_color: 'marigold',
      bg_gradient: 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
      is_active: true,
      sort_order: 1,
    }
    await supabaseAdmin.from('shop_banners').insert(welcomeBanner)

    return NextResponse.json({
      success: true,
      shop: newShop,
      customerUrl: `/print/${cleanSlug}`,
      adminUrl: `/dashboard/${cleanSlug}`,
    })
  } catch (err: any) {
    console.error('[Register Shop Error]', err)
    return NextResponse.json({ error: err?.message || 'Failed to register shop' }, { status: 500 })
  }
}

export async function GET() {
  const { data: shops } = await supabaseAdmin.from('shops').select('*')
  return NextResponse.json({ shops: shops || [] })
}
