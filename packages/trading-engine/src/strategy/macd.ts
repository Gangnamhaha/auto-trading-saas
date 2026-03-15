import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

export class MACDStrategy implements IStrategy {
  name = 'macd'

  constructor(
    private params: {
      fastPeriod: number
      slowPeriod: number
      signalPeriod: number
    } = {
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    const { fastPeriod, slowPeriod, signalPeriod } = this.params
    const closes = data.map((d) => d.close)
    const signals: Signal[] = []

    if (closes.length < slowPeriod + signalPeriod) {
      return data.map(() => 'HOLD' as Signal)
    }

    const fastEMA = this.calculateEMA(closes, fastPeriod)
    const slowEMA = this.calculateEMA(closes, slowPeriod)

    const macdLine: number[] = []
    for (let i = 0; i < closes.length; i++) {
      if (fastEMA[i] !== undefined && slowEMA[i] !== undefined) {
        macdLine.push(fastEMA[i] - slowEMA[i])
      }
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod)

    const offset = closes.length - macdLine.length

    for (let i = 0; i < closes.length; i++) {
      const mi = i - offset
      if (
        mi < 1 ||
        signalLine[mi] === undefined ||
        signalLine[mi - 1] === undefined
      ) {
        signals.push('HOLD')
        continue
      }

      const prevMacd = macdLine[mi - 1]
      const currMacd = macdLine[mi]
      const prevSignal = signalLine[mi - 1]
      const currSignal = signalLine[mi]

      if (prevMacd <= prevSignal && currMacd > currSignal) {
        signals.push('BUY')
      } else if (prevMacd >= prevSignal && currMacd < currSignal) {
        signals.push('SELL')
      } else {
        signals.push('HOLD')
      }
    }

    return signals
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = []
    const multiplier = 2 / (period + 1)

    let sum = 0
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sum += prices[i]
        ema.push(undefined as unknown as number)
      } else if (i === period - 1) {
        sum += prices[i]
        ema.push(sum / period)
      } else {
        ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1])
      }
    }
    return ema
  }

  getDefaultParams(): StrategyParams {
    return { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
  }

  validateParams(params: StrategyParams): boolean {
    const f = params.fastPeriod as number
    const s = params.slowPeriod as number
    const sig = params.signalPeriod as number
    return f > 0 && s > 0 && sig > 0 && f < s
  }
}
