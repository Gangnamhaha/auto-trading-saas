import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

interface MACrossoverParams extends StrategyParams {
  shortPeriod: number
  longPeriod: number
}

const DEFAULT_PARAMS: MACrossoverParams = {
  shortPeriod: 5,
  longPeriod: 20,
}

export class MACrossoverStrategy implements IStrategy {
  name = 'ma_crossover'

  constructor(private params: MACrossoverParams = DEFAULT_PARAMS) {
    if (!this.validateParams(params)) {
      throw new Error('Invalid MA crossover params')
    }
  }

  analyze(data: OHLCV[]): Signal[] {
    if (data.length === 0) {
      return []
    }

    const prices = data.map((candle) => candle.close)
    const shortMA = this.calculateMA(prices, this.params.shortPeriod)
    const longMA = this.calculateMA(prices, this.params.longPeriod)
    const signals: Signal[] = data.map(() => 'HOLD')

    for (let i = 1; i < data.length; i += 1) {
      const currentShort = shortMA[i]
      const currentLong = longMA[i]
      const prevShort = shortMA[i - 1]
      const prevLong = longMA[i - 1]

      if (
        Number.isNaN(currentShort) ||
        Number.isNaN(currentLong) ||
        Number.isNaN(prevShort) ||
        Number.isNaN(prevLong)
      ) {
        continue
      }

      if (prevShort <= prevLong && currentShort > currentLong) {
        signals[i] = 'BUY'
        continue
      }

      if (prevShort >= prevLong && currentShort < currentLong) {
        signals[i] = 'SELL'
      }
    }

    return signals
  }

  getDefaultParams(): StrategyParams {
    return { ...DEFAULT_PARAMS }
  }

  validateParams(params: StrategyParams): boolean {
    const shortPeriod = params.shortPeriod
    const longPeriod = params.longPeriod

    return (
      typeof shortPeriod === 'number' &&
      typeof longPeriod === 'number' &&
      Number.isInteger(shortPeriod) &&
      Number.isInteger(longPeriod) &&
      shortPeriod > 0 &&
      longPeriod > 0 &&
      shortPeriod < longPeriod
    )
  }

  private calculateMA(prices: number[], period: number): number[] {
    const averages = new Array<number>(prices.length).fill(Number.NaN)
    let rollingSum = 0

    for (let i = 0; i < prices.length; i += 1) {
      rollingSum += prices[i]

      if (i >= period) {
        rollingSum -= prices[i - period]
      }

      if (i >= period - 1) {
        averages[i] = rollingSum / period
      }
    }

    return averages
  }
}
