import { createHmac, timingSafeEqual } from 'node:crypto'

import { NextResponse, type NextRequest } from 'next/server'

import {
  processWebhookEvent,
  type TossWebhookEvent,
} from '../../../../lib/subscription/webhook'

function getWebhookSecret(): string {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('TOSS_WEBHOOK_SECRET is required')
  }

  return secret
}

function isValidWebhookSignature(payload: string, signature: string): boolean {
  const digest = createHmac('sha256', getWebhookSecret())
    .update(payload)
    .digest('hex')

  const given = Buffer.from(signature)
  const expected = Buffer.from(digest)

  if (given.length !== expected.length) {
    return false
  }

  return timingSafeEqual(given, expected)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const rawBody = await req.text()
  const signature =
    req.headers.get('Tosspayments-Signature') ??
    req.headers.get('x-toss-signature')

  if (!signature || !isValidWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }

  const event = JSON.parse(rawBody) as TossWebhookEvent
  await processWebhookEvent(event)

  return NextResponse.json({ ok: true }, { status: 200 })
}
