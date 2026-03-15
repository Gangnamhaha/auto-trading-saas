export interface ConnectionStatus {
  connected: boolean
  accountNo?: string
  error?: string
}

export interface AccountBalance {
  cash: number
  totalValue: number
  positions: Position[]
}

export interface Position {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
  pnl: number
}

export interface PriceData {
  symbol: string
  price: number
  volume: number
  timestamp: string
  high: number
  low: number
  open: number
}

export interface OrderRequest {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price?: number
  orderType: 'limit' | 'market'
}

export interface OrderResult {
  orderId: string
  status: 'submitted' | 'filled' | 'rejected' | 'cancelled'
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
}

export interface IBroker {
  connect(credentials: BrokerCredentials): Promise<ConnectionStatus>
  disconnect(): Promise<void>
  getBalance(): Promise<AccountBalance>
  getPrice(symbol: string): Promise<PriceData>
  placeOrder(order: OrderRequest): Promise<OrderResult>
  cancelOrder(orderId: string): Promise<{ success: boolean }>
  getOrderStatus(orderId: string): Promise<OrderResult>
}

export interface BrokerCredentials {
  appKey: string
  appSecret: string
  accountNo: string
  env: 'demo' | 'real'
}
