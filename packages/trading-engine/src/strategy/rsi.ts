import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

interface RSIParams extends StrategyParams {
  period: number
  oversold: number
  overbought: number
}

const DEFAULT_PARAMS: RSIParams = {
  period: 14,
  oversold: 30,
  overbought: 70,
}

function toRSI(avgGain: number, avgLoss: number): number {
  if (avgGain === 0 && avgLoss === 0) {
    return 50
  }

  if (avgLoss === 0) {
    return 100
  }

  if (avgGain === 0) {
    return 0
  }

  const relativeStrength = avgGain / avgLoss
  return 100 - 100 / (1 + relativeStrength)
}

export class RSIStrategy implements IStrategy {
  name = 'rsi'

  constructor(private params: RSIParams = DEFAULT_PARAMS) {
    if (!this.validateParams(params)) {
      throw new Error('Invalid RSI params')
    }
  }

  analyze(data: OHLCV[]): Signal[] {
    if (data.length === 0) {
      return []
    }

    const prices = data.map((candle) => candle.close)
    const rsiValues = this.calculateRSI(prices, this.params.period)
    const signals: Signal[] = data.map(() => 'HOLD')

    for (let i = 0; i < data.length; i += 1) {
      const rsi = rsiValues[i]

      if (Number.isNaN(rsi)) {
        continue
      }

      if (rsi < this.params.oversold) {
        signals[i] = 'BUY'
        continue
      }

      if (rsi > this.params.overbought) {
        signals[i] = 'SELL'
      }
    }

    return signals
  }

  getDefaultParams(): StrategyParams {
    return { ...DEFAULT_PARAMS }
  }

  validateParams(params: StrategyParams): boolean {
    const period = params.period
    const oversold = params.oversold
    const overbought = params.overbought

    return (
      typeof period === 'number' &&
      Number.isInteger(period) &&
      period > 0 &&
      typeof oversold === 'number' &&
      typeof overbought === 'number' &&
      oversold >= 0 &&
      oversold <= 100 &&
      overbought >= 0 &&
      overbought <= 100 &&
      oversold < overbought
    )
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi = new Array<number>(prices.length).fill(Number.NaN)

    if (prices.length <= period) {
      return rsi
    }

    let totalGain = 0
    let totalLoss = 0

    for (let i = 1; i <= period; i += 1) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) {
        totalGain += change
      } else {
        totalLoss += Math.abs(change)
      }
    }

    let avgGain = totalGain / period
    let avgLoss = totalLoss / period
    rsi[period] = toRSI(avgGain, avgLoss)

    for (let i = period + 1; i < prices.length; i += 1) {
      const change = prices[i] - prices[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? Math.abs(change) : 0

      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      rsi[i] = toRSI(avgGain, avgLoss)
    }

    return rsi
  }
}
