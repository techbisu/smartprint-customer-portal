import 'server-only'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { RateCardItem, Shop, ShopBanner } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function isConfiguredSupabase(url?: string, key?: string): boolean {
  if (!url || !key) return false
  const lowerUrl = url.toLowerCase().trim()
  const lowerKey = key.toLowerCase().trim()
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) return false
  if (
    lowerUrl.includes('your-project') ||
    lowerUrl.includes('placeholder') ||
    lowerUrl.includes('example.com') ||
    lowerKey.includes('your-service') ||
    lowerKey.includes('placeholder') ||
    lowerKey.startsWith('your-')
  ) {
    return false
  }
  return true
}

let realClient: SupabaseClient | null = null
if (isConfiguredSupabase(supabaseUrl, serviceRoleKey)) {
  try {
    realClient = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    })
  } catch (err) {
    console.warn('[Supabase Admin] Could not initialize Supabase client:', err)
  }
}

export interface MockShop extends Shop {
  agent_auth_token: string
  created_at: string
}

export interface MockPrintJob {
  id: string
  shop_id: string
  service_code: string
  file_url: string
  file_type: string
  pages: number
  page_selection?: string
  copies: number
  is_color: boolean
  is_duplex: boolean
  total_amount: number
  payment_status: string
  print_status: string
  created_at: string
}

// Global In-Memory Stores
export const mockShops: MockShop[] = [
  {
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
    agent_auth_token: 'demo-agent-auth-token-12345',
    pusher_app_id: process.env.PUSHER_APP_ID || '1827364',
    pusher_key: process.env.PUSHER_KEY || '2e5517c16c8d36b2969d',
    pusher_cluster: process.env.PUSHER_CLUSTER || 'ap2',
    pusher_secret: process.env.PUSHER_SECRET || '',
    created_at: new Date().toISOString(),
    plan_type: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export const mockRateCards: RateCardItem[] = [
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

export const mockBanners: ShopBanner[] = [
  {
    id: 'banner-1',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
    title: '⚡ Express Direct Counter Print',
    subtitle: 'Upload straight from your phone — No WhatsApp, No pendrive, No file transfer delays!',
    badge: 'FASTEST',
    badge_color: 'marigold',
    bg_gradient: 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'banner-2',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
    title: '🎓 College Project & Thesis Binding',
    subtitle: 'Spiral & Hardbound binding ready in 15 minutes with crystal gloss covers.',
    badge: 'STUDENT OFFER',
    badge_color: 'success',
    bg_gradient: 'from-[#175432] via-[#103D24] to-[#0A2617]',
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'banner-3',
    shop_id: 'd3b07384-d113-4f9e-9c2b-2f3b7c8a1e50',
    title: '🪪 Smart ID Cards & Crystal Lamination',
    subtitle: '250-micron heat sealed waterproof lamination for PAN, Aadhaar & College IDs.',
    badge: 'POPULAR',
    badge_color: 'accent',
    bg_gradient: 'from-[#581C87] via-[#3B0764] to-[#1E0436]',
    is_active: true,
    sort_order: 3,
  },
]

export const mockPrintJobs: MockPrintJob[] = []

class MockQueryBuilder {
  private table: string
  private filters: Array<{ column: string; value: unknown }> = []
  private selectedColumns = '*'
  private orderField?: string
  private orderAscending = true

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*') {
    this.selectedColumns = columns
    return this
  }

  eq(column: string, value: unknown) {
    this.filters.push({ column, value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAscending = options?.ascending ?? true
    return this
  }

  private filterRows<T extends Record<string, any>>(rows: T[]): T[] {
    return rows.filter((row) =>
      this.filters.every((f) => row[f.column] === f.value)
    )
  }

  async single() {
    if (this.table === 'shops') {
      const match = this.filterRows(mockShops)[0]
      if (match) return { data: match, error: null }
      return { data: null, error: new Error('Shop not found') }
    }
    if (this.table === 'shop_rate_card') {
      const match = this.filterRows(mockRateCards)[0]
      if (match) return { data: match, error: null }
      return { data: null, error: new Error('Rate card item not found') }
    }
    if (this.table === 'shop_banners') {
      const match = this.filterRows(mockBanners)[0]
      if (match) return { data: match, error: null }
      return { data: null, error: new Error('Banner not found') }
    }
    if (this.table === 'print_jobs') {
      const match = this.filterRows(mockPrintJobs)[0]
      if (match) return { data: match, error: null }
      return { data: null, error: new Error('Print job not found') }
    }
    return { data: null, error: new Error(`Table ${this.table} not found`) }
  }

  then(resolve: (value: { data: any; error: any }) => void) {
    let result: any[] = []
    if (this.table === 'shops') {
      result = this.filterRows(mockShops)
    } else if (this.table === 'shop_rate_card') {
      result = this.filterRows(mockRateCards)
    } else if (this.table === 'shop_banners') {
      result = this.filterRows(mockBanners)
    } else if (this.table === 'print_jobs') {
      result = this.filterRows(mockPrintJobs)
    }

    if (this.orderField && result.length > 0) {
      result = [...result].sort((a, b) => {
        const valA = a[this.orderField!]
        const valB = b[this.orderField!]
        if (typeof valA === 'number' && typeof valB === 'number') {
          return this.orderAscending ? valA - valB : valB - valA
        }
        return this.orderAscending
          ? String(valA ?? '').localeCompare(String(valB ?? ''))
          : String(valB ?? '').localeCompare(String(valA ?? ''))
      })
    }

    resolve({ data: result, error: null })
  }

  async insert(row: any) {
    const rows = Array.isArray(row) ? row : [row]
    const inserted: any[] = []
    for (const r of rows) {
      if (this.table === 'shops') {
        const newShop: MockShop = {
          ...r,
          id: r.id || crypto.randomUUID(),
          agent_auth_token: r.agent_auth_token || crypto.randomUUID(),
          created_at: r.created_at || new Date().toISOString(),
          is_online: r.is_online !== undefined ? r.is_online : true,
          payment_gateway_enabled: r.payment_gateway_enabled !== undefined ? r.payment_gateway_enabled : true,
        }
        mockShops.push(newShop)
        inserted.push(newShop)
      } else if (this.table === 'shop_rate_card') {
        const newItem: RateCardItem = {
          ...r,
          id: r.id || crypto.randomUUID(),
          is_active: r.is_active !== undefined ? r.is_active : true,
        }
        mockRateCards.push(newItem)
        inserted.push(newItem)
      } else if (this.table === 'shop_banners') {
        const newBanner: ShopBanner = {
          ...r,
          id: r.id || `banner-${crypto.randomUUID().slice(0, 8)}`,
          is_active: r.is_active !== undefined ? r.is_active : true,
          sort_order: r.sort_order || mockBanners.length + 1,
        }
        mockBanners.push(newBanner)
        inserted.push(newBanner)
      } else if (this.table === 'print_jobs') {
        const newJob: MockPrintJob = {
          ...r,
          id: r.id || crypto.randomUUID(),
          created_at: r.created_at || new Date().toISOString(),
        }
        mockPrintJobs.push(newJob)
        inserted.push(newJob)
      }
    }
    const resultData = Array.isArray(row) ? inserted : inserted[0] || row
    return {
      data: resultData,
      error: null,
      select: () => ({
        single: async () => ({ data: resultData, error: null }),
        then: (resolve: any) => resolve({ data: resultData, error: null }),
      }),
    }
  }

  update(updates: any) {
    const targetFilters = [...this.filters]
    const table = this.table
    const getTargetArray = () => {
      if (table === 'shops') return mockShops
      if (table === 'shop_rate_card') return mockRateCards
      if (table === 'shop_banners') return mockBanners
      if (table === 'print_jobs') return mockPrintJobs
      return []
    }

    const runUpdate = () => {
      const targetArray = getTargetArray()
      const matched = targetArray.filter((row: any) =>
        targetFilters.every((f) => row[f.column] === f.value)
      )
      for (const item of matched) {
        Object.assign(item, updates)
      }
      return { data: matched, error: null }
    }

    const builder: any = {
      eq(col: string, val: any) {
        targetFilters.push({ column: col, value: val })
        return builder
      },
      select() {
        return builder
      },
      single: async () => {
        const res = runUpdate()
        return { data: res.data[0] || null, error: null }
      },
      then(resolve: (val: any) => void) {
        resolve(runUpdate())
      },
    }
    return builder
  }

  delete() {
    const targetFilters = [...this.filters]
    const table = this.table
    const runDelete = () => {
      if (table === 'shop_rate_card') {
        for (let i = mockRateCards.length - 1; i >= 0; i--) {
          if (targetFilters.every((f) => (mockRateCards[i] as any)[f.column] === f.value)) {
            mockRateCards.splice(i, 1)
          }
        }
      } else if (table === 'shop_banners') {
        for (let i = mockBanners.length - 1; i >= 0; i--) {
          if (targetFilters.every((f) => (mockBanners[i] as any)[f.column] === f.value)) {
            mockBanners.splice(i, 1)
          }
        }
      }
      return { data: null, error: null }
    }

    const builder: any = {
      eq(col: string, val: any) {
        targetFilters.push({ column: col, value: val })
        return builder
      },
      then(resolve: (val: any) => void) {
        resolve(runDelete())
      },
    }
    return builder
  }
}

export const supabaseAdmin = {
  from: (table: string) => {
    if (realClient) {
      try {
        const realBuilder = realClient.from(table)
        return new Proxy(realBuilder as any, {
          get(target, prop, receiver) {
            const original = Reflect.get(target, prop, receiver)
            if (typeof original === 'function') {
              return (...args: any[]) => {
                try {
                  const res = original.apply(target, args)
                  return res
                } catch (e) {
                  return (new MockQueryBuilder(table) as any)[prop](...args)
                }
              }
            }
            return original
          },
        })
      } catch (err) {
        console.warn(`[Supabase Admin] Fallback to in-memory store for ${table}:`, err)
      }
    }
    return new MockQueryBuilder(table) as any
  },
} as unknown as SupabaseClient
