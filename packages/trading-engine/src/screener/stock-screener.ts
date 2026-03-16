/**
 * AI 종목 스크리너 — 기술적 지표 기반 종목 추천
 *
 * 분석 기준:
 * 1. RSI 과매도 종목 (RSI < 30)
 * 2. 골든크로스 임박 종목 (5일 MA ≈ 20일 MA, 상향 추세)
 * 3. 볼린저밴드 하단 터치 종목
 * 4. 거래량 급증 종목 (평균 대비 200%+)
 * 5. AI 복합 스코어 (모든 지표 종합)
 *
 * ⚠️ 종목 추천은 기술적 분석 참고용이며 투자 결정의 책임은 이용자에게 있습니다.
 */

export interface StockData {
  symbol: string
  name: string
  market: 'KR' | 'US'
  price: number
  change: number
  changePct: number
  volume: number
  avgVolume: number
  prices: number[] // 최근 30일 종가
}

export interface ScreenerResult {
  symbol: string
  name: string
  market: 'KR' | 'US'
  price: number
  changePct: number
  score: number // 0~100 종합 점수
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C'
  signals: ScreenerSignal[]
  rsi: number
  maStatus: string
  bbPosition: string
  volumeRatio: number
  recommendation: string
}

export interface ScreenerSignal {
  type: 'bullish' | 'bearish' | 'neutral'
  indicator: string
  description: string
  weight: number
}

export class StockScreener {
  analyze(stocks: StockData[]): ScreenerResult[] {
    return stocks
      .map((stock) => this.analyzeStock(stock))
      .sort((a, b) => b.score - a.score)
  }

  analyzeStock(stock: StockData): ScreenerResult {
    const signals: ScreenerSignal[] = []
    let totalScore = 50 // 기본 중립

    const prices = stock.prices
    if (prices.length < 20) {
      return this.createNeutralResult(stock)
    }

    // 1. RSI 분석
    const rsi = this.calculateRSI(prices, 14)
    if (rsi < 30) {
      signals.push({
        type: 'bullish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 과매도 구간`,
        weight: 20,
      })
      totalScore += 20
    } else if (rsi < 40) {
      signals.push({
        type: 'bullish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 매수 관심`,
        weight: 10,
      })
      totalScore += 10
    } else if (rsi > 70) {
      signals.push({
        type: 'bearish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 과매수 구간`,
        weight: -15,
      })
      totalScore -= 15
    } else if (rsi > 60) {
      signals.push({
        type: 'bearish',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 매도 주의`,
        weight: -5,
      })
      totalScore -= 5
    } else {
      signals.push({
        type: 'neutral',
        indicator: 'RSI',
        description: `RSI ${rsi.toFixed(1)} — 중립`,
        weight: 0,
      })
    }

    // 2. MA 크로스오버 분석
    const ma5 = this.calculateSMA(prices, 5)
    const ma20 = this.calculateSMA(prices, 20)
    const prevMa5 = this.calculateSMA(prices.slice(0, -1), 5)
    const prevMa20 = this.calculateSMA(prices.slice(0, -1), 20)

    let maStatus = '중립'
    if (ma5 > ma20 && prevMa5 <= prevMa20) {
      signals.push({
        type: 'bullish',
        indicator: 'MA',
        description: '골든크로스 발생!',
        weight: 25,
      })
      totalScore += 25
      maStatus = '골든크로스'
    } else if (ma5 < ma20 && prevMa5 >= prevMa20) {
      signals.push({
        type: 'bearish',
        indicator: 'MA',
        description: '데드크로스 발생',
        weight: -20,
      })
      totalScore -= 20
      maStatus = '데드크로스'
    } else if (ma5 > ma20) {
      signals.push({
        type: 'bullish',
        indicator: 'MA',
        description: '상승 추세 (5MA > 20MA)',
        weight: 10,
      })
      totalScore += 10
      maStatus = '상승 추세'
    } else {
      signals.push({
        type: 'bearish',
        indicator: 'MA',
        description: '하락 추세 (5MA < 20MA)',
        weight: -10,
      })
      totalScore -= 10
      maStatus = '하락 추세'
    }

    // 3. 볼린저밴드 분석
    const bb = this.calculateBB(prices, 20, 2)
    const currentPrice = prices[prices.length - 1]
    let bbPosition = '밴드 내'

    if (currentPrice <= bb.lower) {
      signals.push({
        type: 'bullish',
        indicator: 'BB',
        description: '볼린저 하단 터치 — 반등 가능',
        weight: 15,
      })
      totalScore += 15
      bbPosition = '하단 터치'
    } else if (currentPrice >= bb.upper) {
      signals.push({
        type: 'bearish',
        indicator: 'BB',
        description: '볼린저 상단 터치 — 조정 가능',
        weight: -10,
      })
      totalScore -= 10
      bbPosition = '상단 터치'
    }

    // 4. 거래량 분석
    const volumeRatio = stock.avgVolume > 0 ? stock.volume / stock.avgVolume : 1
    if (volumeRatio > 3) {
      signals.push({
        type: 'bullish',
        indicator: 'VOL',
        description: `거래량 ${volumeRatio.toFixed(1)}배 폭증`,
        weight: 15,
      })
      totalScore += 15
    } else if (volumeRatio > 2) {
      signals.push({
        type: 'bullish',
        indicator: 'VOL',
        description: `거래량 ${volumeRatio.toFixed(1)}배 급증`,
        weight: 10,
      })
      totalScore += 10
    } else if (volumeRatio < 0.5) {
      signals.push({
        type: 'neutral',
        indicator: 'VOL',
        description: '거래량 감소 — 관망',
        weight: -5,
      })
      totalScore -= 5
    }

    // 5. 가격 모멘텀
    if (stock.changePct > 3) {
      signals.push({
        type: 'bullish',
        indicator: 'MOM',
        description: `당일 ${stock.changePct.toFixed(1)}% 급등`,
        weight: 5,
      })
      totalScore += 5
    } else if (stock.changePct < -3) {
      signals.push({
        type: 'bearish',
        indicator: 'MOM',
        description: `당일 ${stock.changePct.toFixed(1)}% 급락`,
        weight: -5,
      })
      totalScore -= 5
    }

    // 스코어 정규화 (0~100)
    const score = Math.max(0, Math.min(100, totalScore))
    const grade =
      score >= 80
        ? 'A+'
        : score >= 70
          ? 'A'
          : score >= 60
            ? 'B+'
            : score >= 50
              ? 'B'
              : 'C'

    const recommendation =
      score >= 80
        ? '강력 매수 관심'
        : score >= 70
          ? '매수 관심'
          : score >= 60
            ? '관심 종목'
            : score >= 40
              ? '중립 — 관망'
              : '매도 주의'

    return {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      price: stock.price,
      changePct: stock.changePct,
      score,
      grade,
      signals,
      rsi,
      maStatus,
      bbPosition,
      volumeRatio,
      recommendation,
    }
  }

  private createNeutralResult(stock: StockData): ScreenerResult {
    return {
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      price: stock.price,
      changePct: stock.changePct,
      score: 50,
      grade: 'B',
      signals: [
        {
          type: 'neutral',
          indicator: 'DATA',
          description: '분석 데이터 부족',
          weight: 0,
        },
      ],
      rsi: 50,
      maStatus: '데이터 부족',
      bbPosition: '—',
      volumeRatio: 1,
      recommendation: '데이터 부족 — 추가 분석 필요',
    }
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50
    let gains = 0,
      losses = 0
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    if (losses === 0) return 100
    const rs = gains / period / (losses / period)
    return 100 - 100 / (1 + rs)
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]
    const slice = prices.slice(-period)
    return slice.reduce((a, b) => a + b, 0) / period
  }

  private calculateBB(
    prices: number[],
    period: number,
    stdDev: number
  ): { upper: number; lower: number } {
    const slice = prices.slice(-period)
    const sma = slice.reduce((a, b) => a + b, 0) / period
    const variance =
      slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period
    const sd = Math.sqrt(variance)
    return { upper: sma + stdDev * sd, lower: sma - stdDev * sd }
  }
}
