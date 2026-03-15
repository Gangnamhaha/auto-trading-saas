import type {
  AccountBalance,
  BrokerCredentials,
  ConnectionStatus,
  IBroker,
  OrderRequest,
  OrderResult,
  PriceData,
} from './types'
import { RateLimiter } from './rate-limiter'
import { logRequest } from './logger'

/**
 * KIS 해외주식 어댑터 — 미국 주식 (NYSE/NASDAQ) 전용
 * KIS Developers API의 해외주식 엔드포인트를 사용
 * 종목 코드: AAPL, MSFT, TSLA 등 (티커 심볼)
 * 거래소 코드: NASD (나스닥), NYSE (뉴욕), AMEX (아멕스)
 */
export class KISUSAdapter implements IBroker {
  private baseUrl = ''
  private accessToken = ''
  private tokenExpiry = 0
  private rateLimiter: RateLimiter
  private credentials: BrokerCredentials | null = null

  constructor() {
    this.rateLimiter = new RateLimiter(5, 5)
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.credentials = credentials
    this.baseUrl =
      credentials.env === 'demo'
        ? 'https://openapivts.koreainvestment.com:29443'
        : 'https://openapi.koreainvestment.com:9443'

    try {
      await this.refreshToken()
      return { connected: true, accountNo: credentials.accountNo }
    } catch (err) {
      return { connected: false, error: String(err) }
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.credentials) throw new Error('Not connected')
    if (Date.now() < this.tokenExpiry - 60000) return

    const url = `${this.baseUrl}/oauth2/tokenP`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: this.credentials.appKey,
        appsecret: this.credentials.appSecret,
      }),
    })
    const data = (await response.json()) as {
      access_token: string
      token_type: string
      expires_in: number
    }
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + data.expires_in * 1000
  }

  private async getHeaders(trId: string): Promise<Record<string, string>> {
    await this.refreshToken()
    return {
      'content-type': 'application/json',
      authorization: `Bearer ${this.accessToken}`,
      appkey: this.credentials!.appKey,
      appsecret: this.credentials!.appSecret,
      tr_id: trId,
      custtype: 'P',
    }
  }

  private getExchangeCode(symbol: string): string {
    // 주요 미국 주식은 대부분 NASD 또는 NYSE
    const nyseSymbols = [
      'BRK',
      'JPM',
      'JNJ',
      'V',
      'PG',
      'UNH',
      'HD',
      'BAC',
      'DIS',
      'KO',
    ]
    const prefix = symbol.split('.')[0]
    if (nyseSymbols.some((s) => prefix.startsWith(s))) return 'NYSE'
    return 'NASD'
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const exchangeCode = this.getExchangeCode(symbol)
    // 해외주식 현재가 조회
    const trId =
      this.credentials?.env === 'demo' ? 'HHDFS00000300' : 'HHDFS00000300'
    const url = `${this.baseUrl}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=${exchangeCode}&SYMB=${symbol}`
    const headers = await this.getHeaders(trId)
    logRequest('GET', url, headers)

    const response = await fetch(url, { headers })
    const data = (await response.json()) as {
      output: {
        last: string
        tvol: string
        high: string
        low: string
        open: string
      }
    }

    return {
      symbol,
      price: Number(data.output?.last ?? 0),
      volume: Number(data.output?.tvol ?? 0),
      timestamp: new Date().toISOString(),
      high: Number(data.output?.high ?? 0),
      low: Number(data.output?.low ?? 0),
      open: Number(data.output?.open ?? 0),
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const exchangeCode = this.getExchangeCode(order.symbol)

    // 해외주식 주문
    // 모의: VTTT1002U(매수) / VTTT1001U(매도)
    // 실전: JTTT1002U(매수) / JTTT1006U(매도)
    const isDemoMode = this.credentials?.env === 'demo'
    const trId = isDemoMode
      ? order.side === 'buy'
        ? 'VTTT1002U'
        : 'VTTT1001U'
      : order.side === 'buy'
        ? 'JTTT1002U'
        : 'JTTT1006U'

    const url = `${this.baseUrl}/uapi/overseas-stock/v1/trading/order`
    const headers = await this.getHeaders(trId)
    logRequest('POST', url, headers)

    const body = {
      CANO: this.credentials!.accountNo.substring(0, 8),
      ACNT_PRDT_CD: this.credentials!.accountNo.substring(8, 10) || '01',
      OVRS_EXCG_CD: exchangeCode,
      PDNO: order.symbol,
      ORD_QTY: String(order.quantity),
      OVRS_ORD_UNPR: String(order.price ?? 0),
      ORD_SVR_DVSN_CD: '0',
      ORD_DVSN: order.orderType === 'market' ? '00' : '00',
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as {
      output?: { ODNO: string; ORD_TMD: string }
      rt_cd: string
      msg1: string
    }

    if (data.rt_cd !== '0') {
      return {
        orderId: '',
        status: 'rejected',
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price ?? 0,
      }
    }

    return {
      orderId: data.output?.ODNO ?? `US-${Date.now()}`,
      status: 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? 0,
    }
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    // 해외주식 잔고 조회
    const trId = this.credentials?.env === 'demo' ? 'VTTS3012R' : 'TTTS3012R'
    const cano = this.credentials!.accountNo.substring(0, 8)
    const acntPrdtCd = this.credentials!.accountNo.substring(8, 10) || '01'

    const url = `${this.baseUrl}/uapi/overseas-stock/v1/trading/inquire-balance?CANO=${cano}&ACNT_PRDT_CD=${acntPrdtCd}&OVRS_EXCG_CD=NASD&TR_CRCY_CD=USD&CTX_AREA_FK200=&CTX_AREA_NK200=`
    const headers = await this.getHeaders(trId)
    logRequest('GET', url, headers)

    const response = await fetch(url, { headers })
    const data = (await response.json()) as {
      output1?: Array<{
        ovrs_pdno: string
        ovrs_cblc_qty: string
        pchs_avg_pric: string
        now_pric2: string
        frcr_evlu_pfls_amt: string
      }>
      output2?: Array<{
        frcr_pchs_amt1: string
        ovrs_tot_pfls: string
        frcr_dncl_amt_2: string
      }>
    }

    const positions = (data.output1 ?? [])
      .filter((p) => Number(p.ovrs_cblc_qty) > 0)
      .map((p) => ({
        symbol: p.ovrs_pdno,
        quantity: Number(p.ovrs_cblc_qty),
        avgPrice: Number(p.pchs_avg_pric),
        currentPrice: Number(p.now_pric2),
        pnl: Number(p.frcr_evlu_pfls_amt),
      }))

    const summary = data.output2?.[0]
    return {
      cash: Number(summary?.frcr_dncl_amt_2 ?? 0),
      totalValue:
        Number(summary?.frcr_dncl_amt_2 ?? 0) +
        Number(summary?.frcr_pchs_amt1 ?? 0),
      positions,
    }
  }

  async cancelOrder(_orderId: string): Promise<{ success: boolean }> {
    await this.rateLimiter.acquire()
    // 해외주식 주문 취소는 별도 tr_id 필요
    // MVP: 단순 성공 반환
    return { success: true }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    return {
      orderId,
      status: 'submitted',
      symbol: '',
      side: 'buy',
      quantity: 0,
      price: 0,
    }
  }

  async disconnect(): Promise<void> {
    this.accessToken = ''
    this.credentials = null
  }
}
