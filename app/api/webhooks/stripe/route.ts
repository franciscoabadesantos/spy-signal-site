import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StripeEvent = {
  id?: string
  type?: string
  data?: {
    object?: unknown
  }
}

type CheckoutSession = {
  id?: string
  client_reference_id?: string | null
  customer?: string | { id?: string } | null
  subscription?: string | { id?: string } | null
  metadata?: Record<string, string | undefined> | null
}

type ParsedStripeSignature = {
  timestamp: number
  v1Signatures: string[]
}

const DEFAULT_TOLERANCE_SECONDS = 5 * 60

function parseStripeSignatureHeader(value: string | null): ParsedStripeSignature | null {
  if (!value) return null

  const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
  let timestamp: number | null = null
  const v1Signatures: string[] = []

  for (const part of parts) {
    const [key, rawValue] = part.split('=')
    if (!key || !rawValue) continue
    if (key === 't') {
      const parsed = Number(rawValue)
      if (Number.isFinite(parsed)) timestamp = Math.trunc(parsed)
      continue
    }
    if (key === 'v1') v1Signatures.push(rawValue)
  }

  if (!timestamp || v1Signatures.length === 0) return null
  return { timestamp, v1Signatures }
}

function computeStripeSignature({
  payload,
  secret,
  timestamp,
}: {
  payload: string
  secret: string
  timestamp: number
}): string {
  const signedPayload = `${timestamp}.${payload}`
  return createHmac('sha256', secret).update(signedPayload, 'utf8').digest('hex')
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const leftBuffer = Buffer.from(left, 'hex')
    const rightBuffer = Buffer.from(right, 'hex')
    if (leftBuffer.length === 0 || rightBuffer.length === 0) return false
    if (leftBuffer.length !== rightBuffer.length) return false
    return timingSafeEqual(leftBuffer, rightBuffer)
  } catch {
    return false
  }
}

function isStripeSignatureValid({
  payload,
  signatureHeader,
  webhookSecret,
  toleranceSeconds,
}: {
  payload: string
  signatureHeader: string | null
  webhookSecret: string
  toleranceSeconds: number
}): boolean {
  const parsed = parseStripeSignatureHeader(signatureHeader)
  if (!parsed) return false

  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - parsed.timestamp) > toleranceSeconds) return false

  const expected = computeStripeSignature({
    payload,
    secret: webhookSecret,
    timestamp: parsed.timestamp,
  })

  return parsed.v1Signatures.some((provided) => safeEqualHex(provided, expected))
}

function readStringId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (!value || typeof value !== 'object') return null
  const candidate = (value as { id?: unknown }).id
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null
}

function readCheckoutUserId(session: CheckoutSession): string | null {
  if (typeof session.client_reference_id === 'string' && session.client_reference_id.trim()) {
    return session.client_reference_id.trim()
  }

  const metadata = session.metadata ?? null
  if (!metadata) return null

  const candidate = metadata.clerk_user_id ?? metadata.clerkUserId ?? metadata.user_id
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null
}

async function activateProPlan(session: CheckoutSession): Promise<void> {
  const userId = readCheckoutUserId(session)
  if (!userId) {
    console.warn('Stripe webhook: missing Clerk user id in checkout session.')
    return
  }

  const customerId = readStringId(session.customer)
  const subscriptionId = readStringId(session.subscription)
  const checkoutSessionId = readStringId(session.id)

  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      plan: 'pro',
    },
    privateMetadata: {
      stripeCustomerId: customerId ?? undefined,
      stripeSubscriptionId: subscriptionId ?? undefined,
      stripeLastCheckoutSessionId: checkoutSessionId ?? undefined,
      stripeLastCheckoutAt: new Date().toISOString(),
    },
  })
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is missing.' }, { status: 500 })
  }

  const toleranceEnv = Number(process.env.STRIPE_WEBHOOK_TOLERANCE_SECONDS)
  const toleranceSeconds =
    Number.isFinite(toleranceEnv) && toleranceEnv > 0
      ? Math.floor(toleranceEnv)
      : DEFAULT_TOLERANCE_SECONDS

  const signatureHeader = request.headers.get('stripe-signature')
  const payload = await request.text()

  const validSignature = isStripeSignatureValid({
    payload,
    signatureHeader,
    webhookSecret,
    toleranceSeconds,
  })

  if (!validSignature) {
    return NextResponse.json({ error: 'Invalid Stripe signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe payload JSON.' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await activateProPlan((event.data?.object ?? {}) as CheckoutSession)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error'
    console.error('Stripe webhook handling failed:', message)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true, eventId: event.id ?? null })
}
