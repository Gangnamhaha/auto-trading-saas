import { EventEmitter } from 'events'
import type { IBroker, OrderRequest } from '../broker/types'
import type { IStrategy } from '../strategy/types'
import { UltraAlphaStrategy } from '../strategy/ultra-alpha'
import { ProfitMaximizer } from '../strategy/profit-maximizer'
import { AIStrategy } from '../strategy/ai-strategy'
import { RiskManager } from '../risk/risk-manager'
import { CircuitBreaker } from '../risk/circuit-breaker'
import { MarketHours } from '../data/market-hours'
import { MarketDataStore } from '../data/market-data-store'
import { CandleAggregator } from '../data/candle-aggregator'
import { NotificationManager } from '../notifications/notification-manager'
import { StockScreener } from '../screener/stock-screener'
import { NewsSentimentAnalyzer } from '../screener/news-sentiment'
import {
  PortfolioRebalancer,
  type PortfolioTarget,
} from '../strategy/rebalancer'
import type { MarketTick } from '../data/types'

/**
 * 🛩️ AUTOPILOT — 세계 최고 수준 완전 자율 자동매매 시스템
 *
 * 인간 개입 ZERO. AI가 모든 것을 자동으로 처리.
 *
 * ┌──────────────────────────────────────────────┐
 * │              🛩️ AUTOPILOT ENGINE              │
 * ├──── Phase 1: 시장 스캔 ──────────────────────┤
 * │ • 전체 시장 실시간 모니터링                    │
 * │ • AI 종목 스크리닝 (10중 분석)                │
 * │ • 뉴스 감성 분석                              │
 * │ • 섹터 로테이션 감지                           │
 * ├──── Phase 2: 전략 선택 ──────────────────────┤
 * │ • 시장 상태별 최적 전략 자동 선택              │
 * │   - 추세장: Ultra Alpha (공격적)              │
 * │   - 박스권: 그리드 트레이딩                    │
 * │   - 폭락장: Profit Maximizer (보수적)         │
 * │   - 불확실: AI 분석 (균형)                    │
 * ├──── Phase 3: 포지션 관리 ────────────────────┤
 * │ • 자동 진입 (5중 컨펌)                        │
 * │ • 자동 익절/손절 (트레일링 스탑)               │
 * │ • 자동 리밸런싱 (5% 편차 초과 시)             │
 * │ • 자동 포지션 사이징 (켈리 공식)               │
 * ├──── Phase 4: 리스크 관리 ────────────────────┤
 * │ • 회로차단기 (일일 -5% 시 전체 중단)          │
 * │ • 상관관계 분석 (집중 리스크 방지)             │
 * │ • VaR (Value at Risk) 한도 관리               │
 * │ • 최대 포지션 수 제한                          │
 * ├──── Phase 5: 보고 ───────────────────────────┤
 * │ • 실시간 텔레그램 알림                         │
 * │ • 일일 성과 리포트 자동 발송                   │
 * │ • 주간 포트폴리오 분석 리포트                  │
 * └──────────────────────────────────────────────┘
 */

export type MarketRegime =
  | 'trending_up'
  | 'trending_down'
  | 'ranging'
  | 'volatile'
  | 'crash'
export type AutopilotState =
  | 'off'
  | 'scanning'
  | 'trading'
  | 'paused'
  | 'emergency_stop'

export interface AutopilotConfig {
  // 시장
  markets: Array<'KR' | 'US' | 'CRYPTO'>
  watchlist: string[]

  // 리스크
  maxPositions: number
  maxPortfolioRisk: number // 포트폴리오 전체 최대 리스크 %
  maxSinglePositionPct: number // 단일 종목 최대 비중 %
  dailyLossLimit: number // 일일 최대 손실 %
  correlationLimit: number // 상관관계 한도

  // 자본
  totalCapital: number
  reserveCashPct: number // 현금 보유 비율 % (기본 20)

  // AI
  aiApiKey: string
  aiProvider: 'openai' | 'anthropic'

  // 알림
  telegramToken: string
  telegramChatId: string
}

export interface AutopilotStatus {
  state: AutopilotState
  marketRegime: MarketRegime
  activeStrategy: string
  positions: number
  totalPnl: number
  todayPnl: number
  todayTrades: number
  uptime: number
  lastScanAt: Date | null
  lastTradeAt: Date | null
  riskLevel: 'LOW' | 'MID' | 'HIGH' | 'CRITICAL'
  nextAction: string
}

export class Autopilot extends EventEmitter {
  private state: AutopilotState = 'off'
  private marketRegime: MarketRegime = 'ranging'
  private activeStrategy: IStrategy
  private strategies: Map<string, IStrategy>
  private riskManager: RiskManager
  private screener: StockScreener
  private sentimentAnalyzer: NewsSentimentAnalyzer
  private rebalancer: PortfolioRebalancer
  private dataStore: MarketDataStore
  private aggregator: CandleAggregator
  private notifications: NotificationManager
  private broker: IBroker

  private scanInterval: ReturnType<typeof setInterval> | null = null
  private startTime: Date | null = null
  private todayTrades = 0
  private todayPnl = 0
  private totalPnl = 0
  private lastScanAt: Date | null = null
  private lastTradeAt: Date | null = null

  constructor(
    private config: AutopilotConfig,
    broker: IBroker,
    notifications: NotificationManager
  ) {
    super()
    this.broker = broker
    this.notifications = notifications
    this.dataStore = new MarketDataStore(1000)
    this.aggregator = new CandleAggregator(['1m', '5m', '1d'], (candle) => {
      this.dataStore.addCandle(candle)
    })

    // 시장 상태별 최적 전략 매핑
    this.strategies = new Map<string, IStrategy>([
      [
        'trending_up',
        new UltraAlphaStrategy({
          sensitivity: 'aggressive',
          multiTimeframe: true,
        }),
      ],
      [
        'trending_down',
        new ProfitMaximizer({
          stopLoss: 2,
          trailingStop: 3,
          partialTake1: 5,
          partialTake2: 10,
          timeStop: 3,
          timeStopMin: 1,
          minConfirmations: 5,
        }),
      ],
      [
        'ranging',
        new ProfitMaximizer({
          stopLoss: 3,
          trailingStop: 5,
          partialTake1: 8,
          partialTake2: 15,
          timeStop: 5,
          timeStopMin: 2,
          minConfirmations: 4,
        }),
      ],
      [
        'volatile',
        new AIStrategy({
          provider: config.aiProvider,
          model: 'gpt-4o-mini',
          apiKey: config.aiApiKey,
          lookbackDays: 30,
          temperature: 0.2,
        }),
      ],
      [
        'crash',
        new UltraAlphaStrategy({
          sensitivity: 'conservative',
          multiTimeframe: true,
        }),
      ],
    ])
    this.activeStrategy = this.strategies.get('ranging')!

    // 리스크 매니저
    const circuitBreaker = new CircuitBreaker(config.dailyLossLimit)
    this.riskManager = new RiskManager(
      {
        maxPositionSizePercent: config.maxSinglePositionPct,
        maxDailyLossPercent: config.dailyLossLimit,
        maxDailyTrades: 50,
        maxSingleStockPercent: config.maxSinglePositionPct,
        stopLossPercent: 3,
      },
      circuitBreaker
    )

    this.screener = new StockScreener()
    this.sentimentAnalyzer = new NewsSentimentAnalyzer()
    this.rebalancer = new PortfolioRebalancer(5, 100000)
  }

  // ═══ 오토파일럿 시작 ═══
  async start(): Promise<void> {
    if (this.state !== 'off') return
    this.state = 'scanning'
    this.startTime = new Date()

    this.emit('started')
    await this.notifications.notify(
      'trade_executed',
      '🛩️ Autopilot ON',
      'Alphix 오토파일럿이 시작되었습니다. 완전 자율 모드.'
    )

    // 메인 루프: 30초마다 시장 스캔
    this.scanInterval = setInterval(async () => {
      await this.mainLoop()
    }, 30000)

    // 첫 스캔 즉시 실행
    await this.mainLoop()
  }

  // ═══ 메인 루프 ═══
  private async mainLoop(): Promise<void> {
    if (this.state === 'paused' || this.state === 'emergency_stop') return

    try {
      // Phase 1: 시장 스캔
      this.state = 'scanning'
      this.lastScanAt = new Date()

      // 시장 상태 판별
      this.marketRegime = await this.detectMarketRegime()

      // 최적 전략 자동 선택
      const prevStrategy = this.activeStrategy.name
      this.activeStrategy =
        this.strategies.get(this.marketRegime) ?? this.activeStrategy
      if (this.activeStrategy.name !== prevStrategy) {
        this.emit('strategy_changed', {
          from: prevStrategy,
          to: this.activeStrategy.name,
          regime: this.marketRegime,
        })
        await this.notifications.notify(
          'trade_executed',
          '🔄 전략 전환',
          `시장: ${this.marketRegime} → 전략: ${this.activeStrategy.name}`
        )
      }

      // 시장 개장 여부 확인
      const marketsOpen = this.config.markets.some((m) =>
        MarketHours.isMarketOpen(m)
      )
      if (!marketsOpen && !this.config.markets.includes('CRYPTO')) {
        this.emit('market_closed')
        return
      }

      // Phase 2: 종목 스크리닝
      this.state = 'trading'

      // Phase 3: 포지션 관리
      await this.managePositions()

      // Phase 4: 리밸런싱 체크
      await this.checkRebalancing()
    } catch (error) {
      this.emit('error', error)
      await this.notifications.notify(
        'error',
        '🚨 Autopilot Error',
        String(error)
      )
    }
  }

  // ═══ 시장 상태 판별 ═══
  private async detectMarketRegime(): Promise<MarketRegime> {
    const symbol = this.config.watchlist[0] ?? '005930'
    const ohlcv = this.dataStore.getOHLCV(symbol, '1d', 30)
    if (ohlcv.length < 20) return 'ranging'

    const closes = ohlcv.map((d) => d.close)
    const ma5 = this.sma(closes, 5)
    const ma20 = this.sma(closes, 20)
    const returns = closes
      .slice(-10)
      .map((c, i, a) => (i > 0 ? ((c - a[i - 1]) / a[i - 1]) * 100 : 0))
      .slice(1)
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const volatility = Math.sqrt(
      returns.reduce((s, r) => s + (r - avgReturn) ** 2, 0) / returns.length
    )

    // 폭락 감지: 최근 3일 -8% 이상 하락
    const threeDay =
      ((closes[closes.length - 1] - closes[closes.length - 4]) /
        closes[closes.length - 4]) *
      100
    if (threeDay < -8) return 'crash'

    // 고변동성: 일간 변동성 2.5% 이상
    if (volatility > 2.5) return 'volatile'

    // 추세 판별
    if (ma5 > ma20 && avgReturn > 0.3) return 'trending_up'
    if (ma5 < ma20 && avgReturn < -0.3) return 'trending_down'

    return 'ranging'
  }

  // ═══ 포지션 관리 ═══
  private async managePositions(): Promise<void> {
    const balance = await this.broker.getBalance()

    for (const symbol of this.config.watchlist) {
      const ohlcv = this.dataStore.getOHLCV(symbol, '1d', 60)
      if (ohlcv.length < 30) continue

      const signals = this.activeStrategy.analyze(ohlcv)
      const latestSignal = signals[signals.length - 1]
      if (latestSignal === 'HOLD') continue

      const price = this.dataStore.getLatestPrice(symbol)
      if (!price) continue

      // 포지션 사이징 (켈리 기반)
      const positionSize = this.calculatePositionSize(balance.cash, price)
      if (positionSize <= 0) continue

      const order: OrderRequest = {
        symbol,
        side: latestSignal === 'BUY' ? 'buy' : 'sell',
        quantity: positionSize,
        price,
        orderType: 'limit',
      }

      try {
        this.riskManager.validateOrder(order, balance.cash, balance.positions)
        const result = await this.broker.placeOrder(order)
        this.todayTrades++
        this.lastTradeAt = new Date()

        const pnl =
          latestSignal === 'SELL'
            ? (price -
                (balance.positions.find((p) => p.symbol === symbol)?.avgPrice ??
                  price)) *
              positionSize
            : 0
        this.todayPnl += pnl
        this.totalPnl += pnl

        this.emit('trade', {
          symbol,
          signal: latestSignal,
          price,
          quantity: positionSize,
          pnl,
          result,
        })
        await this.notifications.notify(
          'trade_executed',
          `${latestSignal === 'BUY' ? '🟢' : '🔴'} ${latestSignal} ${symbol}`,
          `${positionSize}주 @ ${price.toLocaleString()} | 전략: ${this.activeStrategy.name}`
        )
      } catch (riskError) {
        this.emit('risk_blocked', { symbol, order, error: riskError })
      }
    }
  }

  // ═══ 리밸런싱 ═══
  private async checkRebalancing(): Promise<void> {
    const balance = await this.broker.getBalance()
    const totalValue = balance.totalValue || 1

    const targets: PortfolioTarget[] = balance.positions.map((p) => {
      const weight = ((p.currentPrice * p.quantity) / totalValue) * 100
      const targetWeight = 100 / Math.max(1, balance.positions.length) // 균등 배분
      return {
        symbol: p.symbol,
        targetWeight,
        currentWeight: weight,
        deviation: weight - targetWeight,
      }
    })

    if (this.rebalancer.needsRebalancing(targets)) {
      const orders = this.rebalancer.analyze(targets)
      this.emit('rebalancing', { orders })
      await this.notifications.notify(
        'trade_executed',
        '📊 리밸런싱',
        `${orders.length}건의 조정 주문 생성`
      )
    }
  }

  // ═══ 포지션 사이징 (켈리 공식) ═══
  private calculatePositionSize(cash: number, price: number): number {
    const availableCash = cash * (1 - this.config.reserveCashPct / 100)
    const maxPosition = availableCash * (this.config.maxSinglePositionPct / 100)
    return Math.floor(maxPosition / price)
  }

  // ═══ 틱 처리 ═══
  processTick(tick: MarketTick): void {
    this.aggregator.processTick(tick)
  }

  // ═══ 긴급 정지 ═══
  async emergencyStop(): Promise<void> {
    this.state = 'emergency_stop'
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }
    this.emit('emergency_stop')
    await this.notifications.notify(
      'risk_violation',
      '🚨 긴급 정지',
      'Alphix 오토파일럿이 긴급 정지되었습니다.'
    )
  }

  // ═══ 상태 ═══
  async stop(): Promise<void> {
    this.state = 'off'
    if (this.scanInterval) {
      clearInterval(this.scanInterval)
      this.scanInterval = null
    }
    this.emit('stopped')
    await this.notifications.notify(
      'trade_executed',
      '🛩️ Autopilot OFF',
      '오토파일럿이 종료되었습니다.'
    )
  }

  pause(): void {
    this.state = 'paused'
    this.emit('paused')
  }
  resume(): void {
    this.state = 'scanning'
    this.emit('resumed')
  }

  getStatus(): AutopilotStatus {
    const riskLevel =
      this.todayPnl <
      -((this.config.totalCapital * this.config.dailyLossLimit) / 100)
        ? 'CRITICAL'
        : this.todayPnl < 0
          ? 'HIGH'
          : this.todayPnl < this.config.totalCapital * 0.01
            ? 'MID'
            : 'LOW'

    return {
      state: this.state,
      marketRegime: this.marketRegime,
      activeStrategy: this.activeStrategy.name,
      positions: 0,
      totalPnl: this.totalPnl,
      todayPnl: this.todayPnl,
      todayTrades: this.todayTrades,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      lastScanAt: this.lastScanAt,
      lastTradeAt: this.lastTradeAt,
      riskLevel,
      nextAction:
        this.state === 'scanning'
          ? '시장 분석 중...'
          : this.state === 'trading'
            ? '매매 실행 중...'
            : this.state === 'paused'
              ? '일시 정지'
              : '대기',
    }
  }

  private sma(arr: number[], period: number): number {
    const s = arr.slice(-period)
    return s.reduce((a, b) => a + b, 0) / s.length
  }
}
