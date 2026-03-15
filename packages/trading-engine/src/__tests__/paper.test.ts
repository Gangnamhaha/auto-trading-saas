import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { BrokerCredentials } from '../broker/types'
import { PaperBroker } from '../paper/paper-broker'

const credentials: BrokerCredentials = {
  appKey: 'PAPER_APP_KEY',
  appSecret: 'PAPER_APP_SECRET',
  accountNo: '00000000-00',
  env: 'demo',
}

describe('PaperBroker', () => {
  beforeEach(() => {
    ;(globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch =
      vi.fn()
  })

  afterEach(() => {
    delete (globalThis as unknown as { fetch?: unknown }).fetch
  })

  it('places order without calling real broker API', async () => {
    const fetchSpy = globalThis.fetch as unknown as ReturnType<typeof vi.fn>
    const broker = new PaperBroker(1_000_000)
    await broker.connect(credentials)

    await broker.placeOrder({
      symbol: '005930',
      side: 'buy',
      quantity: 1,
      price: 100_000,
      orderType: 'limit',
    })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('updates virtual balance after buy', async () => {
    const broker = new PaperBroker(1_000_000)
    await broker.connect(credentials)

    await broker.placeOrder({
      symbol: '005930',
      side: 'buy',
      quantity: 2,
      price: 100_000,
      orderType: 'limit',
    })

    const balance = await broker.getBalance()
    expect(balance.cash).toBeCloseTo(799_970)
    expect(balance.positions[0]).toMatchObject({
      symbol: '005930',
      quantity: 2,
      avgPrice: 100_000,
    })
  })

  it('updates virtual balance after sell', async () => {
    const broker = new PaperBroker(1_000_000)
    await broker.connect(credentials)

    await broker.placeOrder({
      symbol: '005930',
      side: 'buy',
      quantity: 2,
      price: 100_000,
      orderType: 'limit',
    })
    await broker.placeOrder({
      symbol: '005930',
      side: 'sell',
      quantity: 1,
      price: 110_000,
      orderType: 'limit',
    })

    const balance = await broker.getBalance()
    expect(balance.cash).toBeCloseTo(909_953.5)
    expect(balance.positions[0]).toMatchObject({
      symbol: '005930',
      quantity: 1,
      avgPrice: 100_000,
      currentPrice: 110_000,
    })
  })

  it('rejects live trading before 30 days', async () => {
    const broker = new PaperBroker(1_000_000)
    await broker.connect(credentials)

    expect(() => broker.switchToLive()).toThrow(
      '30일 이상 페이퍼트레이딩 이후에만 실전 전환이 가능합니다.'
    )
  })

  it('allows live trading after 30 days of paper trading', async () => {
    const broker = new PaperBroker(1_000_000)
    await broker.connect(credentials)
    ;(broker.getPaperAccount() as unknown as { startDate: Date }).startDate =
      new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)

    expect(() => broker.switchToLive()).not.toThrow()
    expect(broker.canSwitchToLive()).toBe(true)
  })
})
