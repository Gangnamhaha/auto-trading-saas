import { describe, expect, it } from 'vitest'

import type { OrderRequest, Position } from '../broker/types'
import { CircuitBreaker } from '../risk/circuit-breaker'
import { RiskManager } from '../risk/risk-manager'
import { RiskViolationError, type RiskConfig } from '../risk/types'

const baseConfig: RiskConfig = {
  maxPositionSizePercent: 10,
  maxDailyLossPercent: 5,
  maxDailyTrades: 3,
  maxSingleStockPercent: 30,
  stopLossPercent: 3,
}

function createOrder(overrides: Partial<OrderRequest> = {}): OrderRequest {
  return {
    symbol: '005930',
    side: 'buy',
    quantity: 1,
    price: 10_000,
    orderType: 'limit',
    ...overrides,
  }
}

describe('RiskManager', () => {
  it('rejects order exceeding 10% position size', () => {
    const manager = new RiskManager(baseConfig, new CircuitBreaker(5))

    expect(() =>
      manager.validateOrder(
        createOrder({ quantity: 2, price: 6_000 }),
        100_000,
        []
      )
    ).toThrow(RiskViolationError)
  })

  it('allows order within position size limit', () => {
    const manager = new RiskManager(baseConfig, new CircuitBreaker(5))

    expect(() =>
      manager.validateOrder(
        createOrder({ quantity: 1, price: 9_999 }),
        100_000,
        []
      )
    ).not.toThrow()
  })

  it('trips circuit breaker after 5% daily loss', () => {
    const breaker = new CircuitBreaker(5)
    const manager = new RiskManager(baseConfig, breaker)

    manager.recordTrade(-5_000, 100_000)

    expect(breaker.isTripped()).toBe(true)
  })

  it('rejects order when circuit breaker is tripped', () => {
    const breaker = new CircuitBreaker(5)
    const manager = new RiskManager(baseConfig, breaker)
    manager.recordTrade(-6_000, 100_000)

    expect(() => manager.validateOrder(createOrder(), 100_000, [])).toThrow(
      '일일 손실 한도 초과로 당일 거래가 중단되었습니다.'
    )
  })

  it('resets circuit breaker next day', () => {
    const breaker = new CircuitBreaker(5)
    const manager = new RiskManager(baseConfig, breaker)

    manager.recordTrade(-6_000, 100_000)
    expect(breaker.isTripped()).toBe(true)
    ;(breaker as unknown as { lastResetDate: string }).lastResetDate =
      '2000-01-01'

    expect(breaker.isTripped()).toBe(false)
  })

  it('records daily loss correctly', () => {
    const breaker = new CircuitBreaker(5)
    const manager = new RiskManager(baseConfig, breaker)

    manager.recordTrade(-1_000, 100_000)
    manager.recordTrade(-2_000, 100_000)

    expect(breaker.getDailyLoss()).toBeCloseTo(3)
  })

  it('rejects order when single stock concentration exceeds limit', () => {
    const manager = new RiskManager(baseConfig, new CircuitBreaker(5))
    const positions: Position[] = [
      {
        symbol: '005930',
        quantity: 2,
        avgPrice: 10_000,
        currentPrice: 10_000,
        pnl: 0,
      },
    ]

    expect(() =>
      manager.validateOrder(
        createOrder({ symbol: '005930', quantity: 2, price: 10_000 }),
        100_000,
        positions
      )
    ).toThrow(RiskViolationError)
  })
})
