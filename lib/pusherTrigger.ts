import 'server-only'
import { md5 } from 'js-md5'

export interface PusherCredentials {
  appId?: string
  key?: string
  secret?: string
  cluster?: string
}

interface TriggerParams {
  channel: string
  event: string
  data: unknown
  credentials?: PusherCredentials
}

/**
 * Publishes an event to a Pusher channel using Pusher's plain REST API,
 * signed by hand. We do this instead of pulling in pusher's official
 * Node SDK because that SDK assumes the Node.js `crypto` module, which
 * isn't available in Cloudflare's Edge runtime. This implementation only
 * needs Web Crypto (for HMAC-SHA256) and a small pure-JS MD5 helper (for
 * the required body hash), both of which work on any edge runtime.
 */
export function isConfiguredPusher(credentials?: PusherCredentials): boolean {
  const appId = credentials?.appId || process.env.PUSHER_APP_ID
  const key = credentials?.key || process.env.PUSHER_KEY
  const secret = credentials?.secret || process.env.PUSHER_SECRET
  const cluster = credentials?.cluster || process.env.PUSHER_CLUSTER

  if (!appId || !key || !secret || !cluster) return false

  const isPlaceholder = (val: string) => {
    const lower = val.toLowerCase().trim()
    return (
      lower.startsWith('your-') ||
      lower.includes('placeholder') ||
      lower.includes('example') ||
      lower === 'none' ||
      lower === 'test'
    )
  }

  if (isPlaceholder(appId) || isPlaceholder(key) || isPlaceholder(secret)) {
    return false
  }

  return true
}

export async function triggerPusherEvent({ channel, event, data, credentials }: TriggerParams): Promise<void> {
  const appId = credentials?.appId || process.env.PUSHER_APP_ID
  const key = credentials?.key || process.env.PUSHER_KEY
  const secret = credentials?.secret || process.env.PUSHER_SECRET
  const cluster = credentials?.cluster || process.env.PUSHER_CLUSTER || 'ap2'

  if (!isConfiguredPusher({ appId, key, secret, cluster })) {
    // In local demo or unconfigured environment, skip external Pusher trigger smoothly
    return
  }

  try {
    const body = JSON.stringify({
      name: event,
      channel,
      data: JSON.stringify(data),
    })

    const bodyMd5 = md5(body)
    const authTimestamp = Math.floor(Date.now() / 1000).toString()
    const path = `/apps/${appId}/events`

    const paramsToSign = new URLSearchParams({
      auth_key: key!,
      auth_timestamp: authTimestamp,
      auth_version: '1.0',
      body_md5: bodyMd5,
    })
    // Pusher requires the query params sorted alphabetically by key when
    // building the string to sign.
    const sortedParams = Array.from(paramsToSign.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const stringToSign = `POST\n${path}\n${sortedParams}`
    const signature = await hmacSha256Hex(secret!, stringToSign)

    const url = `https://api-${cluster}.pusher.com${path}?${sortedParams}&auth_signature=${signature}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.warn(`[Pusher] Event trigger not delivered (${res.status}): ${text}`)
    }
  } catch (err) {
    console.warn('[Pusher] Event trigger network error:', err)
  }
}

/**
 * Signs a Pusher private-channel or presence-channel subscription.
 * If channelData is provided, signs with `${socketId}:${channelName}:${channelData}`
 * as required by Pusher for presence channels.
 * See /app/api/pusher/auth/route.ts.
 */
export async function signChannelAuth(
  socketId: string,
  channelName: string,
  credentials?: { key?: string; secret?: string },
  channelData?: string
): Promise<string> {
  const key = credentials?.key || process.env.PUSHER_KEY
  const secret = credentials?.secret || process.env.PUSHER_SECRET

  if (!key || !secret) {
    return `mock-key:mock-signature-${socketId}`
  }

  try {
    const stringToSign = channelData
      ? `${socketId}:${channelName}:${channelData}`
      : `${socketId}:${channelName}`
    const signature = await hmacSha256Hex(secret, stringToSign)
    return `${key}:${signature}`
  } catch (err) {
    return `mock-key:mock-signature-${socketId}`
  }
}

/**
 * Queries Pusher REST API for channel information (e.g. occupancy, subscription count).
 */
export async function getPusherChannelInfo(
  channel: string,
  credentials?: PusherCredentials
): Promise<{
  occupied: boolean
  user_count?: number
  subscription_count?: number
} | null> {
  const appId = credentials?.appId || process.env.PUSHER_APP_ID
  const key = credentials?.key || process.env.PUSHER_KEY
  const secret = credentials?.secret || process.env.PUSHER_SECRET
  const cluster = credentials?.cluster || process.env.PUSHER_CLUSTER || 'ap2'

  if (!isConfiguredPusher({ appId, key, secret, cluster })) {
    return null
  }

  try {
    const authTimestamp = Math.floor(Date.now() / 1000).toString()
    const path = `/apps/${appId}/channels/${channel}`
    const isPresence = channel.startsWith('presence-')
    const info = isPresence ? 'user_count' : 'subscription_count'

    const paramsToSign = new URLSearchParams({
      auth_key: key!,
      auth_timestamp: authTimestamp,
      auth_version: '1.0',
      info,
    })
    const sortedParams = Array.from(paramsToSign.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${k}=${v}`)
      .join('&')

    const stringToSign = `GET\n${path}\n${sortedParams}`
    const signature = await hmacSha256Hex(secret!, stringToSign)

    const url = `https://api-${cluster}.pusher.com${path}?${sortedParams}&auth_signature=${signature}`
    const res = await fetch(url, { method: 'GET' })
    if (res.ok) {
      return (await res.json()) as {
        occupied: boolean
        user_count?: number
        subscription_count?: number
      }
    }
    return null
  } catch (err) {
    console.warn('[Pusher] Failed to query channel info:', err)
    return null
  }
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
