import type {
  AccountBalance,
  BrokerCredentials,
  ConnectionStatus,
  IBroker,
  OrderRequest,
  OrderResult,
  PriceData,
} from '../broker/types'
import { PaperAccount } from './paper-account'

export class PaperBroker implements IBroker {
  private account: PaperAccount
  private connected = false
  private readonly orders = new Map<string, OrderResult>()

  constructor(initialCash: number = 10_000_000) {
    this.account = new PaperAccount(initialCash)
  }

  async connect(_credentials: BrokerCredentials): Promise<ConnectionStatus> {
    this.connected = true
    return { connected: true, accountNo: 'PAPER-ACCOUNT' }
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async getBalance(): Promise<AccountBalance> {
    this.ensureConnected()
    const cash = this.account.getBalance()
    const positions = this.account.getPositions().map((position) => ({
      symbol: position.symbol,
      quantity: position.quantity,
      avgPrice: position.avgPrice,
      currentPrice: position.currentPrice,
      pnl: (position.currentPrice - position.avgPrice) * position.quantity,
    }))
    const positionsValue = positions.reduce(
      (sum, position) => sum + position.currentPrice * position.quantity,
      0
    )

    return {
      cash,
      totalValue: cash + positionsValue,
      positions,
    }
  }

  async getPrice(symbol: string): Promise<PriceData> {
    this.ensureConnected()
    const position = this.account
      .getPositions()
      .find((item) => item.symbol === symbol)
    const mockPrice = position?.currentPrice ?? 0

    return {
      symbol,
      price: mockPrice,
      volume: 0,
      timestamp: new Date().toISOString(),
      high: mockPrice,
      low: mockPrice,
      open: mockPrice,
    }
  }

  async placeOrder(order: OrderRequest): Promise<OrderResult> {
    this.ensureConnected()
    const price = order.price ?? 0

    if (price <= 0) {
      throw new Error('페이퍼 주문 가격은 0보다 커야 합니다.')
    }

    const commission = order.quantity * price * 0.00015
    if (order.side === 'buy') {
      this.account.buy(order.symbol, order.quantity, price, commission)
    } else {
      this.account.sell(order.symbol, order.quantity, price, commission)
    }

    const orderId = `PAPER-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const result: OrderResult = {
      orderId,
      status: 'submitted',
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price,
    }

    this.orders.set(orderId, result)
    return result
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean }> {
    this.ensureConnected()
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
    this.ensureConnected()
    const order = this.orders.get(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    return order
  }

  canSwitchToLive(): boolean {
    return this.account.canSwitchToLive()
  }

  switchToLive(): void {
    if (!this.account.canSwitchToLive()) {
      throw new Error(
        '30일 이상 페이퍼트레이딩 이후에만 실전 전환이 가능합니다.'
      )
    }
  }

  getPaperAccount(): PaperAccount {
    return this.account
  }

  private ensureConnected(): void {
    if (!this.connected) {
      throw new Error('Broker is not connected')
    }
  }
}
