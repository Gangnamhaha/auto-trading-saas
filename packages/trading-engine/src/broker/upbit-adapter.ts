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

export class UpbitAdapter implements IBroker {
  private accessKey = ''
  private secretKey = ''
  private baseUrl = 'https://api.upbit.com'
  private rateLimiter: RateLimiter

  constructor() {
    this.rateLimiter = new RateLimiter(8, 8) // 8 req/s
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.accessKey = credentials.appKey
    this.secretKey = credentials.appSecret

    try {
      await this.rateLimiter.acquire()
      const response = await fetch(`${this.baseUrl}/v1/market/all`)
      if (response.ok) {
        return { connected: true, accountNo: 'upbit' }
      }
      return { connected: false, error: 'Upbit connection failed' }
    } catch (err) {
      return { connected: false, error: String(err) }
    }
  }

  async disconnect(): Promise<void> {
    this.accessKey = ''
    this.secretKey = ''
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const market = symbol.includes('-') ? symbol : `KRW-${symbol}`
    const url = `${this.baseUrl}/v1/ticker?markets=${market}`
    logRequest('GET', url, {})

    const response = await fetch(url)
    const data = (await response.json()) as Array<{
      trade_price: number
      acc_trade_volume_24h: number
      high_price: number
      low_price: number
      opening_price: number
      trade_timestamp: number
    }>

    const ticker = data[0]
    return {
      symbol,
      price: ticker.trade_price,
      volume: ticker.acc_trade_volume_24h,
      timestamp: new Date(ticker.trade_timestamp).toISOString(),
      high: ticker.high_price,
      low: ticker.low_price,
      open: ticker.opening_price,
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const market = order.symbol.includes('-')
      ? order.symbol
      : `KRW-${order.symbol}`
    const url = `${this.baseUrl}/v1/orders`

    const body = {
      market,
      side: order.side === 'buy' ? 'bid' : 'ask',
      ord_type:
        order.orderType === 'market'
          ? order.side === 'buy'
            ? 'price'
            : 'market'
          : 'limit',
      ...(order.orderType === 'limit'
        ? { price: String(order.price), volume: String(order.quantity) }
        : {}),
      ...(order.orderType === 'market' && order.side === 'buy'
        ? { price: String((order.price ?? 0) * order.quantity) }
        : {}),
      ...(order.orderType === 'market' && order.side === 'sell'
        ? { volume: String(order.quantity) }
        : {}),
    }

    logRequest('POST', url, { Authorization: `Bearer ****` })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessKey}`,
      },
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as {
      uuid: string
      state: string
      side: string
    }

    return {
      orderId: data.uuid,
      status: data.state === 'done' ? 'filled' : 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? 0,
    }
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/v1/accounts`

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessKey}` },
    })
    const data = (await response.json()) as Array<{
      currency: string
      balance: string
      locked: string
      avg_buy_price: string
    }>

    const krwAccount = data.find((a) => a.currency === 'KRW')
    const positions = data
      .filter((a) => a.currency !== 'KRW' && Number(a.balance) > 0)
      .map((a) => ({
        symbol: `KRW-${a.currency}`,
        quantity: Number(a.balance),
        avgPrice: Number(a.avg_buy_price),
        currentPrice: 0,
        pnl: 0,
      }))

    return {
      cash: Number(krwAccount?.balance ?? 0),
      totalValue: Number(krwAccount?.balance ?? 0),
      positions,
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/v1/order?uuid=${orderId}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.accessKey}` },
    })
    return { success: response.ok }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const url = `${this.baseUrl}/v1/order?uuid=${orderId}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.accessKey}` },
    })
    const data = (await response.json()) as {
      uuid: string
      state: string
      side: string
      volume: string
      price: string
      market: string
    }

    return {
      orderId: data.uuid,
      status:
        data.state === 'done'
          ? 'filled'
          : data.state === 'cancel'
            ? 'cancelled'
            : 'submitted',
      symbol: data.market,
      side: data.side === 'bid' ? 'buy' : 'sell',
      quantity: Number(data.volume),
      price: Number(data.price),
    }
  }
}
