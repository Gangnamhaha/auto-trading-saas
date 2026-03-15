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

export class BinanceAdapter implements IBroker {
  private apiKey = ''
  private apiSecret = ''
  private baseUrl = 'https://api.binance.com'
  private rateLimiter: RateLimiter

  constructor() {
    this.rateLimiter = new RateLimiter(10, 10) // 10 req/s
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.apiKey = credentials.appKey
    this.apiSecret = credentials.appSecret
    this.baseUrl =
      credentials.env === 'demo'
        ? 'https://testnet.binance.vision'
        : 'https://api.binance.com'

    try {
      await this.rateLimiter.acquire()
      const response = await fetch(`${this.baseUrl}/api/v3/ping`)
      if (response.ok) {
        return { connected: true, accountNo: 'binance' }
      }
      return { connected: false, error: 'Binance ping failed' }
    } catch (err) {
      return { connected: false, error: String(err) }
    }
  }

  async disconnect(): Promise<void> {
    this.apiKey = ''
    this.apiSecret = ''
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const binanceSymbol = symbol.toUpperCase()
    const url = `${this.baseUrl}/api/v3/ticker/24hr?symbol=${binanceSymbol}`
    logRequest('GET', url, {})

    const response = await fetch(url)
    const data = (await response.json()) as {
      lastPrice: string
      volume: string
      highPrice: string
      lowPrice: string
      openPrice: string
    }

    return {
      symbol,
      price: Number(data.lastPrice),
      volume: Number(data.volume),
      timestamp: new Date().toISOString(),
      high: Number(data.highPrice),
      low: Number(data.lowPrice),
      open: Number(data.openPrice),
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const binanceSymbol = order.symbol.toUpperCase()
    const url = `${this.baseUrl}/api/v3/order`
    const params = new URLSearchParams({
      symbol: binanceSymbol,
      side: order.side.toUpperCase(),
      type: order.orderType === 'market' ? 'MARKET' : 'LIMIT',
      quantity: String(order.quantity),
      ...(order.orderType === 'limit' && order.price
        ? { price: String(order.price), timeInForce: 'GTC' }
        : {}),
      timestamp: String(Date.now()),
    })

    logRequest('POST', url, { 'X-MBX-APIKEY': this.apiKey })

    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: { 'X-MBX-APIKEY': this.apiKey },
    })
    const data = (await response.json()) as { orderId: number; status: string }

    return {
      orderId: String(data.orderId),
      status: data.status === 'FILLED' ? 'filled' : 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? 0,
    }
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/api/v3/account?timestamp=${Date.now()}`

    const response = await fetch(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey },
    })
    const data = (await response.json()) as {
      balances: Array<{ asset: string; free: string; locked: string }>
    }

    const positions = (data.balances ?? [])
      .filter((b) => Number(b.free) > 0 || Number(b.locked) > 0)
      .map((b) => ({
        symbol: b.asset,
        quantity: Number(b.free) + Number(b.locked),
        avgPrice: 0,
        currentPrice: 0,
        pnl: 0,
      }))

    const usdtBalance = data.balances?.find((b) => b.asset === 'USDT')
    return {
      cash: Number(usdtBalance?.free ?? 0),
      totalValue: Number(usdtBalance?.free ?? 0),
      positions,
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/api/v3/order?orderId=${orderId}&timestamp=${Date.now()}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'X-MBX-APIKEY': this.apiKey },
    })
    return { success: response.ok }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/api/v3/order?orderId=${orderId}&timestamp=${Date.now()}`
    const response = await fetch(url, {
      headers: { 'X-MBX-APIKEY': this.apiKey },
    })
    const data = (await response.json()) as {
      orderId: number
      status: string
      side: string
      origQty: string
      price: string
      symbol: string
    }

    return {
      orderId: String(data.orderId),
      status:
        data.status === 'FILLED'
          ? 'filled'
          : data.status === 'CANCELED'
            ? 'cancelled'
            : 'submitted',
      symbol: data.symbol,
      side: data.side?.toLowerCase() as 'buy' | 'sell',
      quantity: Number(data.origQty),
      price: Number(data.price),
    }
  }
}
