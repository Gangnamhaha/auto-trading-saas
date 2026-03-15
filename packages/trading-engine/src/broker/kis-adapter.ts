import fetch, { type RequestInit, type Response } from 'node-fetch'

import { logRequest } from './logger'
import { RateLimiter } from './rate-limiter'
import type {
  AccountBalance,
  BrokerCredentials,
  ConnectionStatus,
  IBroker,
  OrderRequest,
  OrderResult,
  Position,
  PriceData,
} from './types'

const DEMO_URL = 'https://openapivts.koreainvestment.com:29443'
const REAL_URL = 'https://openapi.koreainvestment.com:9443'

const PRICE_TR_ID = 'FHKST01010100'

const ORDER_TR_ID = {
  demo: { buy: 'VTTC0802U', sell: 'VTTC0801U' },
  real: { buy: 'TTTC0802U', sell: 'TTTC0801U' },
} as const

const BALANCE_TR_ID = {
  demo: 'VTTC8434R',
  real: 'TTTC8434R',
} as const

interface KisResponse<T = Record<string, unknown>> {
  rt_cd: string
  msg_cd: string
  msg1: string
  output?: T
  output1?: Record<string, unknown>[]
  output2?: Record<string, unknown>[]
}

interface TokenResponse {
  access_token: string
  expires_in: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function splitAccountNo(accountNo: string): {
  cano: string
  acntPrdtCd: string
} {
  const normalized = accountNo.replace(/\s+/g, '')

  if (/^\d{8}-\d{2}$/.test(normalized)) {
    const [cano, acntPrdtCd] = normalized.split('-')
    return { cano, acntPrdtCd }
  }

  if (/^\d{10}$/.test(normalized)) {
    return {
      cano: normalized.slice(0, 8),
      acntPrdtCd: normalized.slice(8),
    }
  }

  throw new Error('accountNo format must be 12345678-01 or 1234567801')
}

export class KISAdapter implements IBroker {
  private baseUrl = ''
  private accessToken: string | null = null
  private tokenExpiry = 0
  private rateLimiter: RateLimiter
  private credentials: BrokerCredentials | null = null
  private readonly orders = new Map<string, OrderResult>()

  constructor() {
    this.rateLimiter = new RateLimiter(5, 5)
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.credentials = credentials
    this.baseUrl = credentials.env === 'demo' ? DEMO_URL : REAL_URL
    await this.refreshToken()
    return { connected: true, accountNo: credentials.accountNo }
  }

  async disconnect(): Promise<void> {
    this.accessToken = null
    this.tokenExpiry = 0
    this.credentials = null
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    const credentials = this.requireCredentials()
    const account = splitAccountNo(credentials.accountNo)
    const params = new URLSearchParams({
      CANO: account.cano,
      ACNT_PRDT_CD: account.acntPrdtCd,
      AFHR_FLPR_YN: 'N',
      OFL_YN: '',
      INQR_DVSN: '02',
      UNPR_DVSN: '01',
      FUND_STTL_ICLD_YN: 'N',
      FNCG_AMT_AUTO_RDPT_YN: 'N',
      PRCS_DVSN: '00',
      CTX_AREA_FK100: '',
      CTX_AREA_NK100: '',
    })

    const data = await this.requestJson(
      `/uapi/domestic-stock/v1/trading/inquire-balance?${params.toString()}`,
      { method: 'GET' },
      BALANCE_TR_ID[credentials.env]
    )

    const positions = (data.output1 ?? []).map((item) => this.toPosition(item))
    const summary = data.output2?.[0] ?? {}
    const cash = toNumber(summary.dnca_tot_amt)
    const totalValue = toNumber(summary.tot_evlu_amt)

    return {
      cash,
      totalValue,
      positions,
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const params = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: 'J',
      FID_INPUT_ISCD: symbol,
    })

    const data = await this.requestJson(
      `/uapi/domestic-stock/v1/quotations/inquire-price?${params.toString()}`,
      { method: 'GET' },
      PRICE_TR_ID
    )

    const output = data.output ?? {}

    return {
      symbol,
      price: toNumber(output.stck_prpr),
      volume: toNumber(output.acml_vol),
      timestamp: new Date().toISOString(),
      high: toNumber(output.stck_hgpr),
      low: toNumber(output.stck_lwpr),
      open: toNumber(output.stck_oprc),
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const credentials = this.requireCredentials()
    const account = splitAccountNo(credentials.accountNo)
    const trId = ORDER_TR_ID[credentials.env][order.side]
    const isMarket = order.orderType === 'market'

    const data = await this.requestJson(
      '/uapi/domestic-stock/v1/trading/order-cash',
      {
        method: 'POST',
        body: JSON.stringify({
          CANO: account.cano,
          ACNT_PRDT_CD: account.acntPrdtCd,
          PDNO: order.symbol,
          ORD_DVSN: isMarket ? '01' : '00',
          ORD_QTY: String(order.quantity),
          ORD_UNPR: isMarket ? '0' : String(order.price ?? 0),
        }),
      },
      trId
    )

    const orderId = String(data.output?.ODNO ?? `mock-${Date.now()}`)
    const result: OrderResult = {
      orderId,
      status: 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: isMarket ? 0 : (order.price ?? 0),
    }

    this.orders.set(orderId, result)
    return result
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    const existing = this.orders.get(orderId)
    if (!existing) {
      return { success: false }
    }

    this.orders.set(orderId, {
      ...existing,
      status: 'cancelled',
    })

    return { success: true }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    return order
  }

  private async refreshToken(): Promise<void> {
    const credentials = this.requireCredentials()
    const now = Date.now()

    if (this.accessToken && this.tokenExpiry - now > 60_000) {
      return
    }

    const response = await this.fetchWithRetry(
      `${this.baseUrl}/oauth2/tokenP`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: credentials.appKey,
          appsecret: credentials.appSecret,
        }),
      }
    )

    const data = (await response.json()) as KisResponse<TokenResponse> &
      TokenResponse

    if (!response.ok || data.rt_cd !== '0' || !data.access_token) {
      throw new Error(`Failed to refresh token: ${data.msg_cd} ${data.msg1}`)
    }

    this.accessToken = data.access_token
    this.tokenExpiry = now + toNumber(data.expires_in) * 1000
  }

  private async getHeaders(trId: string): Promise<Record<string, string>> {
    await this.refreshToken()
    const credentials = this.requireCredentials()
    const token = this.accessToken

    if (!token) {
      throw new Error('Missing access token')
    }

    return {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      appkey: credentials.appKey,
      appsecret: credentials.appSecret,
      tr_id: trId,
      custtype: 'P',
    }
  }

  private async requestJson<T extends Record<string, unknown>>(
    path: string,
    options: RequestInit,
    trId: string,
    canRetryAuth = true
  ): Promise<KisResponse<T>> {
    const headers = {
      ...(await this.getHeaders(trId)),
      ...(options.headers as Record<string, string> | undefined),
    }

    const url = `${this.baseUrl}${path}`
    const method = options.method ?? 'GET'
    logRequest(method, url, headers)

    const response = await this.fetchWithRetry(url, {
      ...options,
      headers,
    })

    const data = (await response.json()) as KisResponse<T>

    if (canRetryAuth && data.msg_cd === 'EGW00123') {
      this.tokenExpiry = 0
      await this.refreshToken()
      return this.requestJson<T>(path, options, trId, false)
    }

    if (!response.ok || data.rt_cd !== '0') {
      throw new Error(`KIS API error: ${data.msg_cd} ${data.msg1}`)
    }

    return data
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.status === 429) {
          await sleep(Math.pow(2, attempt) * 1000)
          continue
        }

        if (response.status >= 500) {
          await sleep(1000)
          continue
        }

        return response
      } catch (error) {
        clearTimeout(timeout)

        if (
          error instanceof Error &&
          (error.name === 'AbortError' || /aborted/i.test(error.message))
        ) {
          throw new Error('Network timeout')
        }

        if (attempt === maxRetries - 1) {
          throw error
        }

        await sleep(1000)
      }
    }

    throw new Error('Max retries exceeded')
  }

  private requireCredentials(): BrokerCredentials {
    if (!this.credentials) {
      throw new Error('Broker is not connected')
    }

    return this.credentials
  }

  private toPosition(item: Record<string, unknown>): Position {
    return {
      symbol: String(item.pdno ?? ''),
      quantity: toNumber(item.hldg_qty),
      avgPrice: toNumber(item.pchs_avg_pric),
      currentPrice: toNumber(item.prpr),
      pnl: toNumber(item.evlu_pfls_amt),
    }
  }
}
