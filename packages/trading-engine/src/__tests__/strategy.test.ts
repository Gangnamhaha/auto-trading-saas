import { describe, expect, it } from 'vitest'

import { MACrossoverStrategy } from '../strategy/ma-crossover'
import { RSIStrategy } from '../strategy/rsi'
import type { OHLCV } from '../strategy/types'

function createOHLCVData(closes: number[]): OHLCV[] {
  const start = new Date('2024-01-01T00:00:00.000Z')

  return closes.map((close, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)

    return {
      date: date.toISOString().slice(0, 10),
      open: close,
      high: close,
      low: close,
      close,
      volume: 1_000,
    }
  })
}

function generateGoldenCrossData(): OHLCV[] {
  const downTrend = Array.from({ length: 20 }, (_, i) => 120 - i)
  const upTrend = [102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124]
  return createOHLCVData([...downTrend, ...upTrend])
}

function generateDeathCrossData(): OHLCV[] {
  const upTrend = Array.from({ length: 20 }, (_, i) => 80 + i)
  const downTrend = [98, 96, 94, 92, 90, 88, 86, 84, 82, 80, 78, 76]
  return createOHLCVData([...upTrend, ...downTrend])
}

describe('MACrossoverStrategy', () => {
  it('generates BUY signal on golden cross', () => {
    const strategy = new MACrossoverStrategy()
    const signals = strategy.analyze(generateGoldenCrossData())
    const buyIndex = signals.findIndex((signal) => signal === 'BUY')

    expect(buyIndex).toBeGreaterThanOrEqual(20)
  })

  it('generates SELL signal on death cross', () => {
    const strategy = new MACrossoverStrategy()
    const signals = strategy.analyze(generateDeathCrossData())
    const sellIndex = signals.findIndex((signal) => signal === 'SELL')

    expect(sellIndex).toBeGreaterThanOrEqual(20)
  })

  it('generates HOLD when no crossover', () => {
    const strategy = new MACrossoverStrategy({ shortPeriod: 2, longPeriod: 4 })
    const data = createOHLCVData([1, 2, 3, 4, 5, 6, 7, 8])
    const signals = strategy.analyze(data)

    expect(signals.every((signal) => signal === 'HOLD')).toBe(true)
  })

  it('returns HOLD when insufficient data', () => {
    const strategy = new MACrossoverStrategy()
    const data = createOHLCVData([100, 101, 102, 103, 104])
    const signals = strategy.analyze(data)

    expect(signals).toEqual(['HOLD', 'HOLD', 'HOLD', 'HOLD', 'HOLD'])
  })

  it('respects custom short and long periods', () => {
    const data = createOHLCVData([10, 9, 8, 7, 6, 7, 8, 9, 10])
    const custom = new MACrossoverStrategy({ shortPeriod: 3, longPeriod: 5 })
    const customSignals = custom.analyze(data)
    const defaultSignals = new MACrossoverStrategy().analyze(data)

    expect(customSignals).toContain('BUY')
    expect(defaultSignals.every((signal) => signal === 'HOLD')).toBe(true)
  })

  it('validates MA parameter constraints', () => {
    const strategy = new MACrossoverStrategy()

    expect(strategy.validateParams({ shortPeriod: 5, longPeriod: 20 })).toBe(
      true
    )
    expect(strategy.validateParams({ shortPeriod: 20, longPeriod: 5 })).toBe(
      false
    )
  })
})

describe('RSIStrategy', () => {
  it('generates BUY when RSI < 30', () => {
    const strategy = new RSIStrategy({
      period: 3,
      oversold: 30,
      overbought: 70,
    })
    const data = createOHLCVData([100, 95, 90, 85, 80, 75])
    const signals = strategy.analyze(data)

    expect(signals).toContain('BUY')
  })

  it('generates SELL when RSI > 70', () => {
    const strategy = new RSIStrategy({
      period: 3,
      oversold: 30,
      overbought: 70,
    })
    const data = createOHLCVData([100, 105, 110, 115, 120, 125])
    const signals = strategy.analyze(data)

    expect(signals).toContain('SELL')
  })

  it('generates HOLD when RSI is neutral', () => {
    const strategy = new RSIStrategy({
      period: 3,
      oversold: 30,
      overbought: 70,
    })
    const data = createOHLCVData([100, 100, 100, 100, 100, 100])
    const signals = strategy.analyze(data)

    expect(signals.every((signal) => signal === 'HOLD')).toBe(true)
  })

  it('calculates RSI correctly for known data', () => {
    const strategy = new RSIStrategy({
      period: 2,
      oversold: 30,
      overbought: 70,
    })
    const calculateRSI = strategy as unknown as {
      calculateRSI: (prices: number[], period: number) => number[]
    }

    const values = calculateRSI.calculateRSI([1, 2, 1], 2)

    expect(values[2]).toBeCloseTo(50, 5)
  })

  it('returns HOLD when insufficient data', () => {
    const strategy = new RSIStrategy()
    const data = createOHLCVData([100, 101, 102, 103, 104, 105])
    const signals = strategy.analyze(data)

    expect(signals.every((signal) => signal === 'HOLD')).toBe(true)
  })

  it('validates RSI parameter bounds', () => {
    const strategy = new RSIStrategy()

    expect(
      strategy.validateParams({ period: 14, oversold: 30, overbought: 70 })
    ).toBe(true)
    expect(
      strategy.validateParams({ period: 14, oversold: 80, overbought: 70 })
    ).toBe(false)
  })
})
