import type { IStrategy, OHLCV } from '../strategy'

import type { BacktestConfig, BacktestResult, TradeRecord } from './types'

const TRADING_DAYS_PER_YEAR = 252
const RISK_FREE_RATE = 0.03

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    return 0
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length

  return Math.sqrt(variance)
}

function calculateMaxDrawdown(equityCurve: number[]): number {
  if (equityCurve.length === 0) {
    return 0
  }

  let peak = equityCurve[0]
  let maxDrawdown = 0

  for (const equity of equityCurve) {
    if (equity > peak) {
      peak = equity
    }

    if (peak <= 0) {
      continue
    }

    const drawdown = ((equity - peak) / peak) * 100
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return maxDrawdown
}

function calculateSharpeRatio(
  equityCurve: number[],
  initialCapital: number
): number {
  if (equityCurve.length < 2 || initialCapital <= 0) {
    return 0
  }

  const dailyReturns: number[] = []

  for (let i = 1; i < equityCurve.length; i += 1) {
    const prev = equityCurve[i - 1]
    const current = equityCurve[i]

    if (prev <= 0) {
      continue
    }

    dailyReturns.push((current - prev) / prev)
  }

  if (dailyReturns.length === 0) {
    return 0
  }

  const dailyStdDev = standardDeviation(dailyReturns)
  if (dailyStdDev === 0) {
    return 0
  }

  const annualStdDev = dailyStdDev * Math.sqrt(TRADING_DAYS_PER_YEAR)
  if (annualStdDev === 0) {
    return 0
  }

  const finalCapital = equityCurve[equityCurve.length - 1]
  const years = dailyReturns.length / TRADING_DAYS_PER_YEAR
  if (years <= 0 || finalCapital <= 0) {
    return 0
  }

  const annualReturn = Math.pow(finalCapital / initialCapital, 1 / years) - 1
  return (annualReturn - RISK_FREE_RATE) / annualStdDev
}

function validateConfig(config: BacktestConfig): void {
  if (config.initialCapital <= 0) {
    throw new Error('initialCapital must be greater than 0')
  }

  if (config.commissionRate < 0 || config.commissionRate >= 1) {
    throw new Error('commissionRate must be between 0 and 1')
  }

  if (config.slippageRate < 0 || config.slippageRate >= 1) {
    throw new Error('slippageRate must be between 0 and 1')
  }
}

export class BacktestEngine {
  constructor(private config: BacktestConfig) {
    validateConfig(config)
  }

  run(data: OHLCV[], strategy: IStrategy): BacktestResult {
    if (data.length === 0) {
      return {
        totalReturn: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        winRate: 0,
        totalTrades: 0,
        finalCapital: this.config.initialCapital,
        trades: [],
      }
    }

    const signals = strategy.analyze(data)
    if (signals.length !== data.length) {
      throw new Error('Strategy signal length must match data length')
    }

    let cash = this.config.initialCapital
    let quantity = 0
    let positionCost = 0

    const trades: TradeRecord[] = []
    const closedTradePnls: number[] = []
    const equityCurve: number[] = [this.config.initialCapital]

    for (let i = 0; i < data.length; i += 1) {
      const candle = data[i]
      const signal = signals[i]

      if (signal === 'BUY' && quantity === 0 && cash > 0) {
        const executionPrice = candle.close * (1 + this.config.slippageRate)
        if (executionPrice > 0) {
          const nextQuantity =
            cash / (executionPrice * (1 + this.config.commissionRate))

          if (nextQuantity > 0) {
            const grossCost = nextQuantity * executionPrice
            const commission = grossCost * this.config.commissionRate
            const totalCost = grossCost + commission

            cash -= totalCost
            quantity = nextQuantity
            positionCost = totalCost

            trades.push({
              date: candle.date,
              signal: 'BUY',
              price: executionPrice,
              quantity: nextQuantity,
              commission,
            })
          }
        }
      }

      if (signal === 'SELL' && quantity > 0) {
        const executionPrice = candle.close * (1 - this.config.slippageRate)

        if (executionPrice > 0) {
          const grossProceeds = quantity * executionPrice
          const commission = grossProceeds * this.config.commissionRate
          const netProceeds = grossProceeds - commission
          const pnl = netProceeds - positionCost

          cash += netProceeds
          closedTradePnls.push(pnl)

          trades.push({
            date: candle.date,
            signal: 'SELL',
            price: executionPrice,
            quantity,
            commission,
            pnl,
          })

          quantity = 0
          positionCost = 0
        }
      }

      const equity = cash + quantity * candle.close
      equityCurve.push(equity)
    }

    const lastClose = data[data.length - 1].close
    const finalCapital = cash + quantity * lastClose
    const totalReturn =
      ((finalCapital - this.config.initialCapital) /
        this.config.initialCapital) *
      100
    const maxDrawdown = calculateMaxDrawdown(equityCurve)
    const sharpeRatio = calculateSharpeRatio(
      equityCurve,
      this.config.initialCapital
    )
    const wins = closedTradePnls.filter((pnl) => pnl > 0).length
    const winRate =
      closedTradePnls.length === 0 ? 0 : (wins / closedTradePnls.length) * 100

    return {
      totalReturn,
      maxDrawdown,
      sharpeRatio,
      winRate,
      totalTrades: trades.length,
      finalCapital,
      trades,
    }
  }
}
