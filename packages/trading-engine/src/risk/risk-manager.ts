import type { OrderRequest, Position } from '../broker/types'
import { CircuitBreaker } from './circuit-breaker'
import { RiskViolationError, type RiskConfig } from './types'

export class RiskManager {
  private dailyTrades = 0
  private lastTradeDate = ''

  constructor(
    private config: RiskConfig,
    private circuitBreaker: CircuitBreaker
  ) {}

  validateOrder(
    order: OrderRequest,
    accountBalance: number,
    currentPositions: Position[]
  ): void {
    this.checkAndResetDailyTrades()

    if (this.circuitBreaker.isTripped()) {
      throw new RiskViolationError({
        type: 'CIRCUIT_BREAKER',
        message: '일일 손실 한도 초과로 당일 거래가 중단되었습니다.',
        currentValue: this.circuitBreaker.getDailyLoss(),
        limitValue: this.config.maxDailyLossPercent,
      })
    }

    const orderValue = order.quantity * (order.price ?? 0)
    const maxAllowedPositionValue =
      accountBalance * (this.config.maxPositionSizePercent / 100)

    if (orderValue > maxAllowedPositionValue) {
      throw new RiskViolationError({
        type: 'POSITION_SIZE',
        message: `주문 금액(${orderValue}원)이 최대 허용 포지션(${maxAllowedPositionValue}원)을 초과합니다.`,
        currentValue: orderValue,
        limitValue: maxAllowedPositionValue,
      })
    }

    if (this.dailyTrades >= this.config.maxDailyTrades) {
      throw new RiskViolationError({
        type: 'DAILY_TRADES',
        message: `일일 최대 거래 횟수(${this.config.maxDailyTrades}회)를 초과했습니다.`,
        currentValue: this.dailyTrades,
        limitValue: this.config.maxDailyTrades,
      })
    }

    if (order.side === 'buy') {
      const current = currentPositions.find((p) => p.symbol === order.symbol)
      const currentQuantity = current?.quantity ?? 0
      const projectedQuantity = currentQuantity + order.quantity
      const refPrice =
        order.price ?? current?.currentPrice ?? current?.avgPrice ?? 0
      const projectedPositionValue = projectedQuantity * refPrice
      const maxSingleStockValue =
        accountBalance * (this.config.maxSingleStockPercent / 100)

      if (projectedPositionValue > maxSingleStockValue) {
        throw new RiskViolationError({
          type: 'SINGLE_STOCK',
          message: `단일 종목 비중(${projectedPositionValue}원)이 허용 한도(${maxSingleStockValue}원)를 초과합니다.`,
          currentValue: projectedPositionValue,
          limitValue: maxSingleStockValue,
        })
      }
    }
  }

  recordTrade(pnl: number, accountBalance: number): void {
    this.checkAndResetDailyTrades()
    this.dailyTrades += 1
    this.circuitBreaker.recordLoss(pnl, accountBalance)
  }

  getDailyTradeCount(): number {
    this.checkAndResetDailyTrades()
    return this.dailyTrades
  }

  private checkAndResetDailyTrades(): void {
    const today = new Date().toISOString().split('T')[0]
    if (this.lastTradeDate !== today) {
      this.dailyTrades = 0
      this.lastTradeDate = today
    }
  }
}
