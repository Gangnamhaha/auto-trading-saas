import type { OHLCV } from '../strategy/types'
import type { Candle, TimeFrame } from './types'
import { candleToOHLCV } from './types'

export class MarketDataStore {
  private candles: Map<string, Candle[]> = new Map()
  private latestPrices: Map<string, number> = new Map()
  private maxCandles: number

  constructor(maxCandles = 500) {
    this.maxCandles = maxCandles
  }

  addCandle(candle: Candle): void {
    const key = `${candle.symbol}:${candle.timeFrame}`
    if (!this.candles.has(key)) {
      this.candles.set(key, [])
    }
    const arr = this.candles.get(key)!
    arr.push(candle)
    if (arr.length > this.maxCandles) {
      arr.splice(0, arr.length - this.maxCandles)
    }
    this.latestPrices.set(candle.symbol, candle.close)
  }

  getCandles(symbol: string, timeFrame: TimeFrame, limit?: number): Candle[] {
    const key = `${symbol}:${timeFrame}`
    const arr = this.candles.get(key) ?? []
    return limit ? arr.slice(-limit) : [...arr]
  }

  getLatestPrice(symbol: string): number | null {
    return this.latestPrices.get(symbol) ?? null
  }

  getOHLCV(symbol: string, timeFrame: TimeFrame, limit: number): OHLCV[] {
    return this.getCandles(symbol, timeFrame, limit).map(candleToOHLCV)
  }

  clear(): void {
    this.candles.clear()
    this.latestPrices.clear()
  }
}
