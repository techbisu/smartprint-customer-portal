'use client'

import { ShopBanner } from '@/lib/types'
import { useState, useEffect, useRef, TouchEvent } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Tag, ArrowRight } from 'lucide-react'

interface Props {
  banners: ShopBanner[]
}

export default function BannerSlider({ banners }: Props) {
  // If no banners provided or active, show default curated offers
  const activeBanners = banners.filter((b) => b.is_active)
  const displayBanners = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'default-1',
      shop_id: 'default',
      title: '⚡ Express Direct Counter Print',
      subtitle: 'Upload straight from your mobile — No WhatsApp, No pendrive, No file transfer delays!',
      badge: 'FASTEST',
      badge_color: 'marigold' as const,
      bg_gradient: 'from-[#2C3A6B] via-[#212C52] to-[#16181D]',
      is_active: true,
      sort_order: 1,
    },
    {
      id: 'default-2',
      shop_id: 'default',
      title: '🎓 College Project & Thesis Binding',
      subtitle: 'Spiral & Hardbound binding ready in 15 minutes with crystal gloss covers.',
      badge: 'STUDENT OFFER',
      badge_color: 'success' as const,
      bg_gradient: 'from-[#175432] via-[#103D24] to-[#0A2617]',
      is_active: true,
      sort_order: 2,
    },
    {
      id: 'default-3',
      shop_id: 'default',
      title: '🪪 Smart ID Cards & Crystal Lamination',
      subtitle: '250-micron heat sealed waterproof lamination for PAN, Aadhaar & College IDs.',
      badge: 'POPULAR',
      badge_color: 'accent' as const,
      bg_gradient: 'from-[#581C87] via-[#3B0764] to-[#1E0436]',
      is_active: true,
      sort_order: 3,
    },
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Auto-play every 4.5 seconds
  useEffect(() => {
    if (displayBanners.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [displayBanners.length, isPaused])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length)
  }

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    setIsPaused(true)
  }

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) {
      setIsPaused(false)
      return
    }
    const distance = touchStartX.current - touchEndX.current
    if (distance > 50) {
      nextSlide()
    } else if (distance < -50) {
      prevSlide()
    }
    touchStartX.current = null
    touchEndX.current = null
    setIsPaused(false)
  }

  const getBadgeClasses = (color?: string) => {
    switch (color) {
      case 'marigold':
        return 'bg-marigold-500 text-ink'
      case 'success':
        return 'bg-success-500 text-white'
      case 'danger':
        return 'bg-danger-500 text-white'
      case 'accent':
        return 'bg-purple-500 text-white'
      case 'brand':
      default:
        return 'bg-brand-500 text-white'
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-md select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {displayBanners.map((banner) => (
          <div
            key={banner.id}
            className={`min-w-full relative overflow-hidden p-4 sm:p-5 text-white bg-gradient-to-br ${
              banner.bg_gradient || 'from-[#2C3A6B] via-[#212C52] to-[#16181D]'
            }`}
          >
            {/* If banner has an external image URL (e.g. ImgBB / direct link), render as background cover */}
            {banner.image_url && (
              <div className="absolute inset-0 z-0">
                <img
                  src={banner.image_url}
                  alt={banner.title || 'Shop Banner'}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                {/* Dark readability overlay for title & badges */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/20" />
              </div>
            )}

            {/* Background geometric accents (shown when no image is loaded) */}
            {!banner.image_url && (
              <>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
                <div className="absolute top-2 right-4 text-white/10 font-black text-6xl tracking-tighter pointer-events-none select-none">
                  PRINT
                </div>
              </>
            )}

            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between gap-2">
                {banner.badge ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase shadow-2xs ${getBadgeClasses(
                      banner.badge_color
                    )}`}
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {banner.badge}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                    <Sparkles className="h-3 w-3 text-marigold-400" />
                    Special Service
                  </span>
                )}

                <span className="text-[10px] font-mono text-white/70 bg-black/30 px-1.5 py-0.5 rounded-full backdrop-blur-xs">
                  {currentIndex + 1}/{displayBanners.length}
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold leading-snug tracking-tight text-white drop-shadow-xs">
                  {banner.title}
                </h3>
                {banner.subtitle && (
                  <p className="mt-1 text-xs text-white/90 leading-relaxed font-normal line-clamp-2 drop-shadow-xs">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Controls (Left & Right chevrons) */}
      {displayBanners.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xs hover:bg-black/50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots Pagination */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-20">
            {displayBanners.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
