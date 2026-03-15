import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

export class GridTradingStrategy implements IStrategy {
  name = 'grid_trading'

  constructor(
    private params: {
      upperPrice: number
      lowerPrice: number
      gridCount: number
    } = {
      upperPrice: 80000,
      lowerPrice: 60000,
      gridCount: 10,
    }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    const levels = this.getGridLevels()
    const signals: Signal[] = []
    let lastLevel = -1

    for (let i = 0; i < data.length; i++) {
      const price = data[i].close
      const currentLevel = this.findGridLevel(price, levels)

      if (i === 0 || lastLevel === -1) {
        lastLevel = currentLevel
        signals.push('HOLD')
        continue
      }

      if (currentLevel < lastLevel) {
        signals.push('BUY')
      } else if (currentLevel > lastLevel) {
        signals.push('SELL')
      } else {
        signals.push('HOLD')
      }
      lastLevel = currentLevel
    }

    return signals
  }

  getGridLevels(): number[] {
    const { upperPrice, lowerPrice, gridCount } = this.params
    const spacing = (upperPrice - lowerPrice) / gridCount
    return Array.from(
      { length: gridCount + 1 },
      (_, i) => Math.round((lowerPrice + i * spacing) * 100) / 100
    )
  }

  private findGridLevel(price: number, levels: number[]): number {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (price >= levels[i]) return i
    }
    return -1
  }

  getDefaultParams(): StrategyParams {
    return { upperPrice: 80000, lowerPrice: 60000, gridCount: 10 }
  }

  validateParams(params: StrategyParams): boolean {
    const u = params.upperPrice as number
    const l = params.lowerPrice as number
    const g = params.gridCount as number
    return u > l && g > 0 && g <= 100
  }
}
