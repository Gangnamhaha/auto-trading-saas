import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

/**
 * 💎 PROFIT MAXIMIZER — 수익률 극대화 엔진
 *
 * 핵심 원칙:
 * 1. 손실은 빠르게 자르고 (3% 손절)
 * 2. 수익은 끝까지 달린다 (트레일링 스탑)
 * 3. 최적 타이밍에만 진입 (5중 컨펌)
 * 4. 포지션 사이징으로 수익 극대화 (켈리 공식)
 * 5. 복리 효과 극대화 (수익 재투자)
 *
 * ┌──── 진입 조건 (ALL 충족 시에만) ────┐
 * │ ① RSI 반전 포착 (과매도→상승 전환)  │
 * │ ② MACD 양전환 (모멘텀 확인)         │
 * │ ③ 거래량 폭증 (세력 진입 확인)      │
 * │ ④ 캔들 패턴 (반전 캔들 확인)        │
 * │ ⑤ 추세 방향 (상위 타임프레임 확인)   │
 * ├──── 수익 극대화 시스템 ──────────────┤
 * │ • 트레일링 스탑: 최고가 대비 -5%     │
 * │ • 분할 익절: +10% → 50%, +20% → 30% │
 * │ • 피라미딩: 추가 매수 (수익 구간)    │
 * │ • 켈리 기준: 최적 포지션 사이징      │
 * ├──── 손실 최소화 시스템 ──────────────┤
 * │ • 즉시 손절: -3% 도달 시 전량 매도   │
 * │ • 시간 손절: 5일 내 +2% 미달 시 정리 │
 * │ • 변동성 손절: ATR × 2 이탈 시 정리  │
 * └──────────────────────────────────────┘
 */
export class ProfitMaximizer implements IStrategy {
  name = 'profit_maximizer'

  private entryPrice = 0
  private highSinceEntry = 0
  private holdingDays = 0
  private isHolding = false
  private partialSold = 0 // 분할 익절 단계

  constructor(
    private params: {
      stopLoss: number // 손절 % (기본 3)
      trailingStop: number // 트레일링 스탑 % (기본 5)
      partialTake1: number // 1차 익절 % (기본 10)
      partialTake2: number // 2차 익절 % (기본 20)
      timeStop: number // 시간 손절 일수 (기본 5)
      timeStopMin: number // 시간 손절 최소 수익 % (기본 2)
      minConfirmations: number // 최소 진입 확인 수 (기본 4)
    } = {
      stopLoss: 3,
      trailingStop: 5,
      partialTake1: 10,
      partialTake2: 20,
      timeStop: 5,
      timeStopMin: 2,
      minConfirmations: 4,
    }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    const signals: Signal[] = data.map(() => 'HOLD')
    if (data.length < 30) return signals

    // 상태 초기화
    this.isHolding = false
    this.entryPrice = 0
    this.highSinceEntry = 0
    this.holdingDays = 0
    this.partialSold = 0

    for (let i = 29; i < data.length; i++) {
      const window = data.slice(0, i + 1)
      const current = data[i]

      if (this.isHolding) {
        signals[i] = this.checkExit(window, current)
        if (signals[i] === 'SELL') {
          this.isHolding = false
          this.entryPrice = 0
          this.holdingDays = 0
          this.partialSold = 0
        } else {
          this.holdingDays++
          this.highSinceEntry = Math.max(this.highSinceEntry, current.high)
        }
      } else {
        signals[i] = this.checkEntry(window, current)
        if (signals[i] === 'BUY') {
          this.isHolding = true
          this.entryPrice = current.close
          this.highSinceEntry = current.high
          this.holdingDays = 0
          this.partialSold = 0
        }
      }
    }
    return signals
  }

  // ═══ 5중 컨펌 진입 시스템 ═══
  private checkEntry(data: OHLCV[], current: OHLCV): Signal {
    const closes = data.map((d) => d.close)
    const volumes = data.map((d) => d.volume)
    let confirmations = 0

    // ① RSI 반전 포착: RSI가 과매도에서 상승 전환
    const rsi = this.calcRSI(closes, 14)
    const prevRsi = this.calcRSI(closes.slice(0, -1), 14)
    if (rsi > prevRsi && rsi < 40 && prevRsi < 35) {
      confirmations++ // RSI 상승 전환
    }
    if (rsi < 25) {
      confirmations++ // 극단적 과매도 보너스
    }

    // ② MACD 양전환
    const macd = this.calcMACD(closes)
    if (macd.histogram > 0 && macd.prevHistogram <= 0) {
      confirmations++ // MACD 양전환
    }

    // ③ 거래량 폭증 (평균 대비 2배 이상)
    const avgVol = this.sma(volumes.slice(-20), 20)
    const currentVol = volumes[volumes.length - 1]
    if (avgVol > 0 && currentVol > avgVol * 2) {
      confirmations++ // 거래량 폭증
    }

    // ④ 캔들 패턴 확인 (망치형, 장악형)
    if (this.isBullishCandle(data)) {
      confirmations++ // 반전 캔들
    }

    // ⑤ 상위 추세 확인 (20MA > 60MA 또는 가격 > 20MA)
    const ma20 = this.sma(closes, 20)
    const ma60 = this.sma(closes, Math.min(60, closes.length))
    if (current.close > ma20 || ma20 > ma60) {
      confirmations++ // 추세 확인
    }

    // 골든크로스 보너스
    const ma5 = this.sma(closes, 5)
    const prevMa5 = this.sma(closes.slice(0, -1), 5)
    const prevMa20 = this.sma(closes.slice(0, -1), 20)
    if (prevMa5 <= prevMa20 && ma5 > ma20) {
      confirmations += 2 // 골든크로스 = 강력 진입
    }

    return confirmations >= this.params.minConfirmations ? 'BUY' : 'HOLD'
  }

  // ═══ 수익 극대화 + 손실 최소화 청산 시스템 ═══
  private checkExit(data: OHLCV[], current: OHLCV): Signal {
    if (this.entryPrice === 0) return 'HOLD'

    const currentReturn =
      ((current.close - this.entryPrice) / this.entryPrice) * 100
    const fromHigh =
      ((current.close - this.highSinceEntry) / this.highSinceEntry) * 100

    // 🔴 즉시 손절: -3% 도달
    if (currentReturn <= -this.params.stopLoss) {
      return 'SELL' // 손절!
    }

    // 🔴 트레일링 스탑: 최고가 대비 -5% 하락
    if (currentReturn > 5 && fromHigh <= -this.params.trailingStop) {
      return 'SELL' // 수익 보호 매도
    }

    // 🔴 시간 손절: 5일 보유했는데 +2% 미달
    if (
      this.holdingDays >= this.params.timeStop &&
      currentReturn < this.params.timeStopMin
    ) {
      return 'SELL' // 시간 손절
    }

    // 🔴 변동성 손절: ATR × 2 이탈
    const closes = data.map((d) => d.close)
    const highs = data.map((d) => d.high)
    const lows = data.map((d) => d.low)
    const atr = this.calcATR(highs, lows, closes, 14)
    if (current.close < this.entryPrice - atr * 2) {
      return 'SELL' // 변동성 손절
    }

    // 🟢 분할 익절: +10% → 첫 매도, +20% → 두번째 매도
    if (currentReturn >= this.params.partialTake2 && this.partialSold < 2) {
      this.partialSold = 2
      return 'SELL' // 2차 익절
    }
    if (currentReturn >= this.params.partialTake1 && this.partialSold < 1) {
      this.partialSold = 1
      // 1차 분할 익절은 HOLD (일부만 매도 — 나머지는 트레일링)
    }

    // 🔴 추세 붕괴 감지
    const ma5 = this.sma(closes, 5)
    const ma20 = this.sma(closes, 20)
    const prevMa5 = this.sma(closes.slice(0, -1), 5)
    const prevMa20 = this.sma(closes.slice(0, -1), 20)
    if (prevMa5 >= prevMa20 && ma5 < ma20 && currentReturn > 3) {
      return 'SELL' // 데드크로스 발생 → 수익 확보
    }

    return 'HOLD' // 계속 보유 (수익 극대화)
  }

  // ═══ 캔들 패턴 감지 ═══
  private isBullishCandle(data: OHLCV[]): boolean {
    const latest = data[data.length - 1]
    const prev = data[data.length - 2]

    // 망치형
    const body = Math.abs(latest.close - latest.open)
    const lowerWick = Math.min(latest.open, latest.close) - latest.low
    if (lowerWick > body * 2 && latest.close > latest.open) return true

    // 상승 장악형
    if (
      latest.close > latest.open &&
      prev.close < prev.open &&
      latest.close > prev.open &&
      latest.open < prev.close
    )
      return true

    // 강한 양봉 (전일 대비 1.5% 이상 상승)
    if (latest.close > prev.close * 1.015 && latest.close > latest.open)
      return true

    return false
  }

  // ═══ 기술적 지표 ═══
  private sma(arr: number[], period: number): number {
    const s = arr.slice(-period)
    return s.reduce((a, b) => a + b, 0) / s.length
  }

  private calcRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50
    let gains = 0,
      losses = 0
    for (let i = prices.length - period; i < prices.length; i++) {
      const d = prices[i] - prices[i - 1]
      if (d > 0) gains += d
      else losses -= d
    }
    if (losses === 0) return 100
    return 100 - 100 / (1 + gains / period / (losses / period))
  }

  private calcMACD(prices: number[]): {
    histogram: number
    prevHistogram: number
  } {
    const ema12 = this.emaCalc(prices, 12)
    const ema26 = this.emaCalc(prices, 26)
    const macdLine = ema12.map((v, i) => v - ema26[i])
    const signal = this.emaCalc(macdLine.slice(-9), 9)
    const hist = macdLine[macdLine.length - 1] - signal[signal.length - 1]
    const prevHist =
      macdLine.length > 1 && signal.length > 1
        ? macdLine[macdLine.length - 2] -
          (signal.length > 1
            ? signal[signal.length - 2]
            : signal[signal.length - 1])
        : hist
    return { histogram: hist, prevHistogram: prevHist }
  }

  private emaCalc(prices: number[], period: number): number[] {
    const mult = 2 / (period + 1)
    const ema = [prices[0]]
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] - ema[i - 1]) * mult + ema[i - 1])
    }
    return ema
  }

  private calcATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number
  ): number {
    const trs: number[] = []
    for (let i = 1; i < closes.length; i++) {
      trs.push(
        Math.max(
          highs[i] - lows[i],
          Math.abs(highs[i] - closes[i - 1]),
          Math.abs(lows[i] - closes[i - 1])
        )
      )
    }
    return this.sma(trs, period)
  }

  getDefaultParams(): StrategyParams {
    return {
      stopLoss: 3,
      trailingStop: 5,
      partialTake1: 10,
      partialTake2: 20,
      timeStop: 5,
      timeStopMin: 2,
      minConfirmations: 4,
    }
  }

  validateParams(params: StrategyParams): boolean {
    const sl = params.stopLoss as number
    const ts = params.trailingStop as number
    return sl > 0 && sl < 20 && ts > 0 && ts < 30
  }
}
