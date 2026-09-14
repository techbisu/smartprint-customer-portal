import 'server-only'
import { md5 } from 'js-md5'

interface TriggerParams {
  channel: string
  event: string
  data: unknown
}

/**
 * Publishes an event to a Pusher channel using Pusher's plain REST API,
 * signed by hand. We do this instead of pulling in pusher's official
 * Node SDK because that SDK assumes the Node.js `crypto` module, which
 * isn't available in Cloudflare's Edge runtime. This implementation only
 * needs Web Crypto (for HMAC-SHA256) and a small pure-JS MD5 helper (for
 * the required body hash), both of which work on any edge runtime.
 */
export async function triggerPusherEvent({ channel, event, data }: TriggerParams): Promise<void> {
  const appId = process.env.PUSHER_APP_ID!
  const key = process.env.PUSHER_KEY!
  const secret = process.env.PUSHER_SECRET!
  const cluster = process.env.PUSHER_CLUSTER!

  const body = JSON.stringify({
    name: event,
    channel,
    data: JSON.stringify(data),
  })

  const bodyMd5 = md5(body)
  const authTimestamp = Math.floor(Date.now() / 1000).toString()
  const path = `/apps/${appId}/events`

  const paramsToSign = new URLSearchParams({
    auth_key: key,
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
  const signature = await hmacSha256Hex(secret, stringToSign)

  const url = `https://api-${cluster}.pusher.com${path}?${sortedParams}&auth_signature=${signature}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Pusher trigger failed (${res.status}): ${text}`)
  }
}

/**
 * Signs a Pusher private-channel subscription for the desktop agent's
 * auth endpoint. See /app/api/pusher/auth/route.ts.
 */
export async function signChannelAuth(socketId: string, channelName: string): Promise<string> {
  const key = process.env.PUSHER_KEY!
  const secret = process.env.PUSHER_SECRET!

  const stringToSign = `${socketId}:${channelName}`
  const signature = await hmacSha256Hex(secret, stringToSign)
  return `${key}:${signature}`
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
