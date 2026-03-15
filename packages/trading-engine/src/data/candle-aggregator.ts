import type { Candle, CandleCallback, MarketTick, TimeFrame } from './types'

export class CandleAggregator {
  private currentCandles: Map<string, Candle> = new Map()

  constructor(
    private timeFrames: TimeFrame[] = ['1m', '5m', '1d'],
    private onCandleClose: CandleCallback
  ) {}

  processTick(tick: MarketTick): void {
    for (const tf of this.timeFrames) {
      const key = `${tick.symbol}:${tf}`
      const candleStart = this.getCandleStart(tick.timestamp, tf)
      const existing = this.currentCandles.get(key)

      if (!existing || existing.timestamp.getTime() !== candleStart.getTime()) {
        if (existing) {
          existing.isClosed = true
          this.onCandleClose({ ...existing })
        }
        this.currentCandles.set(key, {
          symbol: tick.symbol,
          timeFrame: tf,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: tick.volume,
          timestamp: candleStart,
          isClosed: false,
        })
      } else {
        existing.high = Math.max(existing.high, tick.price)
        existing.low = Math.min(existing.low, tick.price)
        existing.close = tick.price
        existing.volume += tick.volume
      }
    }
  }

  getCurrentCandle(symbol: string, timeFrame: TimeFrame): Candle | undefined {
    return this.currentCandles.get(`${symbol}:${timeFrame}`)
  }

  getCandleStart(timestamp: Date, tf: TimeFrame): Date {
    const d = new Date(timestamp)
    switch (tf) {
      case '1m':
        d.setSeconds(0, 0)
        return d
      case '5m':
        d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0)
        return d
      case '15m':
        d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0)
        return d
      case '1h':
        d.setMinutes(0, 0, 0)
        return d
      case '1d':
        d.setHours(0, 0, 0, 0)
        return d
      default:
        return d
    }
  }
}
