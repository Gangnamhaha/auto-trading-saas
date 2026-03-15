import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CandleAggregator } from '../data/candle-aggregator'
import { KISWebSocket } from '../data/kis-websocket'
import { MarketDataStore } from '../data/market-data-store'
import { MarketHours } from '../data/market-hours'
import { candleToOHLCV, type Candle, type MarketTick } from '../data/types'

function makeTick(
  price: number,
  timestamp: string,
  volume = 10,
  side: 'buy' | 'sell' = 'buy'
): MarketTick {
  return {
    symbol: '005930',
    price,
    volume,
    timestamp: new Date(timestamp),
    side,
  }
}

function makeCandle(
  close: number,
  timestamp: string,
  timeFrame: '1m' | '5m' | '15m' | '1h' | '1d' = '1m'
): Candle {
  return {
    symbol: '005930',
    timeFrame,
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
    timestamp: new Date(timestamp),
    isClosed: true,
  }
}

describe('CandleAggregator', () => {
  it('creates first candle from first tick', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['1m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    const cur = agg.getCurrentCandle('005930', '1m')
    expect(cur).toMatchObject({
      open: 70000,
      high: 70000,
      low: 70000,
      close: 70000,
      volume: 5,
      isClosed: false,
    })
    expect(closed).toHaveLength(0)
  })

  it('updates candle OHLCV within same period', () => {
    const agg = new CandleAggregator(['1m'], () => undefined)
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    agg.processTick(makeTick(70200, '2024-01-01T00:00:30.000Z', 3))
    agg.processTick(makeTick(69900, '2024-01-01T00:00:50.000Z', 7))
    const cur = agg.getCurrentCandle('005930', '1m')
    expect(cur).toMatchObject({
      open: 70000,
      high: 70200,
      low: 69900,
      close: 69900,
      volume: 15,
    })
  })

  it('closes candle when period rolls over', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['1m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:00:10.000Z', 5))
    agg.processTick(makeTick(70100, '2024-01-01T00:01:00.000Z', 2))
    expect(closed).toHaveLength(1)
    expect(closed[0]).toMatchObject({
      open: 70000,
      close: 70000,
      volume: 5,
      isClosed: true,
    })
  })

  it('aggregates 5m candles correctly', () => {
    const closed: Candle[] = []
    const agg = new CandleAggregator(['5m'], (c) => closed.push(c))
    agg.processTick(makeTick(70000, '2024-01-01T00:02:10.000Z', 1))
    agg.processTick(makeTick(70100, '2024-01-01T00:04:59.000Z', 1))
    agg.processTick(makeTick(70200, '2024-01-01T00:05:00.000Z', 1))
    expect(closed).toHaveLength(1)
    expect(closed[0]).toMatchObject({
      open: 70000,
      high: 70100,
      close: 70100,
      volume: 2,
    })
  })

  it('computes candle starts for all timeframes', () => {
    const agg = new CandleAggregator(['1m'], () => undefined)
    const input = new Date('2024-01-01T13:37:42.999Z')
    expect(agg.getCandleStart(input, '15m').toISOString()).toBe(
      '2024-01-01T13:30:00.000Z'
    )
    expect(agg.getCandleStart(input, '1h').toISOString()).toBe(
      '2024-01-01T13:00:00.000Z'
    )
    expect(agg.getCandleStart(input, '1d').toISOString()).toBe(
      '2024-01-01T00:00:00.000Z'
    )
  })
})

describe('MarketDataStore', () => {
  it('stores and retrieves candles with limit', () => {
    const store = new MarketDataStore(10)
    store.addCandle(makeCandle(70000, '2024-01-01T00:00:00.000Z'))
    store.addCandle(makeCandle(70100, '2024-01-01T00:01:00.000Z'))
    store.addCandle(makeCandle(70200, '2024-01-01T00:02:00.000Z'))
    expect(store.getCandles('005930', '1m')).toHaveLength(3)
    expect(store.getCandles('005930', '1m', 2)).toHaveLength(2)
  })

  it('prunes old candles when maxCandles exceeded', () => {
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

  it('converts to OHLCV format', () => {
    const ohlcv = candleToOHLCV(makeCandle(70400, '2024-01-01T00:04:00.000Z'))
    expect(ohlcv).toEqual({
      date: '2024-01-01',
      open: 70400,
      high: 70400,
      low: 70400,
      close: 70400,
      volume: 100,
    })
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
    expect(tick).toMatchObject({
      symbol: '005930',
      price: 70100,
      volume: 1200,
      side: 'buy',
    })
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
