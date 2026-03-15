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
 * Alpaca 브로커 어댑터 — 미국 주식 전용
 * Alpaca Markets API (https://alpaca.markets)
 * 무료 계정으로 미국 주식 자동매매 가능
 * Paper Trading 지원
 */
export class AlpacaAdapter implements IBroker {
  private apiKey = ''
  private apiSecret = ''
  private baseUrl = ''
  private dataUrl = 'https://data.alpaca.markets'
  private rateLimiter: RateLimiter

  constructor() {
    this.rateLimiter = new RateLimiter(3, 3) // 200 req/min ≈ 3/s
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.apiKey = credentials.appKey
    this.apiSecret = credentials.appSecret
    this.baseUrl =
      credentials.env === 'demo'
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets'

    try {
      await this.rateLimiter.acquire()
      const response = await fetch(`${this.baseUrl}/v2/account`, {
        headers: this.getAuthHeaders(),
      })
      if (response.ok) {
        const account = (await response.json()) as {
          id: string
          status: string
        }
        return { connected: true, accountNo: account.id }
      }
      return {
        connected: false,
        error: `Alpaca auth failed: ${response.status}`,
      }
    } catch (err) {
      return { connected: false, error: String(err) }
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = ''
    this.apiSecret = ''
  }

  private getAuthHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const url = `${this.dataUrl}/v2/stocks/${symbol}/quotes/latest`
    logRequest('GET', url, { 'APCA-API-KEY-ID': '****' })

    const response = await fetch(url, { headers: this.getAuthHeaders() })
    const data = (await response.json()) as {
      quote: { ap: number; as: number; bp: number; bs: number; t: string }
    }

    const midPrice = (data.quote.ap + data.quote.bp) / 2
    return {
      symbol,
      price: midPrice,
      volume: data.quote.as + data.quote.bs,
      timestamp: data.quote.t,
      high: data.quote.ap,
      low: data.quote.bp,
      open: midPrice,
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/v2/orders`
    logRequest('POST', url, { 'APCA-API-KEY-ID': '****' })

    const body = {
      symbol: order.symbol,
      qty: String(order.quantity),
      side: order.side,
      type: order.orderType === 'market' ? 'market' : 'limit',
      time_in_force: 'day',
      ...(order.orderType === 'limit' && order.price
        ? { limit_price: String(order.price) }
        : {}),
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as {
      id: string
      status: string
      symbol: string
      side: string
      qty: string
      filled_avg_price: string | null
    }

    return {
      orderId: data.id,
      status:
        data.status === 'filled'
          ? 'filled'
          : data.status === 'canceled'
            ? 'cancelled'
            : 'submitted',
      symbol: data.symbol,
      side: data.side as 'buy' | 'sell',
      quantity: Number(data.qty),
      price: Number(data.filled_avg_price ?? order.price ?? 0),
    }
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    const [accountRes, positionsRes] = await Promise.all([
      fetch(`${this.baseUrl}/v2/account`, { headers: this.getAuthHeaders() }),
      fetch(`${this.baseUrl}/v2/positions`, { headers: this.getAuthHeaders() }),
    ])

    const account = (await accountRes.json()) as {
      cash: string
      portfolio_value: string
    }
    const positions = (await positionsRes.json()) as Array<{
      symbol: string
      qty: string
      avg_entry_price: string
      current_price: string
      unrealized_pl: string
    }>

    return {
      cash: Number(account.cash),
      totalValue: Number(account.portfolio_value),
      positions: positions.map((p) => ({
        symbol: p.symbol,
        quantity: Number(p.qty),
        avgPrice: Number(p.avg_entry_price),
        currentPrice: Number(p.current_price),
        pnl: Number(p.unrealized_pl),
      })),
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    await this.rateLimiter.acquire()
    const response = await fetch(`${this.baseUrl}/v2/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    })
    return { success: response.status === 204 || response.ok }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const response = await fetch(`${this.baseUrl}/v2/orders/${orderId}`, {
      headers: this.getAuthHeaders(),
    })
    const data = (await response.json()) as {
      id: string
      status: string
      symbol: string
      side: string
      qty: string
      filled_avg_price: string | null
    }

    return {
      orderId: data.id,
      status:
        data.status === 'filled'
          ? 'filled'
          : data.status === 'canceled'
            ? 'cancelled'
            : 'submitted',
      symbol: data.symbol,
      side: data.side as 'buy' | 'sell',
      quantity: Number(data.qty),
      price: Number(data.filled_avg_price ?? 0),
    }
  }
}
