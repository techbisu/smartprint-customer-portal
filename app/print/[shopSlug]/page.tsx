import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin, mockShops, mockRateCards, mockBanners } from '@/lib/supabaseAdmin'
import { RateCardItem, Shop, ShopBanner } from '@/lib/types'
import { getShopTrialStatus } from '@/lib/subscription'
import UploadFlow from './UploadFlow'
import ShopSuspendedView from '@/components/ShopSuspendedView'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shopSlug: string }>
}): Promise<Metadata> {
  const { shopSlug } = await params
  const data = await getShopData(shopSlug)
  const shopName = data?.shop?.shop_name || 'Print Shop'
  const trialStatus = getShopTrialStatus(data?.shop)

  if (trialStatus.isLocked) {
    return {
      title: `${shopName} | Portal Offline`,
      description: `${shopName} online print portal is temporarily offline.`,
    }
  }

  return {
    title: `${shopName} | Customer Print Portal`,
    description: `Upload files, select print specifications, calculate live costs, and order prints from ${shopName}.`,
  }
}

async function getShopData(
  slug: string
): Promise<{ shop: Shop; items: RateCardItem[]; banners: ShopBanner[] } | null> {
  const cleanSlug = slug.toLowerCase().trim()
  try {
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle()

    if (!shop || shopError) {
      const mock = mockShops.find((s) => s.slug.toLowerCase() === cleanSlug)
      if (mock) {
        const items = mockRateCards.filter((i) => i.shop_id === mock.id && i.is_active !== false)
        const banners = mockBanners.filter((b) => b.shop_id === mock.id && b.is_active !== false)
        return {
          shop: mock,
          items,
          banners,
        }
      }
      return null
    }

    const { data: items } = await supabaseAdmin
      .from('shop_rate_card')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('category', { ascending: true })

    const { data: banners } = await supabaseAdmin
      .from('shop_banners')
      .select('*')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    return {
      shop,
      items: items ?? [],
      banners: banners && banners.length > 0 ? banners : mockBanners.filter((b) => b.is_active !== false),
    }
  } catch (err) {
    console.warn('[Shop Page] Error fetching shop data:', err)
    const mock = mockShops.find((s) => s.slug.toLowerCase() === cleanSlug)
    if (mock) {
      const items = mockRateCards.filter((i) => i.shop_id === mock.id && i.is_active !== false)
      const banners = mockBanners.filter((b) => b.shop_id === mock.id && b.is_active !== false)
      return {
        shop: mock,
        items,
        banners,
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

  const trialStatus = getShopTrialStatus(data.shop)
  if (trialStatus.isLocked) {
    return <ShopSuspendedView shop={data.shop} />
  }

  return <UploadFlow shop={data.shop} items={data.items} banners={data.banners} />
}
