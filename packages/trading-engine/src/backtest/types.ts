import type { Signal } from '../strategy'

export interface BacktestConfig {
  initialCapital: number
  commissionRate: number
  slippageRate: number
}

export interface TradeRecord {
  date: string
  signal: Extract<Signal, 'BUY' | 'SELL'>
  price: number
  quantity: number
  commission: number
  pnl?: number
}

export interface BacktestResult {
  totalReturn: number
  maxDrawdown: number
  sharpeRatio: number
  winRate: number
  totalTrades: number
  finalCapital: number
  trades: TradeRecord[]
}
