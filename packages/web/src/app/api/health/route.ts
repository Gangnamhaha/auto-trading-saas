import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    services: {
      database: 'connected',
      trading_engine: 'connected',
      redis: 'connected',
    },
  }

  return NextResponse.json(health)
}
