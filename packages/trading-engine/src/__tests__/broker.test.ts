import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KISAdapter } from '../broker/kis-adapter'
import { logRequest } from '../broker/logger'
import { RateLimiter } from '../broker/rate-limiter'
import type { BrokerCredentials } from '../broker/types'

import fetch from 'node-fetch'

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}))

type FetchMock = {
  (...args: unknown[]): unknown
  mockReset: () => void
  mockResolvedValueOnce: (value: unknown) => FetchMock
  mockImplementationOnce: (
    implementation: (
      url: unknown,
      options?: { signal?: AbortSignal }
    ) => unknown
  ) => FetchMock
  mock: { calls: Array<[unknown, unknown?]> }
}

const fetchMock = fetch as unknown as FetchMock

const credentials: BrokerCredentials = {
  appKey: 'TEST_APP_KEY_1234',
  appSecret: 'TEST_APP_SECRET_5678',
  accountNo: '12345678-01',
  env: 'demo',
}

function createResponse(status: number, body: Record<string, unknown>) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
  }
}

function mockTokenResponse(token = 'ACCESS_TOKEN_9999', expiresIn = 3600) {
  fetchMock.mockResolvedValueOnce(
    createResponse(200, {
      rt_cd: '0',
      msg_cd: '0',
      msg1: 'OK',
      access_token: token,
      expires_in: expiresIn,
    }) as never
  )
}

describe('RateLimiter', () => {
  it('allows requests within limit', async () => {
    const limiter = new RateLimiter(5, 5)
    const started = Date.now()

    await Promise.all([
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
    ])

    expect(Date.now() - started).toBeLessThan(100)
  })

  it('blocks 6th request within 1 second', async () => {
    const limiter = new RateLimiter(5, 5)
    const started = Date.now()

    for (let i = 0; i < 5; i += 1) {
      await limiter.acquire()
    }

    await limiter.acquire()

    expect(Date.now() - started).toBeGreaterThanOrEqual(180)
  })

  it('recovers after 1 second', async () => {
    const limiter = new RateLimiter(5, 5)

    for (let i = 0; i < 5; i += 1) {
      await limiter.acquire()
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const started = Date.now()
    await limiter.acquire()
    expect(Date.now() - started).toBeLessThan(50)
  })
})

describe('KISAdapter', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.restoreAllMocks()
  })

  it('connects with demo credentials', async () => {
    mockTokenResponse()
    const adapter = new KISAdapter()

    const result = await adapter.connect(credentials)

    expect(result.connected).toBe(true)
    expect(result.accountNo).toBe(credentials.accountNo)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        'https://openapivts.koreainvestment.com:29443/oauth2/tokenP'
      ),
      expect.any(Object)
    )
  })

  it('getPrice returns correct shape', async () => {
    mockTokenResponse()
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output: {
          stck_prpr: '70100',
          acml_vol: '12000',
          stck_hgpr: '71000',
          stck_lwpr: '69000',
          stck_oprc: '70000',
        },
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)

    const price = await adapter.getPrice('005930')

    expect(price).toMatchObject({
      symbol: '005930',
      price: 70100,
      volume: 12000,
      high: 71000,
      low: 69000,
      open: 70000,
    })
    expect(typeof price.timestamp).toBe('string')
  })

  it('placeOrder returns orderId and status', async () => {
    mockTokenResponse()
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output: {
          ODNO: 'ORDER-001',
        },
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)

    const result = await adapter.placeOrder({
      symbol: '005930',
      side: 'buy',
      quantity: 1,
      price: 70000,
      orderType: 'limit',
    })

    expect(result.orderId).toBe('ORDER-001')
    expect(result.status).toBe('submitted')
  })

  it('getBalance returns cash and positions', async () => {
    mockTokenResponse()
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output1: [
          {
            pdno: '005930',
            hldg_qty: '2',
            pchs_avg_pric: '70000',
            prpr: '71000',
            evlu_pfls_amt: '2000',
          },
        ],
        output2: [
          {
            dnca_tot_amt: '900000',
            tot_evlu_amt: '1020000',
          },
        ],
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)

    const balance = await adapter.getBalance()

    expect(balance.cash).toBe(900000)
    expect(balance.totalValue).toBe(1020000)
    expect(balance.positions[0]).toMatchObject({
      symbol: '005930',
      quantity: 2,
      avgPrice: 70000,
    })
  })

  it('cancelOrder returns success', async () => {
    mockTokenResponse()
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output: { ODNO: 'ORDER-002' },
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)
    const order = await adapter.placeOrder({
      symbol: '005930',
      side: 'buy',
      quantity: 1,
      price: 70000,
      orderType: 'limit',
    })

    const result = await adapter.cancelOrder(order.orderId)

    expect(result.success).toBe(true)
  })

  it('getOrderStatus returns order details', async () => {
    mockTokenResponse()
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output: { ODNO: 'ORDER-003' },
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)
    const order = await adapter.placeOrder({
      symbol: '005930',
      side: 'sell',
      quantity: 2,
      price: 71000,
      orderType: 'limit',
    })

    const status = await adapter.getOrderStatus(order.orderId)

    expect(status).toMatchObject({
      orderId: 'ORDER-003',
      symbol: '005930',
      side: 'sell',
      quantity: 2,
      status: 'submitted',
    })
  })

  it('masks API key in logs', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    logRequest('GET', 'https://example.com', {
      appkey: 'ABCD1234',
      appsecret: 'SECRET5678',
      authorization: 'Bearer TOKEN9999',
    })

    const output = JSON.stringify(logSpy.mock.calls)
    expect(output).not.toContain('ABCD1234')
    expect(output).not.toContain('SECRET5678')
    expect(output).not.toContain('TOKEN9999')
    expect(output).toContain('****1234')
    expect(output).toContain('****5678')
    expect(output).toContain('****9999')
  })

  it('retries on 429 with backoff', async () => {
    mockTokenResponse()
    fetchMock
      .mockResolvedValueOnce(
        createResponse(429, {
          rt_cd: '1',
          msg_cd: 'EGW00201',
          msg1: 'too many requests',
        }) as never
      )
      .mockResolvedValueOnce(
        createResponse(429, {
          rt_cd: '1',
          msg_cd: 'EGW00201',
          msg1: 'too many requests',
        }) as never
      )
      .mockResolvedValueOnce(
        createResponse(200, {
          rt_cd: '0',
          msg_cd: '0',
          msg1: 'OK',
          output: {
            stck_prpr: '70000',
            acml_vol: '100',
            stck_hgpr: '70100',
            stck_lwpr: '69900',
            stck_oprc: '70000',
          },
        }) as never
      )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)

    const started = Date.now()
    await adapter.getPrice('005930')
    const elapsed = Date.now() - started

    expect(fetchMock).toHaveBeenCalledTimes(4)
    expect(elapsed).toBeGreaterThanOrEqual(2900)
  })

  it('throws on network timeout', async () => {
    mockTokenResponse()
    fetchMock.mockImplementationOnce(
      (_url: unknown, options: { signal?: AbortSignal } | undefined) =>
        new Promise((_, reject) => {
          options?.signal?.addEventListener('abort', () => {
            const error = new Error('aborted')
            error.name = 'AbortError'
            reject(error)
          })
        }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)

    await expect(adapter.getPrice('005930')).rejects.toThrow('Network timeout')
  }, 12000)

  it('refreshes token before expiry', async () => {
    mockTokenResponse('TOKEN_OLD_1111', 3600)
    mockTokenResponse('TOKEN_NEW_2222', 3600)
    fetchMock.mockResolvedValueOnce(
      createResponse(200, {
        rt_cd: '0',
        msg_cd: '0',
        msg1: 'OK',
        output: {
          stck_prpr: '70000',
          acml_vol: '100',
          stck_hgpr: '70100',
          stck_lwpr: '69900',
          stck_oprc: '70000',
        },
      }) as never
    )

    const adapter = new KISAdapter()
    await adapter.connect(credentials)
    ;(adapter as unknown as { tokenExpiry: number }).tokenExpiry =
      Date.now() + 30_000
    await adapter.getPrice('005930')

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).includes('/oauth2/tokenP')
    )
    expect(tokenCalls).toHaveLength(2)
  })
})
