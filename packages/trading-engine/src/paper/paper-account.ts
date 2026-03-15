export interface PaperPosition {
  symbol: string
  quantity: number
  avgPrice: number
  currentPrice: number
}

export interface PaperTradeRecord {
  symbol: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  commission: number
  realizedPnl: number
  timestamp: string
}

const DAY_IN_MS = 24 * 60 * 60 * 1000

export class PaperAccount {
  private cash: number
  private positions: Map<string, PaperPosition> = new Map()
  private trades: PaperTradeRecord[] = []
  private startDate: Date

  constructor(initialCash: number) {
    this.cash = initialCash
    this.startDate = new Date()
  }

  buy(
    symbol: string,
    quantity: number,
    price: number,
    commission: number
  ): void {
    const cost = quantity * price + commission
    if (cost > this.cash) {
      throw new Error('잔고 부족')
    }

    this.cash -= cost

    const existing = this.positions.get(symbol)
    if (!existing) {
      this.positions.set(symbol, {
        symbol,
        quantity,
        avgPrice: price,
        currentPrice: price,
      })
    } else {
      const totalQuantity = existing.quantity + quantity
      const weightedPrice =
        (existing.avgPrice * existing.quantity + price * quantity) /
        totalQuantity

      this.positions.set(symbol, {
        ...existing,
        quantity: totalQuantity,
        avgPrice: weightedPrice,
        currentPrice: price,
      })
    }

    this.trades.push({
      symbol,
      side: 'buy',
      quantity,
      price,
      commission,
      realizedPnl: 0,
      timestamp: new Date().toISOString(),
    })
  }

  sell(
    symbol: string,
    quantity: number,
    price: number,
    commission: number
  ): number {
    const existing = this.positions.get(symbol)
    if (!existing || existing.quantity < quantity) {
      throw new Error('보유 수량 부족')
    }

    const proceeds = quantity * price - commission
    const costBasis = quantity * existing.avgPrice
    const realizedPnl = proceeds - costBasis

    this.cash += proceeds

    const remainingQuantity = existing.quantity - quantity
    if (remainingQuantity === 0) {
      this.positions.delete(symbol)
    } else {
      this.positions.set(symbol, {
        ...existing,
        quantity: remainingQuantity,
        currentPrice: price,
      })
    }

    this.trades.push({
      symbol,
      side: 'sell',
      quantity,
      price,
      commission,
      realizedPnl,
      timestamp: new Date().toISOString(),
    })

    return realizedPnl
  }

  getBalance(): number {
    return this.cash
  }

  getPositions(): PaperPosition[] {
    return Array.from(this.positions.values()).map((position) => ({
      ...position,
    }))
  }

  getTrades(): PaperTradeRecord[] {
    return this.trades.map((trade) => ({ ...trade }))
  }

  getDaysSinceStart(): number {
    const elapsed = Date.now() - this.startDate.getTime()
    return Math.floor(elapsed / DAY_IN_MS)
  }

  canSwitchToLive(): boolean {
    return this.getDaysSinceStart() >= 30
  }
}
