import { NextResponse, type NextRequest } from 'next/server'

import { getCurrentUser } from '../../../../lib/subscription/middleware'
import { getSubscriptionStatus } from '../../../../lib/subscription/service'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const user = await getCurrentUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const subscription = await getSubscriptionStatus(user.id)
  return NextResponse.json({ subscription }, { status: 200 })
}
