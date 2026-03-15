import { describe, expect, it } from 'vitest'
import { BollingerBandsStrategy } from '../strategy/bollinger-bands'
import { MACDStrategy } from '../strategy/macd'
import { GridTradingStrategy } from '../strategy/grid-trading'
import type { OHLCV } from '../strategy/types'

function makeOHLCV(closes: number[]): OHLCV[] {
  return closes.map((close, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: close,
    high: close + 100,
    low: close - 100,
    close,
    volume: 1000,
  }))
}

describe('BollingerBandsStrategy', () => {
  it('returns HOLD for insufficient data', () => {
    const bb = new BollingerBandsStrategy({ period: 20, stdDev: 2 })
    const data = makeOHLCV(Array(10).fill(70000))
    const signals = bb.analyze(data)
    expect(signals.every((s) => s === 'HOLD')).toBe(true)
  })

  it('generates BUY when price at lower band', () => {
    const bb = new BollingerBandsStrategy({ period: 5, stdDev: 2 })
    const prices = [70000, 70000, 70000, 70000, 70000, 65000]
    const data = makeOHLCV(prices)
    const signals = bb.analyze(data)
    expect(signals[5]).toBe('BUY')
  })

  it('generates SELL when price at upper band', () => {
    const bb = new BollingerBandsStrategy({ period: 5, stdDev: 2 })
    const prices = [70000, 70000, 70000, 70000, 70000, 75000]
    const data = makeOHLCV(prices)
    const signals = bb.analyze(data)
    expect(signals[5]).toBe('SELL')
  })

  it('generates HOLD when price within bands', () => {
    const bb = new BollingerBandsStrategy({ period: 5, stdDev: 2 })
    const prices = [70000, 70050, 69950, 70020, 69980, 70010]
    const data = makeOHLCV(prices)
    const signals = bb.analyze(data)
    expect(signals[5]).toBe('HOLD')
  })

  it('validates params correctly', () => {
    const bb = new BollingerBandsStrategy()
    expect(bb.validateParams({ period: 20, stdDev: 2 })).toBe(true)
    expect(bb.validateParams({ period: -1, stdDev: 2 })).toBe(false)
  })
})

describe('MACDStrategy', () => {
  it('returns HOLD for insufficient data', () => {
    const macd = new MACDStrategy({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    })
    const data = makeOHLCV(Array(20).fill(70000))
    const signals = macd.analyze(data)
    expect(signals.every((s) => s === 'HOLD')).toBe(true)
  })

  it('detects bullish crossover', () => {
    const macd = new MACDStrategy({
      fastPeriod: 3,
      slowPeriod: 6,
      signalPeriod: 3,
    })
    const prices = [
      100, 98, 96, 94, 92, 90, 88, 86, 84, 82, 80, 82, 85, 89, 94, 100, 107,
      115, 124,
    ]
    const data = makeOHLCV(prices)
    const signals = macd.analyze(data)
    const hasBuy = signals.some((s) => s === 'BUY')
    expect(hasBuy).toBe(true)
  })

  it('detects bearish crossover', () => {
    const macd = new MACDStrategy({
      fastPeriod: 3,
      slowPeriod: 6,
      signalPeriod: 3,
    })
    const prices = [
      100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 118, 115, 111, 106,
      100, 93, 85, 76,
    ]
    const data = makeOHLCV(prices)
    const signals = macd.analyze(data)
    const hasSell = signals.some((s) => s === 'SELL')
    expect(hasSell).toBe(true)
  })

  it('validates params', () => {
    const macd = new MACDStrategy()
    expect(
      macd.validateParams({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 })
    ).toBe(true)
    expect(
      macd.validateParams({ fastPeriod: 30, slowPeriod: 26, signalPeriod: 9 })
    ).toBe(false)
  })

  it('returns correct default params', () => {
    const macd = new MACDStrategy()
    expect(macd.getDefaultParams()).toEqual({
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    })
  })
})

describe('GridTradingStrategy', () => {
  it('generates correct grid levels', () => {
    const grid = new GridTradingStrategy({
      upperPrice: 80000,
      lowerPrice: 60000,
      gridCount: 10,
    })
    const levels = grid.getGridLevels()
    expect(levels).toHaveLength(11)
    expect(levels[0]).toBe(60000)
    expect(levels[10]).toBe(80000)
    expect(levels[1]).toBe(62000)
  })

  it('generates BUY when price drops below grid level', () => {
    const grid = new GridTradingStrategy({
      upperPrice: 80000,
      lowerPrice: 60000,
      gridCount: 5,
    })
    const prices = [72000, 70000, 68000, 66000]
    const data = makeOHLCV(prices)
    const signals = grid.analyze(data)
    const hasBuy = signals.some((s) => s === 'BUY')
    expect(hasBuy).toBe(true)
  })

  it('generates SELL when price rises above grid level', () => {
    const grid = new GridTradingStrategy({
      upperPrice: 80000,
      lowerPrice: 60000,
      gridCount: 5,
    })
    const prices = [66000, 68000, 70000, 72000, 74000]
    const data = makeOHLCV(prices)
    const signals = grid.analyze(data)
    const hasSell = signals.some((s) => s === 'SELL')
    expect(hasSell).toBe(true)
  })

  it('generates HOLD when price stays in same level', () => {
    const grid = new GridTradingStrategy({
      upperPrice: 80000,
      lowerPrice: 60000,
      gridCount: 5,
    })
    const prices = [70000, 70100, 70200, 70300]
    const data = makeOHLCV(prices)
    const signals = grid.analyze(data)
    expect(signals.slice(1).every((s) => s === 'HOLD')).toBe(true)
  })

  it('validates params', () => {
    const grid = new GridTradingStrategy()
    expect(
      grid.validateParams({
        upperPrice: 80000,
        lowerPrice: 60000,
        gridCount: 10,
      })
    ).toBe(true)
    expect(
      grid.validateParams({
        upperPrice: 50000,
        lowerPrice: 60000,
        gridCount: 10,
      })
    ).toBe(false)
  })
})
