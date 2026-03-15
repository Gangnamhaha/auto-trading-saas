export interface RiskConfig {
  maxPositionSizePercent: number
  maxDailyLossPercent: number
  maxDailyTrades: number
  maxSingleStockPercent: number
  stopLossPercent: number
}

export interface RiskViolation {
  type:
    | 'POSITION_SIZE'
    | 'DAILY_LOSS'
    | 'DAILY_TRADES'
    | 'SINGLE_STOCK'
    | 'CIRCUIT_BREAKER'
  message: string
  currentValue: number
  limitValue: number
}

export class RiskViolationError extends Error {
  constructor(public violation: RiskViolation) {
    super(violation.message)
    this.name = 'RiskViolationError'
  }
}
