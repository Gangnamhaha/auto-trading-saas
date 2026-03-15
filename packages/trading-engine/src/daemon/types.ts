import type { StrategyParams } from '../strategy/types'

export interface DaemonConfig {
  pollingIntervalMs: number
  symbols: string[]
  strategies: ActiveStrategy[]
  riskConfig: {
    maxPositionSizePercent: number
    maxDailyLossPercent: number
    maxDailyTrades: number
  }
}

export interface ActiveStrategy {
  id: string
  strategyName: string
  symbol: string
  params: StrategyParams
  mode: 'paper' | 'live'
  isActive: boolean
}

export type DaemonState = 'idle' | 'running' | 'paused' | 'stopped' | 'error'

export interface DaemonStatus {
  state: DaemonState
  uptime: number
  activatedStrategies: number
  totalTradesExecued: number
  lastTickAt: Date | null
  marketOpen: boolean
}
