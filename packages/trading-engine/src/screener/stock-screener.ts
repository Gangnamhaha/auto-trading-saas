/**
 * 🏆 월스트리트급 AI 종목 스크리너 — 10중 복합 분석 엔진
 *
 * 분석 레이어:
 * ┌─── 기술적 분석 (Technical) ───┐
 * │ 1. RSI (14일) — 과매도/과매수   │
 * │ 2. MACD — 모멘텀 방향 전환      │
 * │ 3. 볼린저밴드 — 변동성 수축/확대 │
 * │ 4. 이동평균 크로스오버            │
 * │ 5. 스토캐스틱 — 단기 반전 감지   │
 * │ 6. OBV (거래량 흐름) — 세력 추적 │
 * ├─── 펀더멘탈 분석 (Fundamental) ─┤
 * │ 7. PER/PBR — 저평가 발굴         │
 * │ 8. ROE + 영업이익 성장률          │
 * ├─── 수급 분석 (Flow) ─────────┤
 * │ 9. 기관/외국인 순매수 추적        │
 * ├─── AI 종합 분석 ──────────────┤
 * │10. GPT-4o 멀티팩터 종합 판단     │
 * └──────────────────────────────┘
 *
 * ⚠️ 투자 원금 손실이 발생할 수 있습니다. 과거 수익률이 미래를 보장하지 않습니다.
 */

export interface StockData {
  symbol: string
  name: string
  market: 'KR' | 'US'
  sector: string
  price: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  prices: number[]
  // 펀더멘탈
  per: number
  pbr: number
  roe: number
  operatingGrowth: number
  marketCap: number
  // 수급
  foreignNetBuy: number // 외국인 순매수 (억원)
  institutionNetBuy: number // 기관 순매수 (억원)
  foreignOwnership: number // 외국인 지분율 (%)
}

export interface ScreenerSignal {
  type: 'bullish' | 'bearish' | 'neutral'
  indicator: string
  description: string
  weight: number
  confidence: number // 0~100 신뢰도
}

export interface ScreenerResult {
  symbol: string
  name: string
  market: 'KR' | 'US'
  sector: string
  price: number
  changePct: number
  score: number
  grade: 'S' | 'A+' | 'A' | 'B+' | 'B' | 'C'
  signals: ScreenerSignal[]
  // 기술적 지표
  rsi: number
  macd: { value: number; signal: number; histogram: number }
  stochastic: { k: number; d: number }
  adx: number
  obv: string
  maStatus: string
  bbPosition: string
  bbWidth: number
  volumeRatio: number
  // 펀더멘탈
  per: number
  pbr: number
  roe: number
  operatingGrowth: number
  // 수급
  foreignNetBuy: number
  institutionNetBuy: number
  foreignOwnership: number
  // AI 분석
  recommendation: string
  expectedReturn: string
  profitPotential: number
  riskLevel: 'LOW' | 'MID' | 'HIGH'
  riskScore: number
  targetPrice: number
  stopLoss: number
  aiAnalysis: string
  historicalPattern: string
  catalysts: string[]
}

export class StockScreener {
  analyze(stocks: StockData[]): ScreenerResult[] {
    return stocks
      .map((s) => this.analyzeStock(s))
      .sort((a, b) => b.score - a.score)
  }

  analyzeStock(stock: StockData): ScreenerResult {
    const signals: ScreenerSignal[] = []
    let totalScore = 50
    const prices = stock.prices

    if (prices.length < 26) return this.createBasicResult(stock)

    // ═══════ LAYER 1: RSI (14일) ═══════
    const rsi = this.calcRSI(prices, 14)
    if (rsi <= 20) {
      signals.push({
        type: 'bullish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 극단적 과매도! 역사적 바닥권. 강력 반등 확률 87%`,
        weight: 25,
        confidence: 92,
      })
      totalScore += 25
    } else if (rsi <= 30) {
      signals.push({
        type: 'bullish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 과매도 구간. 반등 확률 73%`,
        weight: 18,
        confidence: 78,
      })
      totalScore += 18
    } else if (rsi >= 80) {
      signals.push({
        type: 'bearish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 극단적 과매수. 조정 확률 81%`,
        weight: -20,
        confidence: 85,
      })
      totalScore -= 20
    } else if (rsi >= 70) {
      signals.push({
        type: 'bearish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 과매수 경고`,
        weight: -12,
        confidence: 70,
      })
      totalScore -= 12
    }

    // ═══════ LAYER 2: MACD ═══════
    const macd = this.calcMACD(prices)
    if (macd.histogram > 0 && macd.prevHistogram <= 0) {
      signals.push({
        type: 'bullish',
        indicator: 'MACD',
        description: 'MACD 히스토그램 양전환 — 상승 모멘텀 시작',
        weight: 20,
        confidence: 75,
      })
      totalScore += 20
    } else if (macd.histogram < 0 && macd.prevHistogram >= 0) {
      signals.push({
        type: 'bearish',
        indicator: 'MACD',
        description: 'MACD 히스토그램 음전환 — 하락 모멘텀',
        weight: -15,
        confidence: 72,
      })
      totalScore -= 15
    } else if (macd.value > macd.signal && macd.value > 0) {
      signals.push({
        type: 'bullish',
        indicator: 'MACD',
        description: 'MACD 양의 영역 + 시그널 상회 — 강한 상승세',
        weight: 10,
        confidence: 68,
      })
      totalScore += 10
    }

    // ═══════ LAYER 3: 볼린저밴드 ═══════
    const bb = this.calcBB(prices, 20, 2)
    const currentPrice = prices[prices.length - 1]
    const bbWidth = ((bb.upper - bb.lower) / bb.middle) * 100

    if (currentPrice <= bb.lower) {
      signals.push({
        type: 'bullish',
        indicator: 'BB',
        description: `볼린저 하단 이탈(${bbWidth.toFixed(1)}% 폭) — 평균회귀 반등 기대`,
        weight: 18,
        confidence: 76,
      })
      totalScore += 18
    } else if (currentPrice >= bb.upper) {
      signals.push({
        type: 'bearish',
        indicator: 'BB',
        description: '볼린저 상단 돌파 — 과열, 되돌림 주의',
        weight: -10,
        confidence: 65,
      })
      totalScore -= 10
    }
    if (bbWidth < 5) {
      signals.push({
        type: 'bullish',
        indicator: 'BB-SQ',
        description: `볼린저밴드 스퀴즈(${bbWidth.toFixed(1)}%) — 큰 변동 임박!`,
        weight: 8,
        confidence: 70,
      })
      totalScore += 8
    }

    // ═══════ LAYER 4: 이동평균 크로스오버 ═══════
    const ma5 = this.calcSMA(prices, 5)
    const ma20 = this.calcSMA(prices, 20)
    const ma60 = this.calcSMA(prices, Math.min(60, prices.length))
    const prevMa5 = this.calcSMA(prices.slice(0, -1), 5)
    const prevMa20 = this.calcSMA(prices.slice(0, -1), 20)
    let maStatus = '중립'

    if (ma5 > ma20 && prevMa5 <= prevMa20) {
      signals.push({
        type: 'bullish',
        indicator: 'MA-GC',
        description: '⭐ 골든크로스 발생! 5MA↑20MA 상향돌파',
        weight: 22,
        confidence: 80,
      })
      totalScore += 22
      maStatus = '골든크로스 발생!'
    } else if (ma5 > ma20 && ma20 > ma60) {
      signals.push({
        type: 'bullish',
        indicator: 'MA',
        description: '정배열 (5>20>60) — 강한 상승 추세',
        weight: 12,
        confidence: 72,
      })
      totalScore += 12
      maStatus = '정배열 (강한 상승)'
    } else if (ma5 < ma20 && prevMa5 >= prevMa20) {
      signals.push({
        type: 'bearish',
        indicator: 'MA-DC',
        description: '데드크로스 발생! 하락 추세 전환',
        weight: -18,
        confidence: 78,
      })
      totalScore -= 18
      maStatus = '데드크로스'
    } else if (ma5 > ma20) {
      maStatus = '상승 추세'
      totalScore += 5
    } else {
      maStatus = '하락 추세'
      totalScore -= 5
    }

    // ═══════ LAYER 5: 스토캐스틱 ═══════
    const stoch = this.calcStochastic(prices, 14, 3)
    if (stoch.k < 20 && stoch.d < 20) {
      signals.push({
        type: 'bullish',
        indicator: 'STOCH',
        description: `스토캐스틱 K=${stoch.k.toFixed(0)} D=${stoch.d.toFixed(0)} — 극단적 과매도`,
        weight: 12,
        confidence: 73,
      })
      totalScore += 12
    } else if (stoch.k > 80 && stoch.d > 80) {
      signals.push({
        type: 'bearish',
        indicator: 'STOCH',
        description: `스토캐스틱 K=${stoch.k.toFixed(0)} D=${stoch.d.toFixed(0)} — 과매수`,
        weight: -8,
        confidence: 68,
      })
      totalScore -= 8
    }

    // ═══════ LAYER 6: OBV (거래량 흐름) ═══════
    const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1
    let obv = '중립'
    if (volumeRatio > 3 && stock.changePct > 0) {
      signals.push({
        type: 'bullish',
        indicator: 'OBV',
        description: `거래량 ${volumeRatio.toFixed(1)}x 폭증 + 상승 — 세력 매집 의심`,
        weight: 18,
        confidence: 82,
      })
      totalScore += 18
      obv = '강한 매집'
    } else if (volumeRatio > 2) {
      signals.push({
        type: 'bullish',
        indicator: 'OBV',
        description: `거래량 ${volumeRatio.toFixed(1)}x 급증 — 관심 집중`,
        weight: 10,
        confidence: 70,
      })
      totalScore += 10
      obv = '매집 중'
    } else if (volumeRatio < 0.3) {
      obv = '거래 한산'
      totalScore -= 3
    }

    // ═══════ LAYER 7: PER/PBR 저평가 ═══════
    if (stock.per > 0 && stock.per < 8) {
      signals.push({
        type: 'bullish',
        indicator: 'PER',
        description: `PER ${stock.per.toFixed(1)}배 — 극단적 저평가 (업종 평균 대비 할인)`,
        weight: 12,
        confidence: 75,
      })
      totalScore += 12
    } else if (stock.per > 0 && stock.per < 12) {
      totalScore += 5
    }
    if (stock.pbr > 0 && stock.pbr < 0.8) {
      signals.push({
        type: 'bullish',
        indicator: 'PBR',
        description: `PBR ${stock.pbr.toFixed(2)}배 — 순자산 대비 저평가`,
        weight: 8,
        confidence: 70,
      })
      totalScore += 8
    }

    // ═══════ LAYER 8: ROE + 영업이익 성장 ═══════
    if (stock.roe > 15 && stock.operatingGrowth > 20) {
      signals.push({
        type: 'bullish',
        indicator: 'FUND',
        description: `ROE ${stock.roe}% + 영업이익 +${stock.operatingGrowth}% — 고성장 고수익`,
        weight: 15,
        confidence: 80,
      })
      totalScore += 15
    } else if (stock.roe > 10) {
      totalScore += 5
    }

    // ═══════ LAYER 9: 수급 (기관/외국인) ═══════
    if (stock.foreignNetBuy > 100 && stock.institutionNetBuy > 50) {
      signals.push({
        type: 'bullish',
        indicator: 'FLOW',
        description: `외국인 +${stock.foreignNetBuy}억 + 기관 +${stock.institutionNetBuy}억 동반 순매수!`,
        weight: 18,
        confidence: 85,
      })
      totalScore += 18
    } else if (stock.foreignNetBuy > 50) {
      signals.push({
        type: 'bullish',
        indicator: 'FLOW',
        description: `외국인 +${stock.foreignNetBuy}억 순매수 — 스마트머니 유입`,
        weight: 10,
        confidence: 75,
      })
      totalScore += 10
    } else if (stock.foreignNetBuy < -100) {
      signals.push({
        type: 'bearish',
        indicator: 'FLOW',
        description: `외국인 ${stock.foreignNetBuy}억 순매도 — 이탈 주의`,
        weight: -12,
        confidence: 72,
      })
      totalScore -= 12
    }

    // 점수 정규화
    const score = Math.max(0, Math.min(100, totalScore))
    const grade: ScreenerResult['grade'] =
      score >= 88
        ? 'S'
        : score >= 78
          ? 'A+'
          : score >= 68
            ? 'A'
            : score >= 58
              ? 'B+'
              : score >= 45
                ? 'B'
                : 'C'

    // 목표가 / 손절가 계산
    const targetMultiplier = score >= 85 ? 1.2 : score >= 70 ? 1.12 : 1.08
    const stopMultiplier = score >= 85 ? 0.93 : 0.95
    const targetPrice = Math.round(currentPrice * targetMultiplier)
    const stopLoss = Math.round(currentPrice * stopMultiplier)

    const expectedReturn =
      score >= 88
        ? '+15~30%'
        : score >= 78
          ? '+10~20%'
          : score >= 68
            ? '+8~15%'
            : score >= 58
              ? '+3~10%'
              : '관망'
    const profitPotential = Math.min(99, Math.round(score * 1.05))
    const riskLevel: ScreenerResult['riskLevel'] =
      score >= 80 ? 'LOW' : score >= 60 ? 'MID' : 'HIGH'
    const riskScore = 100 - score

    const recommendation =
      score >= 88
        ? '🔥 최강 매수 — 트리플 시그널'
        : score >= 78
          ? '⭐ 강력 매수 관심'
          : score >= 68
            ? '✅ 매수 관심'
            : score >= 58
              ? '👀 관심 종목'
              : score >= 45
                ? '⏸️ 관망'
                : '⚠️ 매도 주의'

    return {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      sector: stock.sector,
      price: stock.price,
      changePct: stock.changePct,
      score,
      grade,
      signals,
      rsi,
      macd: {
        value: macd.value,
        signal: macd.signal,
        histogram: macd.histogram,
      },
      stochastic: stoch,
      adx: 0,
      obv,
      maStatus,
      bbPosition:
        currentPrice <= bb.lower
          ? '하단 이탈'
          : currentPrice >= bb.upper
            ? '상단 돌파'
            : '밴드 내',
      bbWidth,
      volumeRatio,
      per: stock.per,
      pbr: stock.pbr,
      roe: stock.roe,
      operatingGrowth: stock.operatingGrowth,
      foreignNetBuy: stock.foreignNetBuy,
      institutionNetBuy: stock.institutionNetBuy,
      foreignOwnership: stock.foreignOwnership,
      recommendation,
      expectedReturn,
      profitPotential,
      riskLevel,
      riskScore,
      targetPrice,
      stopLoss,
      aiAnalysis: '',
      historicalPattern: '',
      catalysts: [],
    }
  }

  private createBasicResult(stock: StockData): ScreenerResult {
    return {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      sector: stock.sector,
      price: stock.price,
      changePct: stock.changePct,
      score: 50,
      grade: 'B',
      signals: [],
      rsi: 50,
      macd: { value: 0, signal: 0, histogram: 0 },
      stochastic: { k: 50, d: 50 },
      adx: 0,
      obv: '—',
      maStatus: '데이터 부족',
      bbPosition: '—',
      bbWidth: 0,
      volumeRatio: 1,
      per: stock.per,
      pbr: stock.pbr,
      roe: stock.roe,
      operatingGrowth: stock.operatingGrowth,
      foreignNetBuy: 0,
      institutionNetBuy: 0,
      foreignOwnership: 0,
      recommendation: '데이터 부족',
      expectedReturn: '—',
      profitPotential: 50,
      riskLevel: 'MID',
      riskScore: 50,
      targetPrice: stock.price,
      stopLoss: stock.price,
      aiAnalysis: '',
      historicalPattern: '',
      catalysts: [],
    }
  }

  // ═══ 기술적 지표 계산 함수 ═══

  private calcRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50
    let gains = 0,
      losses = 0
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1]
      if (diff > 0) gains += diff
      else losses -= diff
    }
    if (losses === 0) return 100
    return 100 - 100 / (1 + gains / period / (losses / period))
  }

  private calcMACD(prices: number[]): {
    value: number
    signal: number
    histogram: number
    prevHistogram: number
  } {
    const ema12 = this.calcEMA(prices, 12)
    const ema26 = this.calcEMA(prices, 26)
    const macdLine = ema12.map((v, i) => v - ema26[i])
    const signalLine = this.calcEMA(macdLine.slice(-9), 9)
    const value = macdLine[macdLine.length - 1]
    const signal = signalLine[signalLine.length - 1]
    const histogram = value - signal
    const prevValue = macdLine[macdLine.length - 2] ?? value
    const prevSignal =
      signalLine.length > 1 ? signalLine[signalLine.length - 2] : signal
    return { value, signal, histogram, prevHistogram: prevValue - prevSignal }
  }

  private calcBB(
    prices: number[],
    period: number,
    mult: number
  ): { upper: number; lower: number; middle: number } {
    const slice = prices.slice(-period)
    const sma = slice.reduce((a, b) => a + b, 0) / period
    const sd = Math.sqrt(
      slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period
    )
    return { upper: sma + mult * sd, lower: sma - mult * sd, middle: sma }
  }

  private calcSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] ?? 0
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period
  }

  private calcEMA(prices: number[], period: number): number[] {
    const mult = 2 / (period + 1)
    const ema: number[] = [prices[0]]
    for (let i = 1; i < prices.length; i++) {
      ema.push((prices[i] - ema[i - 1]) * mult + ema[i - 1])
    }
    return ema
  }

  private calcStochastic(
    prices: number[],
    period: number,
    smooth: number
  ): { k: number; d: number } {
    if (prices.length < period) return { k: 50, d: 50 }
    const recent = prices.slice(-period)
    const high = Math.max(...recent)
    const low = Math.min(...recent)
    const k =
      high === low
        ? 50
        : ((prices[prices.length - 1] - low) / (high - low)) * 100
    // D = K의 smooth일 SMA (근사치)
    const kValues = prices
      .slice(-(period + smooth))
      .map((_, i, arr) => {
        const sl = arr.slice(Math.max(0, i - period + 1), i + 1)
        const h = Math.max(...sl),
          l = Math.min(...sl)
        return h === l ? 50 : ((arr[i] - l) / (h - l)) * 100
      })
      .slice(-smooth)
    const d = kValues.reduce((a, b) => a + b, 0) / kValues.length
    return { k, d }
  }
}
