export interface Shop {
  id: string
  slug: string
  shop_name: string
  upi_vpa: string
  is_online: boolean
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

export type PaymentMethod = 'upi' | 'counter'

export interface NewJobRequest {
  shopSlug: string
  serviceCode: string
  filename: string
  fileUrl: string
  fileType: string
  pages: number
  copies: number
  isColor: boolean
  isDuplex: boolean
  totalAmount: number
  paymentMethod: PaymentMethod
}

export interface NewJobResponse {
  jobId: string
  paymentMethod: PaymentMethod
  upiIntentUrl?: string
}
