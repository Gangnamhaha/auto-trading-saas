import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TradingDaemon } from '../daemon/trading-daemon'
import type {
  IBroker,
  AccountBalance,
  ConnectionStatus,
  OrderResult,
  PriceData,
} from '../broker/types'
import type { DaemonConfig } from '../daemon/types'

function createMockBroker(): IBroker {
  return {
    connect: vi.fn().mockResolvedValue({ connected: true } as ConnectionStatus),
    disconnect: vi.fn().mockResolvedValue(undefined),
    getBalance: vi.fn().mockResolvedValue({
      cash: 10_000_000,
      totalValue: 10_000_000,
      positions: [],
    } as AccountBalance),
    getPrice: vi.fn().mockResolvedValue({
      symbol: '005930',
      price: 70000,
      volume: 1000,
      timestamp: new Date().toISOString(),
      high: 70100,
      low: 69900,
      open: 70000,
    } as PriceData),
    placeOrder: vi.fn().mockResolvedValue({
      orderId: 'TEST-001',
      status: 'submitted',
      symbol: '005930',
      side: 'buy',
      quantity: 1,
      price: 70000,
    } as OrderResult),
    cancelOrder: vi.fn().mockResolvedValue({ success: true }),
    getOrderStatus: vi.fn().mockResolvedValue({
      orderId: 'TEST-001',
      status: 'filled',
      symbol: '005930',
      side: 'buy',
      quantity: 1,
      price: 70000,
    } as OrderResult),
  }
}

function createConfig(overrides?: Partial<DaemonConfig>): DaemonConfig {
  return {
    pollingIntervalMs: 1000,
    symbols: ['005930'],
    strategies: [
      {
        id: 'strat-1',
        strategyName: 'ma_crossover',
        symbol: '005930',
        params: { shortPeriod: 5, longPeriod: 20 },
        mode: 'paper',
        isActive: true,
      },
    ],
    riskConfig: {
      maxPositionSizePercent: 10,
      maxDailyLossPercent: 5,
      maxDailyTrades: 50,
    },
    ...overrides,
  }
}

describe('TradingDaemon', () => {
  let broker: IBroker

  beforeEach(() => {
    vi.restoreAllMocks()
    broker = createMockBroker()
  })

  it('starts in idle state', () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    expect(daemon.getState()).toBe('idle')
  })

  it('transitions to running on start', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    await daemon.start()
    expect(daemon.getState()).toBe('running')
    await daemon.stop()
  })

  it('transitions to stopped on stop', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    await daemon.start()
    await daemon.stop()
    expect(daemon.getState()).toBe('stopped')
  })

  it('can pause and resume', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    await daemon.start()
    daemon.pause()
    expect(daemon.getState()).toBe('paused')
    daemon.resume()
    expect(daemon.getState()).toBe('running')
    await daemon.stop()
  })

  it('emits started event', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    const listener = vi.fn()
    daemon.on('started', listener)
    await daemon.start()
    expect(listener).toHaveBeenCalledTimes(1)
    await daemon.stop()
  })

  it('emits stopped event', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    const listener = vi.fn()
    daemon.on('stopped', listener)
    await daemon.start()
    await daemon.stop()
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('returns status with uptime', async () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    await daemon.start()
    const status = daemon.getStatus()
    expect(status.state).toBe('running')
    expect(status.uptime).toBeGreaterThanOrEqual(0)
    expect(status.activatedStrategies).toBe(1)
    await daemon.stop()
  })

  it('skips inactive strategies', () => {
    const config = createConfig({
      strategies: [
        {
          id: 'strat-1',
          strategyName: 'ma_crossover',
          symbol: '005930',
          params: { shortPeriod: 5, longPeriod: 20 },
          mode: 'paper',
          isActive: false,
        },
      ],
    })
    const daemon = new TradingDaemon(config, broker)
    expect(daemon.getStatus().activatedStrategies).toBe(0)
  })

  it('handles unknown strategy name gracefully', () => {
    const config = createConfig({
      strategies: [
        {
          id: 'strat-x',
          strategyName: 'unknown_strategy',
          symbol: '005930',
          params: {},
          mode: 'paper',
          isActive: true,
        },
      ],
    })
    const daemon = new TradingDaemon(config, broker)
    expect(daemon.getStatus().activatedStrategies).toBe(0)
  })

  it('processes market tick through aggregator', () => {
    const daemon = new TradingDaemon(createConfig(), broker)
    daemon.processTick({
      symbol: '005930',
      price: 70000,
      volume: 100,
      timestamp: new Date(),
      side: 'buy',
    })
    const status = daemon.getStatus()
    expect(status.lastTickAt).toBeInstanceOf(Date)
  })
})
