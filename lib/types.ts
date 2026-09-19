export interface Shop {
  id: string
  slug: string
  shop_name: string
  upi_vpa: string
  is_online: boolean
  payment_gateway_enabled?: boolean
  enable_counter_pay?: boolean
  enable_upi_pay?: boolean
  enable_online_pay?: boolean
  cashfree_app_id?: string
  cashfree_secret_key?: string
  cashfree_env?: 'sandbox' | 'production'
  pin?: string
  password_hash?: string
  phone?: string
  address?: string
  agent_auth_token?: string
  pusher_app_id?: string
  pusher_key?: string
  pusher_secret?: string
  pusher_cluster?: string
  created_at?: string
}

export interface ShopBanner {
  id: string
  shop_id: string
  title: string
  subtitle?: string
  badge?: string
  badge_color?: 'marigold' | 'brand' | 'success' | 'accent' | 'danger'
  bg_gradient?: string
  image_url?: string
  link_url?: string
  is_active: boolean
  sort_order: number
}

export type PricingModel = 'per_page' | 'flat_fee' | 'per_copy'

export interface RateCardItem {
  id: string
  shop_id: string
  category: string
  service_code: string
  display_name: string
  pricing_model: PricingModel
  price_bw: number
  price_color: number | null // null = this service has no color option
  supports_duplex: boolean
  is_active: boolean
}

export type PaymentMethod = 'upi' | 'counter' | 'cashfree'

export interface BatchJobItem {
  serviceCode: string
  filename: string
  fileUrl: string
  fileType: string
  pages: number
  pageSelection?: string
  copies: number
  isColor: boolean
  isDuplex: boolean
  totalAmount: number
}

export interface NewJobRequest {
  shopSlug: string
  serviceCode?: string
  filename?: string
  fileUrl?: string
  fileType?: string
  pages?: number
  pageSelection?: string
  copies?: number
  isColor?: boolean
  isDuplex?: boolean
  totalAmount: number
  paymentMethod: PaymentMethod
  customerPhone?: string
  customerEmail?: string
  jobs?: BatchJobItem[]
}

export interface NewJobResponse {
  jobId: string
  jobIds?: string[]
  itemsCount?: number
  totalAmount?: number
  paymentMethod: PaymentMethod
  upiIntentUrl?: string
  paymentSessionId?: string
  cashfreeEnv?: 'sandbox' | 'production'
  cfOrderId?: string
  paymentStatus?: string
}
