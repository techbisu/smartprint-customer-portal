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

    // 1. Check if slug already exists in memory or in database
    const existing = mockShops.find((s) => s.slug === cleanSlug)
    if (existing) {
      return NextResponse.json(
        { error: 'This shop URL slug is already taken. Please pick another one.' },
        { status: 409 }
      )
    }

    const { data: existingDbShop } = await supabaseAdmin
      .from('shops')
      .select('id, slug')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (existingDbShop) {
      return NextResponse.json(
        { error: 'This shop URL slug is already taken in the database. Please pick another one.' },
        { status: 409 }
      )
    }

    const shopId = crypto.randomUUID()
    const rawPassword = password ? String(password).trim() : '1234'
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(rawPassword, salt)

    // Token with PIN fallback encoded so login works even before migration columns are added
    const baseToken = `token-${crypto.randomUUID().slice(0, 18)}`
    const agentTokenWithFallback = `${baseToken}#pin:${rawPassword}`

    const fullShopPayload = {
      id: shopId,
      slug: cleanSlug,
      shop_name: shopName.trim(),
      upi_vpa: upiVpa.trim(),
      phone: phone?.trim() || '',
      address: address?.trim() || '',
      is_online: true,
      agent_auth_token: agentTokenWithFallback,
      password_hash: passwordHash,
      pin: rawPassword,
      pusher_app_id: pusherAppId?.trim() || process.env.PUSHER_APP_ID || '',
      pusher_key: pusherKey?.trim() || process.env.PUSHER_KEY || '2e5517c16c8d36b2969d',
      pusher_secret: pusherSecret?.trim() || process.env.PUSHER_SECRET || '',
      pusher_cluster: pusherCluster?.trim() || process.env.PUSHER_CLUSTER || 'ap2',
      created_at: new Date().toISOString(),
      plan_type: 'trial',
      subscription_status: 'trialing',
      trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    }

    // 2. Insert into Supabase with graceful fallback to base columns if migration has not been applied yet
    let { data: insertedShop, error: insertError } = await supabaseAdmin
      .from('shops')
      .insert(fullShopPayload)
      .select()
      .maybeSingle()

    if (insertError) {
      console.warn('[Register Shop] Full columns insert failed, falling back to base columns:', insertError.message)
      const baseShopPayload = {
        id: shopId,
        slug: cleanSlug,
        shop_name: shopName.trim(),
        upi_vpa: upiVpa.trim(),
        is_online: true,
        agent_auth_token: agentTokenWithFallback,
        created_at: new Date().toISOString(),
      }
      const retryResult = await supabaseAdmin
        .from('shops')
        .insert(baseShopPayload)
        .select()
        .maybeSingle()

      if (retryResult.error) {
        console.error('[Register Shop] Base insert also failed:', retryResult.error)
        return NextResponse.json(
          { error: `Database error: ${retryResult.error.message}` },
          { status: 500 }
        )
      }
      insertedShop = retryResult.data || baseShopPayload
    }

    const inMemoryShop = { ...fullShopPayload, ...(insertedShop || {}) }
    mockShops.push(inMemoryShop as any)

    // 3. Create default rate cards for the shop in the database
    const defaultCards = initialPricing && initialPricing.length > 0
      ? initialPricing.map((item: any) => ({
          id: crypto.randomUUID(),
          shop_id: shopId,
          category: item.category ? String(item.category).trim() : 'Standard Print',
          service_code: item.service_code
            ? String(item.service_code).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
            : String(item.display_name || 'service').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          display_name: String(item.display_name).trim(),
          pricing_model: item.pricing_model || 'per_page',
          price_bw: Number(item.price_bw) || 2.0,
          price_color: item.price_color !== null && item.price_color !== undefined && item.price_color !== '' ? Number(item.price_color) : null,
          supports_duplex: Boolean(item.supports_duplex),
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
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
      const { error: cardErr } = await supabaseAdmin.from('shop_rate_card').insert(card)
      if (cardErr) {
        console.warn(`[Register Shop] Rate card insert error for ${card.service_code}:`, cardErr.message)
      }
      mockRateCards.push(card)
    }

    // 4. Default welcome banner
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
    const { error: bannerErr } = await supabaseAdmin.from('shop_banners').insert(welcomeBanner)
    if (bannerErr) {
      console.warn('[Register Shop] Banner insert skipped/failed (table may not exist yet):', bannerErr.message)
    }
    mockBanners.push(welcomeBanner as any)

    return NextResponse.json({
      success: true,
      shop: inMemoryShop,
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
