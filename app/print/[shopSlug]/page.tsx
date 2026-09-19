import { notFound } from 'next/navigation'
import { supabaseAdmin, mockBanners } from '@/lib/supabaseAdmin'
import { RateCardItem, Shop, ShopBanner } from '@/lib/types'
import UploadFlow from './UploadFlow'

const DEMO_FALLBACK_SHOP: Shop = {
  id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
  slug: 'demo-shop',
  shop_name: 'Apex Quick Print & Xerox',
  upi_vpa: 'apexprint@upi',
  phone: '+91 98765 43210',
  address: 'Near Central Library, Station Road',
  is_online: true,
  payment_gateway_enabled: true,
  enable_counter_pay: true,
  enable_upi_pay: true,
  enable_online_pay: true,
  cashfree_env: 'sandbox',
}

const DEMO_FALLBACK_ITEMS: RateCardItem[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
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
    id: '22222222-2222-2222-2222-222222222222',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
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
    id: '33333333-3333-3333-3333-333333333333',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
    category: 'Legal & Official',
    service_code: 'rent_agreement',
    display_name: 'Legal / Stamp Paper Print',
    pricing_model: 'per_page',
    price_bw: 5.0,
    price_color: null,
    supports_duplex: false,
    is_active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
    category: 'Project & Binding',
    service_code: 'spiral_binding',
    display_name: 'Spiral & Soft Binding',
    pricing_model: 'flat_fee',
    price_bw: 35.0,
    price_color: null,
    supports_duplex: false,
    is_active: true,
  },
]

async function getShopData(
  slug: string
): Promise<{ shop: Shop; items: RateCardItem[]; banners: ShopBanner[] } | null> {
  try {
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('id, slug, shop_name, upi_vpa, is_online, payment_gateway_enabled, enable_counter_pay, enable_upi_pay, enable_online_pay, cashfree_app_id, cashfree_env, phone, address')
      .eq('slug', slug)
      .single()

    if (!shop) {
      if (slug === 'demo-shop') {
        return {
          shop: DEMO_FALLBACK_SHOP,
          items: DEMO_FALLBACK_ITEMS,
          banners: mockBanners,
        }
      }
      return null
    }

    const { data: items } = await supabaseAdmin
      .from('shop_rate_card')
      .select(
        'id, shop_id, category, service_code, display_name, pricing_model, price_bw, price_color, supports_duplex, is_active'
      )
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('category', { ascending: true })

    const { data: banners } = await supabaseAdmin
      .from('shop_banners')
      .select(
        'id, shop_id, title, subtitle, badge, badge_color, bg_gradient, image_url, link_url, is_active, sort_order'
      )
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return {
      shop,
      items: items && items.length > 0 ? items : slug === 'demo-shop' ? DEMO_FALLBACK_ITEMS : [],
      banners: banners && banners.length > 0 ? banners : mockBanners,
    }
  } catch (err) {
    console.warn('[Shop Page] Error fetching shop data:', err)
    if (slug === 'demo-shop') {
      return {
        shop: DEMO_FALLBACK_SHOP,
        items: DEMO_FALLBACK_ITEMS,
        banners: mockBanners,
      }
    }
    return null
  }
}

export const dynamic = 'force-dynamic'

export default async function ShopPrintPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  const data = await getShopData(shopSlug)

  if (!data) {
    notFound()
  }

  return <UploadFlow shop={data.shop} items={data.items} banners={data.banners} />
}
