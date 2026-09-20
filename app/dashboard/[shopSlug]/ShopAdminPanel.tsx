'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RateCardItem, Shop, ShopBanner } from '@/lib/types'
import { formatRupees } from '@/lib/pricing'
import { supabaseBrowser, UPLOAD_BUCKET } from '@/lib/supabaseBrowser'
import BannerSlider from '@/components/BannerSlider'
import QRStickerGenerator from '@/components/QRStickerGenerator'
import AgentStatusIndicator from '@/components/AgentStatusIndicator'
import {
  Store,
  Tag,
  Sparkles,
  QrCode,
  Settings,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Check,
  Power,
  Copy,
  Printer,
  FileText,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Smartphone,
  Save,
  X,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Cpu,
  Radio,
  Eye,
  EyeOff,
  RefreshCw,
  Key,
  HelpCircle,
  Image as ImageIcon,
  Upload,
  Loader2,
} from 'lucide-react'

interface Props {
  initialShop: Shop
  initialItems: RateCardItem[]
  initialBanners: ShopBanner[]
}

type TabKey = 'pricing' | 'banners' | 'poster' | 'settings'

export default function ShopAdminPanel({ initialShop, initialItems, initialBanners }: Props) {
  const router = useRouter()
  const [shop, setShop] = useState<Shop>(initialShop)
  const [items, setItems] = useState<RateCardItem[]>(initialItems)
  const [banners, setBanners] = useState<ShopBanner[]>(initialBanners)
  const [activeTab, setActiveTab] = useState<TabKey>('pricing')

  const [savingStatus, setSavingStatus] = useState(false)
  const [savingGateway, setSavingGateway] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Shop-wise Pusher Settings & Desktop Agent Setup
  const [pusherAppKey, setPusherAppKey] = useState(shop.pusher_key || '2e5517c16c8d36b2969d')
  const [pusherCluster, setPusherCluster] = useState(shop.pusher_cluster || 'ap2')
  const [pusherAppId, setPusherAppId] = useState(shop.pusher_app_id || '')
  const [pusherSecret, setPusherSecret] = useState(shop.pusher_secret || '')
  const [savingPusher, setSavingPusher] = useState(false)
  const [showAgentToken, setShowAgentToken] = useState(false)
  const [showPusherSecret, setShowPusherSecret] = useState(false)
  const [regeneratingToken, setRegeneratingToken] = useState(false)

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<RateCardItem | null>(null)
  const [showBannerModal, setShowBannerModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState<ShopBanner | null>(null)

  // Form states for Rate Card Item
  const [itemName, setItemName] = useState('')
  const [itemCategory, setItemCategory] = useState('Standard Print')
  const [itemModel, setItemModel] = useState<'per_page' | 'flat_fee' | 'per_copy'>('per_page')
  const [itemPriceBw, setItemPriceBw] = useState('2.00')
  const [itemHasColor, setItemHasColor] = useState(true)
  const [itemPriceColor, setItemPriceColor] = useState('8.00')
  const [itemDuplex, setItemDuplex] = useState(true)

  // Form states for Banner
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerSubtitle, setBannerSubtitle] = useState('')
  const [bannerBadge, setBannerBadge] = useState('OFFER')
  const [bannerBadgeColor, setBannerBadgeColor] = useState<'marigold' | 'brand' | 'success' | 'accent' | 'danger'>('marigold')
  const [bannerGradient, setBannerGradient] = useState('from-[#2C3A6B] via-[#212C52] to-[#16181D]')
  const [bannerImageUrl, setBannerImageUrl] = useState('')
  const [isUploadingBannerImg, setIsUploadingBannerImg] = useState(false)
  const [imgbbApiKey, setImgbbApiKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smartprint_imgbb_api_key') || ''
    }
    return ''
  })
  const bannerImageInputRef = useRef<HTMLInputElement>(null)

  const sanitizeImageUrl = (url: string) => {
    let clean = url.trim()
    const srcMatch = clean.match(/src=["'](https?:\/\/[^"']+)["']/)
    if (srcMatch) clean = srcMatch[1]
    return clean
  }

  const handleUploadBannerImage = async (file: File) => {
    if (!file) return
    setIsUploadingBannerImg(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (imgbbApiKey.trim()) {
        formData.append('apiKey', imgbbApiKey.trim())
      }

      const res = await fetch('/api/imgbb/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (res.ok && data.success && data.url) {
        setBannerImageUrl(data.url)
        showToast('Image uploaded directly to ImgBB successfully!')
      } else {
        showToast(data.error || 'Failed to upload image to ImgBB')
      }
    } catch {
      showToast('Error uploading image to ImgBB')
    } finally {
      setIsUploadingBannerImg(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Toggle Online / Offline
  const toggleOnline = async () => {
    const newStatus = !shop.is_online
    setSavingStatus(true)
    try {
      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_online: newStatus }),
      })
      if (res.ok) {
        setShop({ ...shop, is_online: newStatus })
        showToast(newStatus ? 'Shop is now Live & accepting prints' : 'Shop counter paused')
      }
    } catch {
      showToast('Failed to update status')
    } finally {
      setSavingStatus(false)
    }
  }

  // Toggle specific payment method (counter, upi, online)
  const togglePaymentMethod = async (method: 'counter' | 'upi' | 'online') => {
    let updatePayload: Record<string, boolean> = {}
    let newStatus = false
    let label = ''

    if (method === 'counter') {
      newStatus = shop.enable_counter_pay === false ? true : false
      updatePayload = { enable_counter_pay: newStatus }
      label = 'Pay at Counter (Cash)'
    } else if (method === 'upi') {
      newStatus = shop.enable_upi_pay === false ? true : false
      updatePayload = { enable_upi_pay: newStatus }
      label = 'UPI Pay (Deeplink)'
    } else {
      newStatus = (shop.enable_online_pay === false || shop.payment_gateway_enabled === false) ? true : false
      updatePayload = { enable_online_pay: newStatus, payment_gateway_enabled: newStatus }
      label = 'Online Pay (Cashfree Gateway)'
    }

    // Safety check: ensure not all 3 are disabled
    const counterWillBe = method === 'counter' ? newStatus : (shop.enable_counter_pay !== false)
    const upiWillBe = method === 'upi' ? newStatus : (shop.enable_upi_pay !== false)
    const onlineWillBe = method === 'online' ? newStatus : (shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false)

    if (!counterWillBe && !upiWillBe && !onlineWillBe) {
      showToast('⚠️ At least one payment option must remain active for customers!')
      return
    }

    setSavingGateway(true)
    try {
      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })
      const data = await res.json()
      if (res.ok && data.shop) {
        setShop((prev) => ({ ...prev, ...data.shop }))
        showToast(`${label} is now ${newStatus ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`)
      } else {
        throw new Error(data.error || 'Failed to update payment setting')
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment option')
    } finally {
      setSavingGateway(false)
    }
  }

  const toggleGateway = () => togglePaymentMethod('online')

  // Toggle Print Service On/Off
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null)

  const toggleItemActive = async (item: RateCardItem) => {
    const newActive = item.is_active === false ? true : false
    setTogglingItemId(item.id)
    try {
      const res = await fetch(`/api/shops/${shop.slug}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          is_active: newActive,
        }),
      })
      const data = await res.json()
      if (res.ok && data.item) {
        setItems(items.map((i) => (i.id === item.id ? { ...i, is_active: newActive } : i)))
        showToast(`Service "${item.display_name}" is now ${newActive ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}`)
      } else {
        throw new Error(data.error || 'Failed to update service status')
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating service status')
    } finally {
      setTogglingItemId(null)
    }
  }

  // Handle Logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('smartprint_active_shop')
    }
    router.push('/shop/login')
  }

  // Save or Update Rate Card Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim() || !itemPriceBw) return

    const payload = {
      display_name: itemName.trim(),
      category: itemCategory.trim(),
      pricing_model: itemModel,
      price_bw: parseFloat(itemPriceBw),
      price_color: itemHasColor && itemPriceColor ? parseFloat(itemPriceColor) : null,
      supports_duplex: itemDuplex,
      is_active: true,
    }

    try {
      if (editingItem) {
        const res = await fetch(`/api/shops/${shop.slug}/pricing`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem.id, ...payload }),
        })
        const data = await res.json()
        if (data.item) {
          setItems(items.map((i) => (i.id === editingItem.id ? data.item : i)))
          showToast('Pricing updated successfully')
        }
      } else {
        const res = await fetch(`/api/shops/${shop.slug}/pricing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.item) {
          setItems([...items, data.item])
          showToast('New service added')
        }
      }
      setShowItemModal(false)
      setEditingItem(null)
    } catch {
      showToast('Error saving item')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      const res = await fetch(`/api/shops/${shop.slug}/pricing?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems(items.filter((i) => i.id !== id))
        showToast('Service deleted')
      }
    } catch {
      showToast('Failed to delete service')
    }
  }

  const openAddItemModal = (preset?: Partial<RateCardItem>) => {
    setEditingItem(null)
    setItemName(preset?.display_name || '')
    setItemCategory(preset?.category || 'Standard Print')
    setItemModel(preset?.pricing_model || 'per_page')
    setItemPriceBw(preset?.price_bw ? String(preset.price_bw) : '2.00')
    setItemHasColor(preset?.price_color !== null)
    setItemPriceColor(preset?.price_color ? String(preset.price_color) : '8.00')
    setItemDuplex(preset?.supports_duplex ?? true)
    setShowItemModal(true)
  }

  const openEditItemModal = (item: RateCardItem) => {
    setEditingItem(item)
    setItemName(item.display_name)
    setItemCategory(item.category)
    setItemModel(item.pricing_model)
    setItemPriceBw(String(item.price_bw))
    setItemHasColor(item.price_color !== null)
    setItemPriceColor(item.price_color !== null ? String(item.price_color) : '')
    setItemDuplex(item.supports_duplex)
    setShowItemModal(true)
  }

  // Save or Update Banner
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bannerTitle.trim()) return

    const payload = {
      title: bannerTitle.trim(),
      subtitle: bannerSubtitle.trim(),
      badge: bannerBadge.trim() || undefined,
      badge_color: bannerBadgeColor,
      bg_gradient: bannerGradient,
      image_url: bannerImageUrl.trim() || undefined,
      is_active: true,
    }

    try {
      if (editingBanner) {
        const res = await fetch(`/api/shops/${shop.slug}/banners`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBanner.id, ...payload }),
        })
        const data = await res.json()
        if (data.banner) {
          setBanners(banners.map((b) => (b.id === editingBanner.id ? data.banner : b)))
          showToast('Banner updated')
        }
      } else {
        const res = await fetch(`/api/shops/${shop.slug}/banners`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.banner) {
          setBanners([...banners, data.banner])
          showToast('New banner added')
        }
      }
      setShowBannerModal(false)
      setEditingBanner(null)
    } catch {
      showToast('Error saving banner')
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    try {
      const res = await fetch(`/api/shops/${shop.slug}/banners?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id))
        showToast('Banner removed')
      }
    } catch {
      showToast('Failed to delete banner')
    }
  }

  const openAddBannerModal = (preset?: Partial<ShopBanner>) => {
    setEditingBanner(null)
    setBannerTitle(preset?.title || '')
    setBannerSubtitle(preset?.subtitle || '')
    setBannerBadge(preset?.badge || 'OFFER')
    setBannerBadgeColor(preset?.badge_color || 'marigold')
    setBannerGradient(preset?.bg_gradient || 'from-[#2C3A6B] via-[#212C52] to-[#16181D]')
    setBannerImageUrl(preset?.image_url || '')
    setShowBannerModal(true)
  }

  const openEditBannerModal = (banner: ShopBanner) => {
    setEditingBanner(banner)
    setBannerTitle(banner.title)
    setBannerSubtitle(banner.subtitle || '')
    setBannerBadge(banner.badge || '')
    setBannerBadgeColor(banner.badge_color || 'marigold')
    setBannerGradient(banner.bg_gradient || 'from-[#2C3A6B] via-[#212C52] to-[#16181D]')
    setBannerImageUrl(banner.image_url || '')
    setShowBannerModal(true)
  }

  const copySetting = (val: string, keyName: string) => {
    navigator.clipboard.writeText(val)
    setCopiedKey(keyName)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const copyToken = () => {
    if (shop.agent_auth_token) {
      navigator.clipboard.writeText(shop.agent_auth_token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const copyAllAgentConfig = () => {
    const authUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`
    const text = [
      `[SmartPrint Desktop Agent Configuration]`,
      `Shop ID: ${shop.id}`,
      `Access Token: ${shop.agent_auth_token || 'demo-agent-auth-token-12345'}`,
      `Pusher App Key: ${pusherAppKey}`,
      `Pusher Cluster: ${pusherCluster}`,
      `Auth Endpoint URL: ${authUrl}`,
    ].join('\n')
    copySetting(text, 'all')
    showToast('Copied full agent configuration to clipboard!')
  }

  const handleSavePusher = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPusher(true)
    try {
      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pusher_key: pusherAppKey,
          pusher_cluster: pusherCluster,
          pusher_app_id: pusherAppId,
          pusher_secret: pusherSecret,
        }),
      })
      const data = await res.json()
      if (res.ok && data.shop) {
        setShop(data.shop)
        showToast('Shop Pusher credentials updated successfully!')
      } else {
        showToast(data.error || 'Failed to update Pusher credentials')
      }
    } catch {
      showToast('Failed to connect to server')
    } finally {
      setSavingPusher(false)
    }
  }

  const handleRegenerateToken = async () => {
    if (
      !confirm(
        'Are you sure you want to regenerate the Desktop Agent Token? Any active desktop agents using the current token will need to be reconfigured.'
      )
    ) {
      return
    }
    setRegeneratingToken(true)
    try {
      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate_token: true }),
      })
      const data = await res.json()
      if (res.ok && data.shop) {
        setShop(data.shop)
        showToast('New Desktop Agent Token generated!')
      } else {
        showToast('Failed to regenerate token')
      }
    } catch {
      showToast('Error regenerating token')
    } finally {
      setRegeneratingToken(false)
    }
  }

  // Update Shop Settings (name, UPI, phone, address, password)
  const [editShopName, setEditShopName] = useState(shop.shop_name)
  const [editUpi, setEditUpi] = useState(shop.upi_vpa)
  const [editPhone, setEditPhone] = useState(shop.phone || '')
  const [editAddress, setEditAddress] = useState(shop.address || '')
  const [editPassword, setEditPassword] = useState('')
  const [editDefaultLanguage, setEditDefaultLanguage] = useState<'en' | 'bn' | 'hi'>(
    (shop.default_language as 'en' | 'bn' | 'hi') || 'en'
  )

  // Cashfree API Configuration
  const [cashfreeAppId, setCashfreeAppId] = useState(shop.cashfree_app_id || '')
  const [cashfreeSecretKey, setCashfreeSecretKey] = useState(shop.cashfree_secret_key || '')
  const [cashfreeEnv, setCashfreeEnv] = useState<'sandbox' | 'production'>(shop.cashfree_env || 'sandbox')
  const [savingCashfree, setSavingCashfree] = useState(false)
  const [showCashfreeSecret, setShowCashfreeSecret] = useState(false)

  const handleSaveCashfree = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingCashfree(true)
    try {
      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashfree_app_id: cashfreeAppId,
          cashfree_secret_key: cashfreeSecretKey,
          cashfree_env: cashfreeEnv,
        }),
      })
      const data = await res.json()
      if (res.ok && data.shop) {
        setShop((prev) => ({ ...prev, ...data.shop }))
        showToast('Cashfree Gateway API credentials saved successfully!')
      } else {
        showToast(data.error || 'Failed to save Cashfree credentials')
      }
    } catch {
      showToast('Error connecting to server')
    } finally {
      setSavingCashfree(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Record<string, any> = {
        shop_name: editShopName,
        upi_vpa: editUpi,
        phone: editPhone,
        address: editAddress,
        default_language: editDefaultLanguage,
      }
      if (editPassword.trim()) {
        payload.password = editPassword.trim()
      }

      const res = await fetch(`/api/shops/${shop.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.shop) {
        setShop({ ...shop, ...data.shop })
        setEditPassword('')
        showToast('Shop details and password saved successfully')
      }
    } catch {
      showToast('Failed to save settings')
    }
  }

  return (
    <main className="min-h-screen bg-paper pb-24">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-ink text-white px-4 py-2.5 text-xs font-semibold shadow-lg animate-rise flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar with Shop Info & Status */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Shop Branding */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-bold text-white shadow-xs">
                <Store className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-ink">{shop.shop_name}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                    <ShieldCheck className="h-3 w-3" /> Shop Admin
                  </span>
                </div>
                <p className="text-[11px] text-muted font-mono">{shop.upi_vpa}</p>
              </div>
            </div>

            {/* Right: Live Status Toggle & View Customer Page */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Realtime Desktop Agent Status via Pusher */}
              <AgentStatusIndicator shop={shop} onToast={showToast} />

              <button
                type="button"
                onClick={toggleOnline}
                disabled={savingStatus}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs ${
                  shop.is_online
                    ? 'bg-success-50 text-success-700 border border-success-200 hover:bg-success-100'
                    : 'bg-danger-50 text-danger-700 border border-danger-200 hover:bg-danger-100'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    shop.is_online ? 'bg-success-500 animate-pulse' : 'bg-danger-500'
                  }`}
                />
                <span>{shop.is_online ? 'Counter Live' : 'Counter Paused'}</span>
              </button>

              <Link
                href={`/print/${shop.slug}`}
                target="_blank"
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-paper shadow-2xs transition-colors"
              >
                <span>Customer View</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-danger-600 hover:bg-danger-50 transition-colors cursor-pointer"
                title="Log out from shop panel"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-3 flex gap-1 border-t border-line/60 pt-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'pricing'
                  ? 'bg-brand-600 text-white'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Print Pricing ({items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'banners'
                  ? 'bg-brand-600 text-white'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Banners & Offers ({banners.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('poster')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'poster'
                  ? 'bg-brand-600 text-white'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>QR Sticker &amp; Poster Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'settings'
                  ? 'bg-brand-600 text-white'
                  : 'text-muted hover:text-ink hover:bg-paper'
              }`}
            >
              <Settings className="h-3.5 w-3.5" />
              <span>Shop Settings & Token</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* ================= TAB 1: PRINT PRICING ================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Manage Print Services & Rates</h2>
                <p className="text-xs text-muted">
                  Configure page rates, color options, and duplex settings displayed to customers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddItemModal()}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Print Service</span>
              </button>
            </div>

            {/* Quick preset chips */}
            <div className="rounded-xl border border-line bg-white p-3 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Quick Add Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    openAddItemModal({
                      display_name: 'Document Print (A4)',
                      category: 'Standard Print',
                      pricing_model: 'per_page',
                      price_bw: 2.0,
                      price_color: 8.0,
                      supports_duplex: true,
                    })
                  }
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-brand-400"
                >
                  + Standard A4
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAddItemModal({
                      display_name: 'Spiral / Wire Binding',
                      category: 'Project & Binding',
                      pricing_model: 'flat_fee',
                      price_bw: 40.0,
                      price_color: null,
                      supports_duplex: false,
                    })
                  }
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-brand-400"
                >
                  + Spiral Binding
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAddItemModal({
                      display_name: 'Glossy Photo Print (4x6)',
                      category: 'Photo & Special',
                      pricing_model: 'flat_fee',
                      price_bw: 20.0,
                      price_color: 25.0,
                      supports_duplex: false,
                    })
                  }
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-brand-400"
                >
                  + Photo Print
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAddItemModal({
                      display_name: 'A3 Engineering / Poster Print',
                      category: 'Large Format',
                      pricing_model: 'per_page',
                      price_bw: 10.0,
                      price_color: 25.0,
                      supports_duplex: false,
                    })
                  }
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-brand-400"
                >
                  + A3 Poster
                </button>
                <button
                  type="button"
                  onClick={() =>
                    openAddItemModal({
                      display_name: 'Crystal ID Lamination',
                      category: 'ID Card & Badges',
                      pricing_model: 'flat_fee',
                      price_bw: 15.0,
                      price_color: null,
                      supports_duplex: false,
                    })
                  }
                  className="rounded-lg border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink hover:border-brand-400"
                >
                  + Lamination
                </button>
              </div>
            </div>

            {/* List of Rate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all ${
                    item.is_active !== false
                      ? 'border-line bg-white hover:border-brand-200'
                      : 'border-slate-200 bg-slate-50/70 opacity-85'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                          {item.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.is_active !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {item.is_active !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleItemActive(item)}
                        disabled={togglingItemId === item.id}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          item.is_active !== false
                            ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                            : 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                        title={item.is_active !== false ? 'Turn service OFF' : 'Turn service ON'}
                      >
                        {item.is_active !== false ? (
                          <>
                            <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Turn OFF</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-3.5 w-3.5 text-white" />
                            <span>Turn ON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-ink">{item.display_name}</h3>
                      <span className="text-[11px] font-medium text-muted">
                        {item.pricing_model === 'per_page' ? 'Per Page' : 'Flat Fee / Item'}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-paper p-2 border border-line/70">
                        <span className="text-[10px] text-muted block font-medium">B&W Rate</span>
                        <span className="text-sm font-bold text-ink">
                          {formatRupees(item.price_bw)}
                        </span>
                      </div>

                      <div className="rounded-lg bg-paper p-2 border border-line/70">
                        <span className="text-[10px] text-muted block font-medium">Color Rate</span>
                        <span className="text-sm font-bold text-ink">
                          {item.price_color !== null ? formatRupees(item.price_color) : 'No Color'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted">
                      <span>Duplex: {item.supports_duplex ? 'Yes (Both sides)' : 'Single side only'}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-line/60 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditItemModal(item)}
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:bg-paper"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Rate
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-danger-500 hover:bg-danger-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: BANNERS & OFFERS ================= */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-ink">Promotional Banners & Service Offers</h2>
                <p className="text-xs text-muted">
                  These banners cycle automatically on your customer mobile print page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddBannerModal()}
                className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Banner</span>
              </button>
            </div>

            {/* Live Slider Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5 text-brand-600" />
                Live Customer Mobile Slider Preview
              </span>
              <div className="max-w-md mx-auto">
                <BannerSlider banners={banners} />
              </div>
            </div>

            {/* Banner List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Configured Banners ({banners.length})
              </h3>

              <div className="space-y-3">
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-12 w-12 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${
                          banner.bg_gradient || 'from-[#2C3A6B] to-[#16181D]'
                        } flex items-center justify-center text-white font-bold text-xs shadow-xs relative`}
                      >
                        {banner.image_url ? (
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>#{index + 1}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{banner.title}</span>
                          {banner.badge && (
                            <span className="rounded-full bg-marigold-500/20 text-marigold-700 font-bold px-2 py-0.5 text-[10px]">
                              {banner.badge}
                            </span>
                          )}
                          {banner.image_url && (
                            <span className="rounded-full bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 text-[10px] border border-blue-200 inline-flex items-center gap-1">
                              <ImageIcon className="h-2.5 w-2.5" />
                              Image
                            </span>
                          )}
                        </div>
                        {banner.subtitle && (
                          <p className="text-xs text-muted mt-0.5 max-w-xl">{banner.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => openEditBannerModal(banner)}
                        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-muted hover:text-ink hover:bg-paper"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-danger-500 hover:bg-danger-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: QR STICKER & POSTER STUDIO ================= */}
        {activeTab === 'poster' && (
          <QRStickerGenerator shop={shop} />
        )}

        {/* ================= TAB 4: SETTINGS & AGENT ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-ink">Shop Profile & Desktop Agent</h2>
              <p className="text-xs text-muted">
                Manage your payment coordinates and sync with your physical printer.
              </p>
            </div>

            {/* Shop Details Form */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Shop Information
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Shop Name</label>
                  <input
                    type="text"
                    required
                    value={editShopName}
                    onChange={(e) => setEditShopName(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    UPI VPA ID (For Direct Payments)
                  </label>
                  <input
                    type="text"
                    required
                    value={editUpi}
                    onChange={(e) => setEditUpi(e.target.value)}
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Phone</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Address</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Default Customer Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'en', label: 'English', sub: 'Default' },
                      { id: 'bn', label: 'বাংলা', sub: 'Bengali' },
                      { id: 'hi', label: 'हिंदी', sub: 'Hindi' },
                    ].map((langOption) => {
                      const isSelected = editDefaultLanguage === langOption.id
                      return (
                        <button
                          key={langOption.id}
                          type="button"
                          onClick={() => setEditDefaultLanguage(langOption.id as 'en' | 'bn' | 'hi')}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/70 text-brand-900 font-bold shadow-xs'
                              : 'border-line bg-white text-muted hover:bg-paper hover:text-ink'
                          }`}
                        >
                          <span className="text-sm font-bold">{langOption.label}</span>
                          <span className="text-[10px] opacity-80">{langOption.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Customers visiting your print portal will see this language by default.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Update Access Password / PIN (Optional)
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Enter new password to change (leave blank to keep current)"
                    className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs text-ink focus:border-brand-600 focus:outline-none"
                  />
                  <p className="text-[11px] text-muted mt-1">
                    Used for logging into this admin panel. Hashed securely with bcrypt.
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Shop Details
                </button>
              </form>
            </div>

            {/* Desktop Agent Setup & Realtime Pusher Connection */}
            <div className="rounded-2xl border border-brand-200 bg-brand-50/20 p-5 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-brand-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-brand-600 flex-shrink-0" />
                    <h3 className="text-base font-bold text-ink">Agent setup</h3>
                  </div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    Enter your shop credentials, then choose the printers this workstation should use.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('open-agent-troubleshoot-guide'))
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-paper active:scale-95 transition-all cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-brand-600" />
                    <span>Troubleshoot Guide</span>
                  </button>

                  <button
                    type="button"
                    onClick={copyAllAgentConfig}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-brand-700 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'all' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-white" />
                        <span>Copied All!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy All Agent Config</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 1. Shop credentials */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-900">
                    1
                  </span>
                  Shop credentials
                </h4>

                <div className="space-y-2.5">
                  {/* Shop ID */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">
                      Shop ID
                    </label>
                    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                      <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                        {shop.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => copySetting(shop.id, 'shopId')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                      >
                        {copiedKey === 'shopId' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success-600" />
                            <span className="text-success-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Access Token */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-medium text-muted">
                        Access token
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateToken}
                        disabled={regeneratingToken}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-danger-600"
                        title="Regenerate this token if compromised"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${regeneratingToken ? 'animate-spin' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                      <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                        {showAgentToken
                          ? shop.agent_auth_token || 'demo-agent-auth-token-12345'
                          : '•'.repeat(32)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAgentToken(!showAgentToken)}
                        className="text-muted hover:text-ink p-1 rounded hover:bg-paper"
                        title={showAgentToken ? 'Hide token' : 'Show token'}
                      >
                        {showAgentToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copySetting(shop.agent_auth_token || 'demo-agent-auth-token-12345', 'token')
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                      >
                        {copiedKey === 'token' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success-600" />
                            <span className="text-success-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Realtime connection (Pusher) */}
              <div className="space-y-3 pt-3 border-t border-brand-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-ink flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-200 text-[10px] font-bold text-brand-900">
                      2
                    </span>
                    Realtime connection
                  </h4>
                  <span className="text-[10px] font-semibold text-brand-700 bg-brand-100/60 px-2 py-0.5 rounded-full">
                    Shop-wise Isolated
                  </span>
                </div>

                <form onSubmit={handleSavePusher} className="space-y-3">
                  {/* Pusher app key */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">
                      Pusher app key
                    </label>
                    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 shadow-2xs">
                      <input
                        type="text"
                        value={pusherAppKey}
                        onChange={(e) => setPusherAppKey(e.target.value)}
                        placeholder="2e5517c16c8d36b2969d"
                        className="flex-1 font-mono text-xs text-ink bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copySetting(pusherAppKey, 'pusherKey')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                      >
                        {copiedKey === 'pusherKey' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success-600" />
                            <span className="text-success-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pusher cluster */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">
                      Pusher cluster
                    </label>
                    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 shadow-2xs">
                      <input
                        type="text"
                        value={pusherCluster}
                        onChange={(e) => setPusherCluster(e.target.value)}
                        placeholder="ap2"
                        className="flex-1 font-mono text-xs text-ink bg-transparent focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => copySetting(pusherCluster, 'cluster')}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                      >
                        {copiedKey === 'cluster' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success-600" />
                            <span className="text-success-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Auth endpoint URL */}
                  <div>
                    <label className="block text-[11px] font-medium text-muted mb-1">
                      Auth endpoint URL
                    </label>
                    <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 shadow-2xs">
                      <span className="flex-1 font-mono text-xs text-ink truncate select-all">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copySetting(
                            `${typeof window !== 'undefined' ? window.location.origin : ''}/api/pusher/auth`,
                            'authEndpoint'
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 px-2 py-0.5 rounded hover:bg-brand-50"
                      >
                        {copiedKey === 'authEndpoint' ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-success-600" />
                            <span className="text-success-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Backend Credentials for Event Signing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-muted mb-1">
                        Pusher App ID (Server Trigger)
                      </label>
                      <input
                        type="text"
                        value={pusherAppId}
                        onChange={(e) => setPusherAppId(e.target.value)}
                        placeholder="e.g. 1827364"
                        className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink placeholder:font-sans focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-muted">
                          Pusher Secret Key
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPusherSecret(!showPusherSecret)}
                          className="text-[10px] font-semibold text-muted hover:text-ink"
                        >
                          {showPusherSecret ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        type={showPusherSecret ? 'text' : 'password'}
                        value={pusherSecret}
                        onChange={(e) => setPusherSecret(e.target.value)}
                        placeholder="Pusher Secret"
                        className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-muted">
                      Configure your shop&apos;s custom Pusher credentials to isolate customer print events.
                    </p>
                    <button
                      type="submit"
                      disabled={savingPusher}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-ink/80 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{savingPusher ? 'Saving…' : 'Save Pusher Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ================= PAYMENT METHODS & GATEWAY CONFIGURATION ================= */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs space-y-5">
              <div>
                <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  <span>Customer Payment Methods (Checkout Options)</span>
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Control which payment methods are available to your customers during upload checkout.
                </p>
              </div>

              {/* 3 Payment Method Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Pay at Counter (Cash) */}
                <div
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    shop.enable_counter_pay !== false
                      ? 'border-line bg-paper/60'
                      : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
                          ₹
                        </div>
                        <span className="text-xs font-bold text-ink">Pay at Counter</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          shop.enable_counter_pay !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {shop.enable_counter_pay !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Customer pays cash at your counter when picking up their prints.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted">Cash / Offline</span>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('counter')}
                      disabled={savingGateway}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        shop.enable_counter_pay !== false
                          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {shop.enable_counter_pay !== false ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                          <span>Turn OFF</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-white" />
                          <span>Turn ON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. UPI Pay (Deeplink) */}
                <div
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    shop.enable_upi_pay !== false
                      ? 'border-line bg-paper/60'
                      : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700 text-xs font-bold">
                          UPI
                        </div>
                        <span className="text-xs font-bold text-ink">UPI Pay</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          shop.enable_upi_pay !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {shop.enable_upi_pay !== false ? 'Active (ON)' : 'Disabled (OFF)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Instant 1-tap app intent opening GPay, PhonePe, Paytm, BHIM with dynamic QR.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted">VPA: {shop.upi_vpa || 'Not set'}</span>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('upi')}
                      disabled={savingGateway}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        shop.enable_upi_pay !== false
                          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {shop.enable_upi_pay !== false ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                          <span>Turn OFF</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-white" />
                          <span>Turn ON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. Online Pay (Cashfree Gateway) */}
                <div
                  className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                    shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false
                      ? 'border-[#536DFE]/40 bg-[#536DFE]/5'
                      : 'border-slate-200 bg-slate-50/70 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#536DFE] text-white text-xs font-black">
                          CF
                        </div>
                        <span className="text-xs font-bold text-ink">Online Pay</span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false
                          ? 'Active (ON)'
                          : 'Disabled (OFF)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">
                      Cards, NetBanking, Wallets, and verified UPI gateway powered by Cashfree.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted">Cashfree Gateway</span>
                    <button
                      type="button"
                      onClick={() => togglePaymentMethod('online')}
                      disabled={savingGateway}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                        shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false
                          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {shop.enable_online_pay !== false && shop.payment_gateway_enabled !== false ? (
                        <>
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                          <span>Turn OFF</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4 text-white" />
                          <span>Turn ON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Cashfree Payment Gateway Credentials Configuration */}
              <div className="mt-4 pt-4 border-t border-line space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#536DFE] text-white text-[10px] font-black">
                      CF
                    </div>
                    <span className="text-xs font-bold text-ink">Cashfree API Gateway Credentials</span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted bg-paper px-2 py-0.5 rounded border border-line">
                    Mode: {cashfreeEnv === 'production' ? 'Live / Production' : 'Sandbox / Test'}
                  </span>
                </div>

                <form onSubmit={handleSaveCashfree} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-muted mb-1">
                        Environment Mode
                      </label>
                      <select
                        value={cashfreeEnv}
                        onChange={(e) => setCashfreeEnv(e.target.value as any)}
                        className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink focus:outline-none"
                      >
                        <option value="sandbox">Sandbox (Testing / Pre-production)</option>
                        <option value="production">Production (Real Money / Live)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-muted mb-1">
                        Cashfree App ID (Client ID)
                      </label>
                      <input
                        type="text"
                        value={cashfreeAppId}
                        onChange={(e) => setCashfreeAppId(e.target.value)}
                        placeholder="e.g. TEST1038472910..."
                        className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink placeholder:font-sans focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] font-medium text-muted">
                          Cashfree Secret Key
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCashfreeSecret(!showCashfreeSecret)}
                          className="text-[10px] font-semibold text-muted hover:text-ink"
                        >
                          {showCashfreeSecret ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      <input
                        type={showCashfreeSecret ? 'text' : 'password'}
                        value={cashfreeSecretKey}
                        onChange={(e) => setCashfreeSecretKey(e.target.value)}
                        placeholder="cfsk_ma_test_..."
                        className="w-full rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-mono text-ink focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-muted">
                      Leave blank to use the system default gateway credentials, or enter your shop&apos;s own Cashfree Merchant API keys.
                    </p>
                    <button
                      type="submit"
                      disabled={savingCashfree}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>{savingCashfree ? 'Saving…' : 'Save Cashfree Credentials'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* ================= PRINT SERVICES VISIBILITY & TOGGLES ================= */}
            <div className="rounded-2xl border border-line bg-white p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    <Printer className="h-4 w-4 text-brand-600" />
                    <span>Print Services Visibility (Turn Services On / Off)</span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Instantly hide or show specific print services from the customer upload selection menu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <span>Manage Pricing</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                      it.is_active !== false
                        ? 'border-line bg-paper/50'
                        : 'border-slate-200 bg-slate-50 opacity-70'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-ink truncate block">
                          {it.display_name}
                        </span>
                        <span
                          className={`inline-block h-1.5 w-1.5 rounded-full ${
                            it.is_active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-muted block">
                        {it.category} &bull; {formatRupees(it.price_bw)} B&amp;W
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleItemActive(it)}
                      disabled={togglingItemId === it.id}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all shadow-2xs flex-shrink-0 cursor-pointer ${
                        it.is_active !== false
                          ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          : 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {it.is_active !== false ? (
                        <>
                          <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Turn OFF</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-3.5 w-3.5 text-white" />
                          <span>Turn ON</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD / EDIT RATE CARD ITEM ================= */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line animate-rise space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {editingItem ? 'Edit Print Service' : 'Add New Print Service'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Service Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Document Print (A4)"
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Category</label>
                  <input
                    type="text"
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    placeholder="Standard Print"
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Pricing Model</label>
                  <select
                    value={itemModel}
                    onChange={(e) => setItemModel(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    <option value="per_page">Per Page</option>
                    <option value="flat_fee">Flat Fee</option>
                    <option value="per_copy">Per Copy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-line bg-paper p-3">
                  <label className="block text-[11px] font-semibold text-muted mb-1">
                    B&W Rate (&#8377;) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={itemPriceBw}
                    onChange={(e) => setItemPriceBw(e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold text-ink focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-line bg-paper p-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-muted">
                      Color Rate (&#8377;)
                    </label>
                    <input
                      type="checkbox"
                      checked={itemHasColor}
                      onChange={(e) => setItemHasColor(e.target.checked)}
                      title="Enable color printing for this service"
                    />
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    disabled={!itemHasColor}
                    value={itemHasColor ? itemPriceColor : ''}
                    onChange={(e) => setItemPriceColor(e.target.value)}
                    placeholder={itemHasColor ? '8.00' : 'N/A'}
                    className="w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm font-semibold text-ink disabled:opacity-40 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-paper p-3">
                <div>
                  <p className="text-xs font-semibold text-ink">Supports Duplex (Double Sided)</p>
                  <p className="text-[11px] text-muted">Customer can pick double-sided print</p>
                </div>
                <input
                  type="checkbox"
                  checked={itemDuplex}
                  onChange={(e) => setItemDuplex(e.target.checked)}
                  className="h-4 w-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
                >
                  {editingItem ? 'Update Service' : 'Add Service'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="rounded-xl border border-line px-4 py-2.5 text-xs font-medium text-muted hover:bg-paper"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT BANNER ================= */}
      {showBannerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-line animate-rise space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-bold text-ink">
                {editingBanner ? 'Edit Banner Offer' : 'Add New Banner Offer'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBannerModal(false)}
                className="text-muted hover:text-ink text-sm p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Banner Headline / Title *
                </label>
                <input
                  type="text"
                  required
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. ⚡ Express Project Binding 15% OFF"
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm text-ink focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  placeholder="e.g. Spiral and softbound covers ready in 15 mins for college submissions."
                  className="w-full rounded-xl border border-line bg-white px-3.5 py-2 text-xs text-ink focus:border-brand-600 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Badge Tag (e.g. OFFER)
                  </label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="FASTEST"
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Badge Color</label>
                  <select
                    value={bannerBadgeColor}
                    onChange={(e) => setBannerBadgeColor(e.target.value as any)}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    <option value="marigold">Marigold Yellow</option>
                    <option value="success">Emerald Green</option>
                    <option value="brand">Brand Navy</option>
                    <option value="accent">Purple Accent</option>
                    <option value="danger">Crimson Red</option>
                  </select>
                </div>
              </div>

              {/* Optional Image Banner (imgbb.com or direct upload) */}
              <div className="rounded-xl border border-line bg-paper/60 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-brand-600" />
                    <div>
                      <span className="text-xs font-bold text-ink block">
                        Optional Banner Image (ImgBB / URL / Upload)
                      </span>
                      <span className="text-[10px] text-muted">
                        Paste an image link from imgbb.com or upload directly from device
                      </span>
                    </div>
                  </div>
                  {bannerImageUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerImageUrl('')}
                      className="text-[11px] text-danger-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {/* Hidden native image input */}
                <input
                  ref={bannerImageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUploadBannerImage(file)
                  }}
                />

                {/* Input and upload action buttons */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bannerImageUrl}
                    onChange={(e) => setBannerImageUrl(sanitizeImageUrl(e.target.value))}
                    placeholder="https://i.ibb.co/xyz/banner.jpg"
                    className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink focus:border-brand-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isUploadingBannerImg}
                    onClick={() => bannerImageInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors cursor-pointer shadow-2xs whitespace-nowrap disabled:opacity-60"
                  >
                    {isUploadingBannerImg ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>{isUploadingBannerImg ? 'Uploading…' : 'Choose File'}</span>
                  </button>
                </div>

                {/* Direct ImgBB Upload & API Key Setup */}
                <div className="rounded-lg bg-white p-2.5 border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-ink flex items-center gap-1">
                      <Key className="h-3 w-3 text-brand-600" />
                      ImgBB Upload API Key
                    </span>
                    <a
                      href="https://api.imgbb.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-brand-600 hover:underline font-semibold flex items-center gap-0.5"
                    >
                      Get Free Key at api.imgbb.com
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      value={imgbbApiKey}
                      onChange={(e) => {
                        const val = e.target.value
                        setImgbbApiKey(val)
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('smartprint_imgbb_api_key', val)
                        }
                      }}
                      placeholder="Paste your ImgBB API Key here (auto-saved)..."
                      className="flex-1 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink focus:border-brand-600 focus:outline-none"
                    />
                    {imgbbApiKey && (
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 flex items-center">
                        Saved
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted pt-0.5">
                  <span>Supported: Upload directly to ImgBB, or paste any i.ibb.co direct image link</span>
                  <a
                    href="https://imgbb.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    <span>Open ImgBB.com</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                {/* Live Preview if Image URL is active */}
                {bannerImageUrl && (
                  <div className="relative h-24 w-full rounded-xl overflow-hidden border border-line shadow-xs">
                    <img
                      src={bannerImageUrl}
                      alt="Banner Preview"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 flex flex-col justify-end">
                      <span className="text-white font-bold text-xs truncate drop-shadow-xs">
                        {bannerTitle || 'Preview Title'}
                      </span>
                      {bannerSubtitle && (
                        <span className="text-white/80 text-[10px] truncate">
                          {bannerSubtitle}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Gradient Color Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBannerGradient('from-[#2C3A6B] via-[#212C52] to-[#16181D]')}
                    className={`h-9 rounded-lg bg-gradient-to-r from-[#2C3A6B] via-[#212C52] to-[#16181D] border-2 transition-all ${
                      bannerGradient.includes('#2C3A6B') ? 'border-marigold-500 scale-105' : 'border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setBannerGradient('from-[#175432] via-[#103D24] to-[#0A2617]')}
                    className={`h-9 rounded-lg bg-gradient-to-r from-[#175432] via-[#103D24] to-[#0A2617] border-2 transition-all ${
                      bannerGradient.includes('#175432') ? 'border-marigold-500 scale-105' : 'border-transparent'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setBannerGradient('from-[#581C87] via-[#3B0764] to-[#1E0436]')}
                    className={`h-9 rounded-lg bg-gradient-to-r from-[#581C87] via-[#3B0764] to-[#1E0436] border-2 transition-all ${
                      bannerGradient.includes('#581C87') ? 'border-marigold-500 scale-105' : 'border-transparent'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors"
                >
                  {editingBanner ? 'Update Banner' : 'Add Banner'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBannerModal(false)}
                  className="rounded-xl border border-line px-4 py-2.5 text-xs font-medium text-muted hover:bg-paper"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
