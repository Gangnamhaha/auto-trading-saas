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
 * 키움증권 OpenAPI+ 어댑터
 *
 * ⚠️ 키움 OpenAPI+는 Windows COM 기반이므로 직접 Node.js에서 호출 불가
 *
 * 아키텍처:
 * [우리 엔진 (Node.js)] ←HTTP→ [키움 프록시 서버 (Windows/Python)] ←COM→ [키움 OpenAPI+]
 *
 * 키움 프록시 서버는 별도 Windows PC에서 실행:
 * - Python + PyQt5 + 키움 OpenAPI 연동
 * - REST API로 주문/조회 기능 노출
 * - 기본 포트: 5000
 *
 * 프록시 서버 예시: https://github.com/pjueon/kiwoom-rest-api
 */
export class KiwoomAdapter implements IBroker {
  private proxyUrl: string
  private rateLimiter: RateLimiter
  private connected = false

  constructor(proxyUrl?: string) {
    this.proxyUrl = proxyUrl ?? 'http://localhost:5000'
    this.rateLimiter = new RateLimiter(5, 5) // 키움 초당 5회 제한
  }

  async connect(credentials: BrokerCredentials): Promise<ConnectionStatus> {
    // 프록시 URL을 credentials에서 가져오거나 기본값 사용
    if (credentials.appKey) {
      this.proxyUrl = credentials.appKey // appKey 필드를 프록시 URL로 활용
    }

    try {
      await this.rateLimiter.acquire()
      const response = await fetch(`${this.proxyUrl}/api/status`)
      if (response.ok) {
        const data = (await response.json()) as {
          connected: boolean
          account_no: string
        }
        this.connected = data.connected
        return {
          connected: data.connected,
          accountNo: data.account_no,
        }
      }
      return { connected: false, error: '키움 프록시 서버 연결 실패' }
    } catch (err) {
      return {
        connected: false,
        error: `키움 프록시 서버(${this.proxyUrl})에 연결할 수 없습니다. Windows PC에서 프록시 서버가 실행 중인지 확인하세요. 에러: ${String(err)}`,
      }
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getPrice(symbol: string): Promise<PriceData> {
    await this.rateLimiter.acquire()
    const url = `${this.proxyUrl}/api/price/${symbol}`
    logRequest('GET', url, {})

    const response = await fetch(url)
    const data = (await response.json()) as {
      symbol: string
      price: number
      volume: number
      high: number
      low: number
      open: number
    }

    return {
      symbol: data.symbol,
      price: data.price,
      volume: data.volume,
      timestamp: new Date().toISOString(),
      high: data.high,
      low: data.low,
      open: data.open,
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const url = `${this.proxyUrl}/api/order`
    logRequest('POST', url, {})

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: order.symbol,
        side: order.side,
        quantity: order.quantity,
        price: order.price ?? 0,
        order_type: order.orderType,
      }),
    })
    const data = (await response.json()) as {
      order_id: string
      status: string
    }

    return {
      orderId: data.order_id,
      status: data.status === 'filled' ? 'filled' : 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price ?? 0,
    }
  }

  async getBalance(): Promise<AccountBalance> {
    await this.rateLimiter.acquire()
    const url = `${this.proxyUrl}/api/balance`

    const response = await fetch(url)
    const data = (await response.json()) as {
      cash: number
      total_value: number
      positions: Array<{
        symbol: string
        quantity: number
        avg_price: number
        current_price: number
        pnl: number
      }>
    }

    return {
      cash: data.cash,
      totalValue: data.total_value,
      positions: data.positions.map((p) => ({
        symbol: p.symbol,
        quantity: p.quantity,
        avgPrice: p.avg_price,
        currentPrice: p.current_price,
        pnl: p.pnl,
      })),
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    await this.rateLimiter.acquire()
    const response = await fetch(`${this.proxyUrl}/api/order/${orderId}`, {
      method: 'DELETE',
    })
    return { success: response.ok }
  }

  async getOrderStatus(orderId: string): Promise<OrderResult> {
    await this.rateLimiter.acquire()
    const response = await fetch(`${this.proxyUrl}/api/order/${orderId}`)
    const data = (await response.json()) as {
      order_id: string
      status: string
      symbol: string
      side: string
      quantity: number
      price: number
    }

    return {
      orderId: data.order_id,
      status:
        data.status === 'filled'
          ? 'filled'
          : data.status === 'cancelled'
            ? 'cancelled'
            : 'submitted',
      symbol: data.symbol,
      side: data.side as 'buy' | 'sell',
      quantity: data.quantity,
      price: data.price,
    }
  }

  isConnected(): boolean {
    return this.connected
  }

  getProxyUrl(): string {
    return this.proxyUrl
  }
}
