import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

export class BollingerBandsStrategy implements IStrategy {
  name = 'bollinger_bands'

  constructor(
    private params: { period: number; stdDev: number } = {
      period: 20,
      stdDev: 2,
    }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    const { period, stdDev } = this.params
    const signals: Signal[] = []
    const closes = data.map((d) => d.close)

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        signals.push('HOLD')
        continue
      }
      const slice = closes.slice(i - period + 1, i + 1)
      const sma = slice.reduce((a, b) => a + b, 0) / period
      const variance =
        slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period
      const sd = Math.sqrt(variance)
      const upper = sma + stdDev * sd
      const lower = sma - stdDev * sd

      if (closes[i] <= lower) {
        signals.push('BUY')
      } else if (closes[i] >= upper) {
        signals.push('SELL')
      } else {
        signals.push('HOLD')
      }
    }
    return signals
  }

  getDefaultParams(): StrategyParams {
    return { period: 20, stdDev: 2 }
  }

  validateParams(params: StrategyParams): boolean {
    const p = params.period as number
    const s = params.stdDev as number
    return typeof p === 'number' && p > 0 && typeof s === 'number' && s > 0
  }
}
