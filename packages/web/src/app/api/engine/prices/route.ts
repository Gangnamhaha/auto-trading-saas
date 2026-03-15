import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol') ?? '005930'
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let count = 0
      const basePrice = 70000
      const interval = setInterval(() => {
        const change = (Math.random() - 0.5) * 200
        const price = Math.round(basePrice + change)
        const data = JSON.stringify({
          symbol,
          price,
          volume: Math.round(Math.random() * 1000),
          timestamp: new Date().toISOString(),
        })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        count++
        if (count > 100) {
          clearInterval(interval)
          controller.close()
        }
      }, 1000)
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
