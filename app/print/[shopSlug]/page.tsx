import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { RateCardItem, Shop } from '@/lib/types'
import UploadFlow from './UploadFlow'

async function getShopData(slug: string): Promise<{ shop: Shop; items: RateCardItem[] } | null> {
  const { data: shop } = await supabaseAdmin
    .from('shops')
    .select('id, slug, shop_name, upi_vpa, is_online')
    .eq('slug', slug)
    .single()

  if (!shop) return null

  const { data: items } = await supabaseAdmin
    .from('shop_rate_card')
    .select('id, shop_id, category, service_code, display_name, pricing_model, price_bw, price_color, supports_duplex, is_active')
    .eq('shop_id', shop.id)
    .eq('is_active', true)
    .order('category', { ascending: true })

  return { shop, items: items ?? [] }
}

export default async function ShopPrintPage({ params }: { params: Promise<{ shopSlug: string }> }) {
  const { shopSlug } = await params
  const data = await getShopData(shopSlug)

  if (!data) {
    notFound()
  }

  return <UploadFlow shop={data.shop} items={data.items} />
}
