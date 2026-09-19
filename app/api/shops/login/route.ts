import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, mockShops } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    const { identifier, pin } = await req.json()

    if (!identifier || !pin) {
      return NextResponse.json(
        { error: 'Please enter your shop username/slug/phone and access PIN' },
        { status: 400 }
      )
    }

    const cleanId = String(identifier).trim().toLowerCase()
    const cleanPin = String(pin).trim()

    // 1. Check in-memory mockShops first
    let shop = mockShops.find(
      (s) =>
        s.slug.toLowerCase() === cleanId ||
        (s.phone && s.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '')) ||
        s.id.toLowerCase() === cleanId
    )

    // 2. If not found, query Supabase database
    if (!shop) {
      const { data } = await supabaseAdmin
        .from('shops')
        .select('*')
        .or(`slug.eq.${cleanId},phone.eq.${cleanId}`)
        .maybeSingle()

      if (data) {
        shop = data as any
      }
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'No shop found with that identifier or phone number.' },
        { status: 404 }
      )
    }

    // Verify PIN or agent_auth_token (default fallback is '1234' if unset)
    const validPin = (shop as any).pin || '1234'
    const validToken = shop.agent_auth_token

    const isMatch =
      cleanPin === validPin ||
      cleanPin === validToken ||
      cleanPin === '1234' // Universal fallback for demo/testing convenience

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Incorrect shop access PIN. Default PIN is 1234.' },
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
