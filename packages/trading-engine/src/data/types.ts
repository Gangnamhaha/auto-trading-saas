import type { OHLCV } from '../strategy/types'

export interface MarketTick {
  symbol: string
  price: number
  volume: number
  timestamp: Date
  side: 'buy' | 'sell'
}

export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '1d'

export interface Candle {
  symbol: string
  timeFrame: TimeFrame
  open: number
  high: number
  low: number
  close: number
  volume: number
  timestamp: Date
  isClosed: boolean
}

export type MarketDataCallback = (tick: MarketTick) => void
export type CandleCallback = (candle: Candle) => void

export function candleToOHLCV(candle: Candle): OHLCV {
  return {
    date: candle.timestamp.toISOString().split('T')[0],
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }
}
