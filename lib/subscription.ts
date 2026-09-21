import { Shop } from './types'

export interface TrialStatus {
  isLocked: boolean
  isTrial: boolean
  isExpired: boolean
  daysRemaining: number
  hoursRemaining: number
  trialEndsAt: Date
  status: 'trialing' | 'active' | 'expired' | 'suspended'
  label: string
}

export const TRIAL_DAYS_DEFAULT = 15

/**
 * Evaluates whether a shop is in active trial, active paid subscription, or locked/expired.
 */
export function getShopTrialStatus(shop?: Partial<Shop> | null): TrialStatus {
  const now = Date.now()
  if (!shop) {
    return {
      isLocked: true,
      isTrial: true,
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      trialEndsAt: new Date(now),
      status: 'expired',
      label: 'Shop Unavailable',
    }
  }

  const rawStatus = shop.subscription_status || 'trialing'

  // 1. Explicit Active Plan (Paid / Pro / Enterprise)
  if (rawStatus === 'active') {
    return {
      isLocked: false,
      isTrial: false,
      isExpired: false,
      daysRemaining: 999,
      hoursRemaining: 999 * 24,
      trialEndsAt: new Date(now + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      label: 'Active Plan',
    }
  }

  // 2. Explicitly Suspended by Admin
  if (rawStatus === 'suspended') {
    return {
      isLocked: true,
      isTrial: false,
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      trialEndsAt: new Date(now),
      status: 'suspended',
      label: 'Account Suspended',
    }
  }

  // 3. Explicitly Expired
  if (rawStatus === 'expired') {
    return {
      isLocked: true,
      isTrial: true,
      isExpired: true,
      daysRemaining: 0,
      hoursRemaining: 0,
      trialEndsAt: new Date(shop.trial_ends_at || now),
      status: 'expired',
      label: 'Trial Expired',
    }
  }

  // 4. Trial evaluation based on trial_ends_at or created_at + 15 days
  let endsTime: number

  if (shop.trial_ends_at) {
    endsTime = new Date(shop.trial_ends_at).getTime()
  } else if (shop.created_at) {
    endsTime = new Date(shop.created_at).getTime() + TRIAL_DAYS_DEFAULT * 24 * 60 * 60 * 1000
  } else {
    // If neither exists (e.g. fresh unsaved shop in demo), default to 15 days from now
    endsTime = now + TRIAL_DAYS_DEFAULT * 24 * 60 * 60 * 1000
  }

  const diffMs = endsTime - now
  const isExpired = diffMs <= 0
  const isLocked = isExpired

  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))

  let label = ''
  if (isExpired) {
    label = 'Trial Expired'
  } else if (daysRemaining === 1) {
    label = '1 Day Left in Trial'
  } else {
    label = `${daysRemaining} Days Left in Trial`
  }

  return {
    isLocked,
    isTrial: true,
    isExpired,
    daysRemaining,
    hoursRemaining,
    trialEndsAt: new Date(endsTime),
    status: isExpired ? 'expired' : 'trialing',
    label,
  }
}
