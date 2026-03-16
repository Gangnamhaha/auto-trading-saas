import { EventEmitter } from 'events'
import type { IBroker, OrderRequest } from '../broker/types'
import { MarketDataStore } from '../data/market-data-store'
import { MarketHours } from '../data/market-hours'
import { CandleAggregator } from '../data/candle-aggregator'
import type { MarketTick } from '../data/types'
import { MACrossoverStrategy } from '../strategy/ma-crossover'
import { RSIStrategy } from '../strategy/rsi'
import { BollingerBandsStrategy } from '../strategy/bollinger-bands'
import { MACDStrategy } from '../strategy/macd'
import { GridTradingStrategy } from '../strategy/grid-trading'
import { AIStrategy } from '../strategy/ai-strategy'
import { UltraAlphaStrategy } from '../strategy/ultra-alpha'
import type { IStrategy } from '../strategy/types'
import { RiskManager } from '../risk/risk-manager'
import { CircuitBreaker } from '../risk/circuit-breaker'
import type {
  ActiveStrategy,
  DaemonConfig,
  DaemonState,
  DaemonStatus,
} from './types'

export class TradingDaemon extends EventEmitter {
  private state: DaemonState = 'idle'
  private broker: IBroker
  private dataStore: MarketDataStore
  private aggregator: CandleAggregator
  private riskManager: RiskManager
  private strategies: Map<
    string,
    { config: ActiveStrategy; instance: IStrategy }
  > = new Map()
  private intervalId: ReturnType<typeof setInterval> | null = null
  private startTime: Date | null = null
  private totalTrades = 0
  private lastTickAt: Date | null = null

  constructor(
    private config: DaemonConfig,
    broker: IBroker
  ) {
    super()
    this.broker = broker
    this.dataStore = new MarketDataStore(500)
    this.aggregator = new CandleAggregator(['1m', '5m', '1d'], (candle) => {
      this.dataStore.addCandle(candle)
    })
    const circuitBreaker = new CircuitBreaker(
      config.riskConfig.maxDailyLossPercent
    )
    this.riskManager = new RiskManager(
      {
        maxPositionSizePercent: config.riskConfig.maxPositionSizePercent,
        maxDailyLossPercent: config.riskConfig.maxDailyLossPercent,
        maxDailyTrades: config.riskConfig.maxDailyTrades,
        maxSingleStockPercent: 30,
        stopLossPercent: 3,
      },
      circuitBreaker
    )
    this.initStrategies()
  }

  private initStrategies(): void {
    for (const s of this.config.strategies) {
      if (!s.isActive) continue
      const instance = this.createStrategy(s.strategyName, s.params)
      if (instance) {
        this.strategies.set(s.id, { config: s, instance })
      }
    }
  }

  private createStrategy(
    name: string,
    params: Record<string, unknown>
  ): IStrategy | null {
    switch (name) {
      case 'ma_crossover':
        return new MACrossoverStrategy(
          params as { shortPeriod: number; longPeriod: number }
        )
      case 'rsi':
        return new RSIStrategy(
          params as { period: number; oversold: number; overbought: number }
        )
      case 'bollinger_bands':
        return new BollingerBandsStrategy(
          params as { period: number; stdDev: number }
        )
      case 'macd':
        return new MACDStrategy(
          params as {
            fastPeriod: number
            slowPeriod: number
            signalPeriod: number
          }
        )
      case 'grid_trading':
      case 'ultra_alpha':
        return new UltraAlphaStrategy(
          params as {
            sensitivity: 'conservative' | 'balanced' | 'aggressive'
            multiTimeframe: boolean
          }
        )
      case 'ai_analysis':
        return new AIStrategy(
          params as {
            provider: 'openai' | 'anthropic'
            model: string
            apiKey: string
            lookbackDays: number
            temperature: number
          }
        )
        return new GridTradingStrategy(
          params as {
            upperPrice: number
            lowerPrice: number
            gridCount: number
          }
        )
      default:
        return null
    }
  }

  async start(): Promise<void> {
    if (this.state === 'running') return
    this.state = 'running'
    this.startTime = new Date()
    this.emit('started')

    this.intervalId = setInterval(() => {
      this.tick()
    }, this.config.pollingIntervalMs)
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.state = 'stopped'
    this.emit('stopped')
  }

  pause(): void {
    this.state = 'paused'
    this.emit('paused')
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'running'
      this.emit('resumed')
    }
  }

  processTick(tick: MarketTick): void {
    this.lastTickAt = tick.timestamp
    this.aggregator.processTick(tick)
  }

  async tick(): Promise<void> {
    if (this.state !== 'running') return
    if (!MarketHours.isMarketOpen('KR')) {
      this.emit('market_closed')
      return
    }

    for (const [id, { config, instance }] of this.strategies) {
      try {
        const ohlcv = this.dataStore.getOHLCV(config.symbol, '1d', 100)
        if (ohlcv.length < 2) continue

        const signals = instance.analyze(ohlcv)
        const latestSignal = signals[signals.length - 1]

        if (latestSignal === 'HOLD') continue

        const price = this.dataStore.getLatestPrice(config.symbol)
        if (!price) continue

        const order: OrderRequest = {
          symbol: config.symbol,
          side: latestSignal === 'BUY' ? 'buy' : 'sell',
          quantity: 1,
          price,
          orderType: 'limit',
        }

        const balance = await this.broker.getBalance()

        try {
          this.riskManager.validateOrder(order, balance.cash, balance.positions)
        } catch (riskError) {
          this.emit('risk_violation', { strategyId: id, error: riskError })
          continue
        }

        const result = await this.broker.placeOrder(order)
        this.totalTrades++
        this.emit('trade_executed', {
          strategyId: id,
          signal: latestSignal,
          order,
          result,
        })
      } catch (error) {
        this.emit('strategy_error', { strategyId: id, error })
      }
    }
  }

  getStatus(): DaemonStatus {
    return {
      state: this.state,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      activatedStrategies: this.strategies.size,
      totalTradesExecued: this.totalTrades,
      lastTickAt: this.lastTickAt,
      marketOpen: MarketHours.isMarketOpen('KR'),
    }
  }

  getState(): DaemonState {
    return this.state
  }
}
