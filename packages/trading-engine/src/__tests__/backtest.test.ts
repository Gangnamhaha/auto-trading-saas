import { describe, expect, it } from 'vitest'

import { BacktestEngine } from '../backtest/engine'
import type {
  IStrategy,
  OHLCV,
  Signal,
  StrategyParams,
} from '../strategy/types'

class FixedSignalStrategy implements IStrategy {
  name = 'fixed_signal'

  constructor(private signals: Signal[]) {}

  analyze(data: OHLCV[]): Signal[] {
    return data.map((_, index) => this.signals[index] ?? 'HOLD')
  }

  getDefaultParams(): StrategyParams {
    return {}
  }

  validateParams(): boolean {
    return true
  }
}

function createOHLCVData(closes: number[]): OHLCV[] {
  const start = new Date('2024-02-01T00:00:00.000Z')

  return closes.map((close, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)

    return {
      date: date.toISOString().slice(0, 10),
      open: close,
      high: close,
      low: close,
      close,
      volume: 2_000,
    }
  })
}

describe('BacktestEngine', () => {
  it('calculates total return correctly', () => {
    const data = createOHLCVData([100, 100, 120])
    const strategy = new FixedSignalStrategy(['BUY', 'HOLD', 'SELL'])
    const engine = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0,
      slippageRate: 0,
    })

    const result = engine.run(data, strategy)

    expect(result.totalReturn).toBeCloseTo(20, 5)
    expect(result.finalCapital).toBeCloseTo(1_200, 5)
  })

  it('commission reduces returns vs no-commission', () => {
    const data = createOHLCVData([100, 100, 120])
    const strategy = new FixedSignalStrategy(['BUY', 'HOLD', 'SELL'])

    const noCommission = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0,
      slippageRate: 0,
    }).run(data, strategy)

    const withCommission = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0.01,
      slippageRate: 0,
    }).run(data, strategy)

    expect(withCommission.finalCapital).toBeLessThan(noCommission.finalCapital)
    expect(withCommission.totalReturn).toBeLessThan(noCommission.totalReturn)
  })

  it('calculates max drawdown correctly', () => {
    const data = createOHLCVData([100, 80, 120])
    const strategy = new FixedSignalStrategy(['BUY', 'HOLD', 'SELL'])
    const engine = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0,
      slippageRate: 0,
    })

    const result = engine.run(data, strategy)

    expect(result.maxDrawdown).toBeCloseTo(-20, 5)
  })

  it('win rate is between 0 and 100', () => {
    const data = createOHLCVData([100, 120, 90, 80, 100])
    const strategy = new FixedSignalStrategy([
      'BUY',
      'SELL',
      'BUY',
      'SELL',
      'HOLD',
    ])
    const engine = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0,
      slippageRate: 0,
    })

    const result = engine.run(data, strategy)

    expect(result.winRate).toBeGreaterThanOrEqual(0)
    expect(result.winRate).toBeLessThanOrEqual(100)
  })

  it('total trades matches buy and sell count', () => {
    const data = createOHLCVData([100, 105, 110, 90, 95, 130])
    const signals: Signal[] = ['BUY', 'HOLD', 'SELL', 'BUY', 'HOLD', 'SELL']
    const strategy = new FixedSignalStrategy(signals)
    const engine = new BacktestEngine({
      initialCapital: 1_000,
      commissionRate: 0,
      slippageRate: 0,
    })

    const result = engine.run(data, strategy)
    const expectedTradeCount = signals.filter(
      (signal) => signal === 'BUY' || signal === 'SELL'
    ).length

    expect(result.totalTrades).toBe(expectedTradeCount)
    expect(result.trades).toHaveLength(expectedTradeCount)
  })
})
