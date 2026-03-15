import { NextResponse, type NextRequest } from 'next/server'

import { getCurrentUser } from '../../../../lib/subscription/middleware'
import { cancelSubscription } from '../../../../lib/subscription/service'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await cancelSubscription(user.id)

  return NextResponse.json(
    {
      ok: true,
      message: 'Subscription will remain active until the period end.',
    },
    { status: 200 }
  )
}
