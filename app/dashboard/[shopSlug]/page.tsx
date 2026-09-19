import { notFound } from 'next/navigation'
import { supabaseAdmin, mockShops, mockRateCards, mockBanners } from '@/lib/supabaseAdmin'
import { RateCardItem, Shop, ShopBanner } from '@/lib/types'
import ShopAdminPanel from './ShopAdminPanel'

async function getAdminData(slug: string): Promise<{
  shop: Shop
  items: RateCardItem[]
  banners: ShopBanner[]
} | null> {
  try {
    const { data: shop } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!shop) {
      const mock = mockShops.find((s) => s.slug === slug)
      if (mock) {
        const items = mockRateCards.filter((i) => i.shop_id === mock.id)
        const banners = mockBanners.filter((b) => b.shop_id === mock.id)
        return { shop: mock, items, banners }
      }
      return null
    }

    const { data: items } = await supabaseAdmin
      .from('shop_rate_card')
      .select('*')
      .eq('shop_id', shop.id)
      .order('category', { ascending: true })

    const { data: banners } = await supabaseAdmin
      .from('shop_banners')
      .select('*')
      .eq('shop_id', shop.id)
      .order('sort_order', { ascending: true })

    return {
      shop,
      items: items ?? [],
      banners: banners ?? [],
    }
  } catch (err) {
    console.warn('[Admin Panel] Error fetching shop data:', err)
    const mock = mockShops.find((s) => s.slug === slug)
    if (mock) {
      const items = mockRateCards.filter((i) => i.shop_id === mock.id)
      const banners = mockBanners.filter((b) => b.shop_id === mock.id)
      return { shop: mock, items, banners }
    }
    return null
  }
}

export default async function ShopDashboardPage({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}) {
  const { shopSlug } = await params
  const data = await getAdminData(shopSlug)

  if (!data) {
    notFound()
  }

  return (
    <ShopAdminPanel
      initialShop={data.shop}
      initialItems={data.items}
      initialBanners={data.banners}
    />
  )
}
