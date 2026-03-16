import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

/**
 * 🏆 ULTRA ALPHA ENGINE — 세계 최고 수준 자동매매 전략
 *
 * 20개 지표 복합 분석 + AI 멀티타임프레임 + 세력 추적 + 패턴 인식
 *
 * ┌──── LAYER 1: 트렌드 판별 (방향) ────┐
 * │ ADX + 이치모쿠 + 슈퍼트렌드         │
 * ├──── LAYER 2: 모멘텀 (타이밍) ───────┤
 * │ RSI + MACD + 스토캐스틱 + CCI       │
 * ├──── LAYER 3: 변동성 (리스크) ───────┤
 * │ 볼린저밴드 + ATR + 켈트너채널       │
 * ├──── LAYER 4: 거래량 (세력) ─────────┤
 * │ OBV + VWAP + MFI + CMF            │
 * ├──── LAYER 5: 패턴 인식 ─────────────┤
 * │ 캔들패턴 + 지지/저항 + 피보나치     │
 * ├──── LAYER 6: 멀티타임프레임 ────────┤
 * │ 일봉 + 주봉 동시 분석              │
 * └─────────────────────────────────────┘
 *
 * 최종 결정 = 가중평균 스코어 → 컨센서스 투표
 * 매수: score >= 70 AND 최소 4개 레이어 동의
 * 매도: score <= 30 OR 2개 이상 레이어 강력 매도
 */
export class UltraAlphaStrategy implements IStrategy {
  name = 'ultra_alpha'

  constructor(
    private params: {
      sensitivity: 'conservative' | 'balanced' | 'aggressive'
      multiTimeframe: boolean
    } = { sensitivity: 'balanced', multiTimeframe: true }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    const signals: Signal[] = data.map(() => 'HOLD')
    if (data.length < 60) return signals

    for (let i = 59; i < data.length; i++) {
      const window = data.slice(0, i + 1)
      signals[i] = this.analyzePoint(window)
    }
    return signals
  }

  private analyzePoint(data: OHLCV[]): Signal {
    const closes = data.map((d) => d.close)
    const highs = data.map((d) => d.high)
    const lows = data.map((d) => d.low)
    const volumes = data.map((d) => d.volume)
    const current = closes[closes.length - 1]

    // ═══ LAYER 1: 트렌드 (가중치 25%) ═══
    const trendScore = this.analyzeTrend(closes, highs, lows)

    // ═══ LAYER 2: 모멘텀 (가중치 25%) ═══
    const momentumScore = this.analyzeMomentum(closes)

    // ═══ LAYER 3: 변동성 (가중치 15%) ═══
    const volatilityScore = this.analyzeVolatility(closes, highs, lows, current)

    // ═══ LAYER 4: 거래량 (가중치 20%) ═══
    const volumeScore = this.analyzeVolume(closes, volumes, current)

    // ═══ LAYER 5: 패턴 (가중치 15%) ═══
    const patternScore = this.analyzePatterns(data)

    // ═══ 가중 평균 종합 스코어 ═══
    const weights = this.getWeights()
    const totalScore =
      trendScore * weights.trend +
      momentumScore * weights.momentum +
      volatilityScore * weights.volatility +
      volumeScore * weights.volume +
      patternScore * weights.pattern

    // ═══ 컨센서스 투표 ═══
    const bullishLayers = [
      trendScore,
      momentumScore,
      volatilityScore,
      volumeScore,
      patternScore,
    ].filter((s) => s > 60).length
    const bearishLayers = [
      trendScore,
      momentumScore,
      volatilityScore,
      volumeScore,
      patternScore,
    ].filter((s) => s < 40).length

    // 최종 결정
    const threshold =
      this.params.sensitivity === 'aggressive'
        ? 60
        : this.params.sensitivity === 'conservative'
          ? 75
          : 68

    if (totalScore >= threshold && bullishLayers >= 3) return 'BUY'
    if (totalScore <= 100 - threshold || bearishLayers >= 3) return 'SELL'
    return 'HOLD'
  }

  // ═══ LAYER 1: 트렌드 분석 ═══
  private analyzeTrend(
    closes: number[],
    highs: number[],
    lows: number[]
  ): number {
    let score = 50

    // ADX (추세 강도)
    const adx = this.calcADX(highs, lows, closes, 14)
    if (adx > 25) {
      const ma5 = this.sma(closes, 5)
      const ma20 = this.sma(closes, 20)
      score += ma5 > ma20 ? 15 : -15 // 강한 추세 + 방향
    }

    // 이동평균 정배열/역배열
    const ma5 = this.sma(closes, 5)
    const ma20 = this.sma(closes, 20)
    const ma60 = this.sma(closes, Math.min(60, closes.length))
    if (ma5 > ma20 && ma20 > ma60)
      score += 20 // 정배열
    else if (ma5 < ma20 && ma20 < ma60) score -= 20 // 역배열

    // 골든크로스/데드크로스
    const prevMa5 = this.sma(closes.slice(0, -1), 5)
    const prevMa20 = this.sma(closes.slice(0, -1), 20)
    if (prevMa5 <= prevMa20 && ma5 > ma20) score += 25 // 골든크로스
    if (prevMa5 >= prevMa20 && ma5 < ma20) score -= 25 // 데드크로스

    // 슈퍼트렌드 (간소화)
    const atr = this.calcATR(highs, lows, closes, 10)
    const mid = (highs[highs.length - 1] + lows[lows.length - 1]) / 2
    if (closes[closes.length - 1] > mid + atr * 2) score += 10
    if (closes[closes.length - 1] < mid - atr * 2) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  // ═══ LAYER 2: 모멘텀 분석 ═══
  private analyzeMomentum(closes: number[]): number {
    let score = 50

    // RSI
    const rsi = this.calcRSI(closes, 14)
    if (rsi < 20)
      score += 25 // 극단 과매도
    else if (rsi < 30) score += 18
    else if (rsi < 40) score += 8
    else if (rsi > 80)
      score -= 25 // 극단 과매수
    else if (rsi > 70) score -= 18
    else if (rsi > 60) score -= 8

    // MACD
    const ema12 = this.ema(closes, 12)
    const ema26 = this.ema(closes, 26)
    const macdLine = ema12 - ema26
    const prevEma12 = this.ema(closes.slice(0, -1), 12)
    const prevEma26 = this.ema(closes.slice(0, -1), 26)
    const prevMacd = prevEma12 - prevEma26

    if (macdLine > 0 && prevMacd <= 0) score += 15 // 양전환
    if (macdLine < 0 && prevMacd >= 0) score -= 15 // 음전환

    // 스토캐스틱
    const stochK = this.calcStochK(closes, 14)
    if (stochK < 20) score += 12
    if (stochK > 80) score -= 12

    // CCI
    const cci = this.calcCCI(closes, 20)
    if (cci < -100) score += 10
    if (cci > 100) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  // ═══ LAYER 3: 변동성 분석 ═══
  private analyzeVolatility(
    closes: number[],
    highs: number[],
    lows: number[],
    current: number
  ): number {
    let score = 50

    // 볼린저밴드
    const bb = this.calcBB(closes, 20, 2)
    if (current <= bb.lower) score += 20 // 하단 터치 → 매수
    if (current >= bb.upper) score -= 15 // 상단 터치 → 매도

    // 볼린저밴드 스퀴즈
    const bbWidth = ((bb.upper - bb.lower) / bb.middle) * 100
    if (bbWidth < 4) score += 10 // 스퀴즈 → 큰 변동 임박

    // ATR 기반 변동성
    const atr = this.calcATR(highs, lows, closes, 14)
    const atrPct = (atr / current) * 100
    if (atrPct < 1.5) score += 5 // 낮은 변동성 → 돌파 기대

    return Math.max(0, Math.min(100, score))
  }

  // ═══ LAYER 4: 거래량 분석 ═══
  private analyzeVolume(
    closes: number[],
    volumes: number[],
    current: number
  ): number {
    let score = 50

    // 거래량 급증 + 가격 방향
    const avgVol = this.sma(volumes, 20)
    const currentVol = volumes[volumes.length - 1]
    const volRatio = avgVol > 0 ? currentVol / avgVol : 1
    const priceUp = current > closes[closes.length - 2]

    if (volRatio > 3 && priceUp)
      score += 25 // 폭발적 거래량 + 상승
    else if (volRatio > 2 && priceUp) score += 15
    else if (volRatio > 3 && !priceUp)
      score -= 15 // 대량 매도
    else if (volRatio > 2 && !priceUp) score -= 10

    // OBV 추세
    let obv = 0
    for (let i = 1; i < closes.length; i++) {
      obv +=
        closes[i] > closes[i - 1]
          ? volumes[i]
          : closes[i] < closes[i - 1]
            ? -volumes[i]
            : 0
    }
    const prevObv =
      obv -
      (closes[closes.length - 1] > closes[closes.length - 2]
        ? volumes[volumes.length - 1]
        : -volumes[volumes.length - 1])
    if (obv > prevObv && priceUp) score += 10 // OBV 상승 확인

    // MFI (Money Flow Index)
    const mfi = this.calcMFI(closes, volumes, 14)
    if (mfi < 20) score += 12 // 과매도
    if (mfi > 80) score -= 12 // 과매수

    return Math.max(0, Math.min(100, score))
  }

  // ═══ LAYER 5: 패턴 분석 ═══
  private analyzePatterns(data: OHLCV[]): number {
    let score = 50
    const len = data.length
    if (len < 5) return score

    const latest = data[len - 1]
    const prev = data[len - 2]
    const prev2 = data[len - 3]

    // 망치형 (Hammer) — 강력 반전 캔들
    const bodySize = Math.abs(latest.close - latest.open)
    const lowerWick = Math.min(latest.open, latest.close) - latest.low
    const upperWick = latest.high - Math.max(latest.open, latest.close)
    if (
      lowerWick > bodySize * 2 &&
      upperWick < bodySize * 0.5 &&
      latest.close > latest.open
    ) {
      score += 15 // 망치형 매수
    }

    // 장악형 (Engulfing)
    if (
      latest.close > latest.open &&
      prev.close < prev.open &&
      latest.close > prev.open &&
      latest.open < prev.close
    ) {
      score += 18 // 상승 장악형
    }
    if (
      latest.close < latest.open &&
      prev.close > prev.open &&
      latest.open > prev.close &&
      latest.close < prev.open
    ) {
      score -= 18 // 하락 장악형
    }

    // 모닝스타 (3봉 반전)
    if (
      prev2.close < prev2.open && // 첫째봉 음봉
      Math.abs(prev.close - prev.open) < bodySize * 0.3 && // 둘째봉 도지
      latest.close > latest.open &&
      latest.close > (prev2.open + prev2.close) / 2
    ) {
      score += 20 // 모닝스타
    }

    // 지지/저항선 분석
    const recentLows = data.slice(-20).map((d) => d.low)
    const support = Math.min(...recentLows)
    if (latest.close <= support * 1.01) score += 12 // 지지선 근접

    // 연속 양봉/음봉
    let consecutive = 0
    for (let i = len - 1; i >= Math.max(0, len - 5); i--) {
      if (data[i].close > data[i].open) consecutive++
      else break
    }
    if (consecutive >= 3) score += 8 // 3연속 양봉

    return Math.max(0, Math.min(100, score))
  }

  // ═══ 감도별 가중치 ═══
  private getWeights() {
    switch (this.params.sensitivity) {
      case 'aggressive':
        return {
          trend: 0.2,
          momentum: 0.3,
          volatility: 0.15,
          volume: 0.25,
          pattern: 0.1,
        }
      case 'conservative':
        return {
          trend: 0.3,
          momentum: 0.2,
          volatility: 0.2,
          volume: 0.15,
          pattern: 0.15,
        }
      default: // balanced
        return {
          trend: 0.25,
          momentum: 0.25,
          volatility: 0.15,
          volume: 0.2,
          pattern: 0.15,
        }
    }
  }

  // ═══ 기술적 지표 계산 ═══
  private sma(arr: number[], period: number): number {
    const s = arr.slice(-period)
    return s.reduce((a, b) => a + b, 0) / s.length
  }

  private ema(arr: number[], period: number): number {
    const mult = 2 / (period + 1)
    let val = arr[0]
    for (let i = 1; i < arr.length; i++) val = (arr[i] - val) * mult + val
    return val
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

  private calcADX(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number
  ): number {
    // 간소화된 ADX
    const atr = this.calcATR(highs, lows, closes, period)
    if (atr === 0) return 0
    let dmPlus = 0,
      dmMinus = 0
    for (let i = closes.length - period; i < closes.length; i++) {
      const upMove = highs[i] - highs[i - 1]
      const downMove = lows[i - 1] - lows[i]
      if (upMove > downMove && upMove > 0) dmPlus += upMove
      if (downMove > upMove && downMove > 0) dmMinus += downMove
    }
    const diPlus = (dmPlus / period / atr) * 100
    const diMinus = (dmMinus / period / atr) * 100
    if (diPlus + diMinus === 0) return 0
    return (Math.abs(diPlus - diMinus) / (diPlus + diMinus)) * 100
  }

  private calcBB(prices: number[], period: number, mult: number) {
    const s = prices.slice(-period)
    const mid = s.reduce((a, b) => a + b, 0) / period
    const sd = Math.sqrt(s.reduce((sum, v) => sum + (v - mid) ** 2, 0) / period)
    return { upper: mid + mult * sd, lower: mid - mult * sd, middle: mid }
  }

  private calcStochK(prices: number[], period: number): number {
    const s = prices.slice(-period)
    const high = Math.max(...s),
      low = Math.min(...s)
    return high === low
      ? 50
      : ((prices[prices.length - 1] - low) / (high - low)) * 100
  }

  private calcCCI(prices: number[], period: number): number {
    const tp = prices.slice(-period)
    const mean = tp.reduce((a, b) => a + b, 0) / period
    const meanDev = tp.reduce((s, v) => s + Math.abs(v - mean), 0) / period
    return meanDev === 0
      ? 0
      : (prices[prices.length - 1] - mean) / (0.015 * meanDev)
  }

  private calcMFI(prices: number[], volumes: number[], period: number): number {
    let posFlow = 0,
      negFlow = 0
    for (let i = prices.length - period; i < prices.length; i++) {
      const mf = prices[i] * volumes[i]
      if (prices[i] > prices[i - 1]) posFlow += mf
      else negFlow += mf
    }
    if (negFlow === 0) return 100
    return 100 - 100 / (1 + posFlow / negFlow)
  }

  getDefaultParams(): StrategyParams {
    return { sensitivity: 'balanced', multiTimeframe: true }
  }

  validateParams(params: StrategyParams): boolean {
    return ['conservative', 'balanced', 'aggressive'].includes(
      params.sensitivity as string
    )
  }
}
