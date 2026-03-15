export interface OHLCV {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Signal = 'BUY' | 'SELL' | 'HOLD'

export interface StrategyParams {
  [key: string]: number | string | boolean
}

export interface IStrategy {
  name: string
  analyze(data: OHLCV[]): Signal[]
  getDefaultParams(): StrategyParams
  validateParams(params: StrategyParams): boolean
}
