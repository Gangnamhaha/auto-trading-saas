import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json([
    {
      id: 'weekly-blog',
      type: 'blog',
      schedule: '매주 월요일 09:00',
      status: 'completed',
    },
    { id: 'daily-sns', type: 'sns', schedule: '매일 18:00', status: 'pending' },
    {
      id: 'weekly-newsletter',
      type: 'newsletter',
      schedule: '매주 금요일 17:00',
      status: 'completed',
    },
    {
      id: 'daily-report',
      type: 'report',
      schedule: '매일 09:30',
      status: 'completed',
    },
  ])
}
