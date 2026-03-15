import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CandleAggregator } from '../data/candle-aggregator'
import { KISWebSocket } from '../data/kis-websocket'
import { MarketDataStore } from '../data/market-data-store'
import { MarketHours } from '../data/market-hours'
import { candleToOHLCV, type Candle, type MarketTick } from '../data/types'

function makeTick(price: number, ts: string, vol = 10): MarketTick {
  return {
    symbol: '005930',
    price,
    volume: vol,
    timestamp: new Date(ts),
    side: 'buy',
  }
}

function makeCandle(close: number, ts: string): Candle {
  return {
    symbol: '005930',
    timeFrame: '1m',
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
    timestamp: new Date(ts),
    isClosed: true,
  }
}

describe('CandleAggregator', () => {
  it('creates first candle from tick', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['1m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    const cur = agg.getCurrentCandle('005930', '1m')
    expect(cur).toBeDefined()
    expect(cur?.open).toBe(70000)
    expect(cur?.volume).toBe(5)
    expect(cur?.isClosed).toBe(false)
    expect(closed).toHaveLength(0)
  })

  it('updates candle within same period', () => {
    const agg = new CandleAggregator(['1m'], () => undefined)
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    agg.processTick(makeTick(70200, '2024-01-01T00:00:30.000Z', 3))
    agg.processTick(makeTick(69900, '2024-01-01T00:00:50.000Z', 7))
    const cur = agg.getCurrentCandle('005930', '1m')
    expect(cur?.high).toBe(70200)
    expect(cur?.low).toBe(69900)
    expect(cur?.close).toBe(69900)
    expect(cur?.volume).toBe(15)
  })

  it('closes candle on period rollover', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['1m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    agg.processTick(makeTick(70100, '2024-01-01T00:01:00.000Z', 2))
    expect(closed).toHaveLength(1)
    expect(closed[0].isClosed).toBe(true)
    expect(closed[0].close).toBe(70000)
  })

  it('aggregates 5m candles', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['5m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:02:10.000Z', 1))
    agg.processTick(makeTick(70100, '2024-01-01T00:04:59.000Z', 1))
    agg.processTick(makeTick(70200, '2024-01-01T00:05:00.000Z', 1))
    expect(closed).toHaveLength(1)
    expect(closed[0].high).toBe(70100)
    expect(closed[0].volume).toBe(2)
  })

  it('computes 15m and 1h candle starts', () => {
    const agg = new CandleAggregator(['1m'], () => undefined)
    const input = new Date('2024-01-01T13:37:42.999Z')
    expect(agg.getCandleStart(input, '15m').toISOString()).toBe(
      '2024-01-01T13:30:00.000Z'
    )
    expect(agg.getCandleStart(input, '1h').toISOString()).toBe(
      '2024-01-01T13:00:00.000Z'
    )
  })
})

describe('MarketDataStore', () => {
  it('stores and retrieves candles', () => {
    const store = new MarketDataStore(10)
    store.addCandle(makeCandle(70000, '2024-01-01T00:00:00.000Z'))
    store.addCandle(makeCandle(70100, '2024-01-01T00:01:00.000Z'))
    expect(store.getCandles('005930', '1m')).toHaveLength(2)
    expect(store.getCandles('005930', '1m', 1)).toHaveLength(1)
  })

  it('prunes old candles', () => {
    const store = new MarketDataStore(2)
    store.addCandle(makeCandle(70000, '2024-01-01T00:00:00.000Z'))
    store.addCandle(makeCandle(70100, '2024-01-01T00:01:00.000Z'))
    store.addCandle(makeCandle(70200, '2024-01-01T00:02:00.000Z'))
    expect(store.getCandles('005930', '1m')).toHaveLength(2)
    expect(store.getCandles('005930', '1m')[0].close).toBe(70100)
  })

  it('tracks latest price', () => {
    const store = new MarketDataStore()
    expect(store.getLatestPrice('005930')).toBeNull()
    store.addCandle(makeCandle(70300, '2024-01-01T00:03:00.000Z'))
    expect(store.getLatestPrice('005930')).toBe(70300)
  })

  it('converts to OHLCV', () => {
    const ohlcv = candleToOHLCV(makeCandle(70400, '2024-01-01T00:04:00.000Z'))
    expect(ohlcv.date).toBe('2024-01-01')
    expect(ohlcv.close).toBe(70400)
  })
})

describe('MarketHours', () => {
  it('open during KST trading hours', () => {
    expect(MarketHours.isMarketOpen(new Date('2024-01-02T00:30:00.000Z'))).toBe(
      true
    )
  })

  it('closed before market', () => {
    expect(MarketHours.isMarketOpen(new Date('2024-01-02T23:30:00.000Z'))).toBe(
      false
    )
  })

  it('closed on weekend', () => {
    expect(MarketHours.isMarketOpen(new Date('2024-01-06T01:00:00.000Z'))).toBe(
      false
    )
  })
})

describe('KISWebSocket', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses valid trade message', () => {
    const ws = new KISWebSocket('key', 'secret')
    const tick = ws.parseMessage(
      '0|H0STCNT0|0|005930^x^70100^x^x^1^x^1200^x^x^x^x'
    )
    expect(tick).toBeTruthy()
    expect(tick?.symbol).toBe('005930')
    expect(tick?.price).toBe(70100)
    expect(tick?.volume).toBe(1200)
  })

  it('returns null for invalid message', () => {
    const ws = new KISWebSocket('key', 'secret')
    expect(ws.parseMessage('invalid')).toBeNull()
    expect(ws.parseMessage('0|OTHER|0|short')).toBeNull()
  })

  it('emits tick on handleMessage', () => {
    const ws = new KISWebSocket('key', 'secret')
    const listener = vi.fn()
    ws.on('tick', listener)
    ws.handleMessage('0|H0STCNT0|0|005930^x^70100^x^x^1^x^1200^x^x^x^x')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('manages subscriptions', () => {
    const ws = new KISWebSocket('key', 'secret')
    ws.subscribe('005930')
    ws.subscribe('000660')
    expect(ws.getSubscribedSymbols().sort()).toEqual(['000660', '005930'])
    ws.unsubscribe('005930')
    expect(ws.getSubscribedSymbols()).toEqual(['000660'])
  })

  it('disconnect resets state', () => {
    const ws = new KISWebSocket('key', 'secret')
    ws.subscribe('005930')
    ws.disconnect()
    expect(ws.isConnected()).toBe(false)
    expect(ws.getSubscribedSymbols()).toEqual([])
  })
})
