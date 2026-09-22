import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin, mockShops } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { identifier, pin } = await req.json()

    if (!identifier || !pin) {
      return NextResponse.json(
        { error: 'Please enter your shop username/slug/phone and access password' },
        { status: 400 }
      )
    }

    const cleanId = String(identifier).trim().toLowerCase()
    const cleanPin = String(pin).trim()

    let shop: any = null

    // 1. Query Supabase database by slug
    const { data: dbShopBySlug } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('slug', cleanId)
      .maybeSingle()

    if (dbShopBySlug) {
      shop = dbShopBySlug
    }

    // 2. If not found by slug, try searching by phone number (including formatted phone)
    if (!shop) {
      try {
        const cleanDigits = cleanId.replace(/\D/g, '')

        // Exact match on phone
        const { data: dbShopByPhone } = await supabaseAdmin
          .from('shops')
          .select('*')
          .eq('phone', cleanId)
          .maybeSingle()

        if (dbShopByPhone) {
          shop = dbShopByPhone
        } else if (cleanDigits.length >= 7) {
          // Check for phone number formatted differently in DB
          const { data: allShops } = await supabaseAdmin
            .from('shops')
            .select('*')
            .not('phone', 'is', null)

          if (allShops && allShops.length > 0) {
            shop = allShops.find((s: any) => {
              const sDigits = String(s.phone || '').replace(/\D/g, '')
              return sDigits.length >= 7 && (sDigits.endsWith(cleanDigits) || cleanDigits.endsWith(sDigits))
            }) || null
          }
        }
      } catch {
        // Ignored if phone column is not in DB yet
      }
    }

    // 3. If not found in DB, check in-memory mockShops (for non-database shops)
    if (!shop) {
      shop = mockShops.find(
        (s) =>
          s.slug.toLowerCase() === cleanId ||
          (s.phone && s.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')) ||
          s.id.toLowerCase() === cleanId
      ) || null
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'No shop found with that identifier or phone number.' },
        { status: 404 }
      )
    }

    // 4. Verify password strictly against real database credentials
    let isMatch = false

    // A. Check bcrypt password hash
    if (shop.password_hash) {
      try {
        isMatch = await bcrypt.compare(cleanPin, shop.password_hash)
      } catch {
        isMatch = false
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect shop access password or PIN.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        slug: shop.slug,
        shop_name: shop.shop_name,
        upi_vpa: shop.upi_vpa,
        is_online: shop.is_online,
        payment_gateway_enabled: shop.payment_gateway_enabled ?? true,
      },
      redirectUrl: `/dashboard/${shop.slug}`,
    })
  } catch (err: any) {
    console.error('[Shop Login Error]', err)
    return NextResponse.json(
      { error: err.message || 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
