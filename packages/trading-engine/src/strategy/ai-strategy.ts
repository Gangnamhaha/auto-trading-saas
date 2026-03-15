import type { IStrategy, OHLCV, Signal, StrategyParams } from './types'

/**
 * AI 전략 — LLM API를 활용한 시장 분석 및 매매 신호 생성
 *
 * 지원 모델:
 * - OpenAI GPT-4o / GPT-4o-mini
 * - Anthropic Claude 3.5 Sonnet
 *
 * 동작 방식:
 * 1. 최근 N일간 OHLCV 데이터를 LLM에 전달
 * 2. 기술적 지표 (MA, RSI, 볼린저밴드) 계산 후 컨텍스트 포함
 * 3. LLM이 BUY/SELL/HOLD 시그널 + 근거 반환
 * 4. JSON 파싱하여 Signal로 변환
 *
 * ⚠️ AI 분석은 참고용이며 투자 결정의 책임은 사용자에게 있습니다.
 */
export class AIStrategy implements IStrategy {
  name = 'ai_analysis'

  constructor(
    private params: {
      provider: 'openai' | 'anthropic'
      model: string
      apiKey: string
      lookbackDays: number
      temperature: number
    } = {
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: '',
      lookbackDays: 30,
      temperature: 0.3,
    }
  ) {}

  analyze(data: OHLCV[]): Signal[] {
    // 동기 인터페이스이므로 마지막 N일 데이터 기반 규칙 기반 분석 실행
    // 실시간 AI 분석은 analyzeAsync()를 사용
    const signals: Signal[] = data.map(() => 'HOLD' as Signal)

    if (data.length < 2) return signals

    // 기본 기술적 분석 조합 (AI 호출 불가 시 폴백)
    const latest = data[data.length - 1]
    const prev = data[data.length - 2]
    const closes = data.map((d) => d.close)

    // RSI 계산
    const rsi = this.calculateRSI(closes, 14)
    const latestRSI = rsi[rsi.length - 1]

    // MA 크로스오버 계산
    const sma5 = this.calculateSMA(closes, 5)
    const sma20 = this.calculateSMA(closes, 20)
    const latestSMA5 = sma5[sma5.length - 1]
    const latestSMA20 = sma20[sma20.length - 1]
    const prevSMA5 = sma5[sma5.length - 2]
    const prevSMA20 = sma20[sma20.length - 2]

    // 볼린저밴드 계산
    const bb = this.calculateBollingerBands(closes, 20, 2)

    // 복합 시그널 (3개 지표 합산)
    let score = 0

    // RSI 기반 점수
    if (latestRSI !== undefined) {
      if (latestRSI < 30)
        score += 2 // 과매도 → 매수
      else if (latestRSI < 40) score += 1
      else if (latestRSI > 70)
        score -= 2 // 과매수 → 매도
      else if (latestRSI > 60) score -= 1
    }

    // MA 크로스오버 기반 점수
    if (
      latestSMA5 !== undefined &&
      latestSMA20 !== undefined &&
      prevSMA5 !== undefined &&
      prevSMA20 !== undefined
    ) {
      if (prevSMA5 <= prevSMA20 && latestSMA5 > latestSMA20) score += 2 // 골든크로스
      if (prevSMA5 >= prevSMA20 && latestSMA5 < latestSMA20) score -= 2 // 데드크로스
    }

    // 볼린저밴드 기반 점수
    if (bb) {
      if (latest.close <= bb.lower) score += 1
      if (latest.close >= bb.upper) score -= 1
    }

    // 가격 모멘텀 점수
    if (latest.close > prev.close) score += 0.5
    else if (latest.close < prev.close) score -= 0.5

    // 최종 시그널 결정
    const finalSignal: Signal =
      score >= 2 ? 'BUY' : score <= -2 ? 'SELL' : 'HOLD'
    signals[signals.length - 1] = finalSignal

    return signals
  }

  /**
   * 비동기 AI 분석 — 실제 LLM API 호출
   * 데몬에서 사용 시 이 메서드를 직접 호출
   */
  async analyzeAsync(data: OHLCV[]): Promise<{
    signal: Signal
    confidence: number
    reasoning: string
    indicators: Record<string, number>
  }> {
    const lookback = data.slice(-this.params.lookbackDays)
    const closes = lookback.map((d) => d.close)

    // 기술적 지표 계산
    const rsi = this.calculateRSI(closes, 14)
    const sma5 = this.calculateSMA(closes, 5)
    const sma20 = this.calculateSMA(closes, 20)
    const bb = this.calculateBollingerBands(closes, 20, 2)

    const indicators = {
      rsi: rsi[rsi.length - 1] ?? 50,
      sma5: sma5[sma5.length - 1] ?? 0,
      sma20: sma20[sma20.length - 1] ?? 0,
      bbUpper: bb?.upper ?? 0,
      bbLower: bb?.lower ?? 0,
      priceChange:
        lookback.length >= 2
          ? ((lookback[lookback.length - 1].close -
              lookback[lookback.length - 2].close) /
              lookback[lookback.length - 2].close) *
            100
          : 0,
    }

    const prompt = this.buildPrompt(lookback, indicators)

    try {
      const response = await this.callLLM(prompt)
      return this.parseResponse(response, indicators)
    } catch {
      // LLM 호출 실패 시 기술적 분석 폴백
      const signals = this.analyze(data)
      return {
        signal: signals[signals.length - 1],
        confidence: 0.5,
        reasoning: 'AI 분석 실패 — 기술적 지표 기반 폴백 분석 적용',
        indicators,
      }
    }
  }

  private buildPrompt(
    data: OHLCV[],
    indicators: Record<string, number>
  ): string {
    const recent5 = data.slice(-5)
    const priceHistory = recent5
      .map(
        (d) =>
          `${d.date}: O=${d.open} H=${d.high} L=${d.low} C=${d.close} V=${d.volume}`
      )
      .join('\n')

    return `당신은 주식 기술적 분석 전문가입니다. 다음 데이터를 분석하고 매매 시그널을 JSON으로 반환하세요.

## 최근 5일 가격 데이터
${priceHistory}

## 기술적 지표
- RSI(14): ${indicators.rsi.toFixed(2)}
- SMA(5): ${indicators.sma5.toFixed(2)}
- SMA(20): ${indicators.sma20.toFixed(2)}
- 볼린저밴드 상단: ${indicators.bbUpper.toFixed(2)}
- 볼린저밴드 하단: ${indicators.bbLower.toFixed(2)}
- 전일 대비 변화율: ${indicators.priceChange.toFixed(2)}%

## 요청
다음 JSON 형식으로만 응답하세요:
{"signal": "BUY" | "SELL" | "HOLD", "confidence": 0.0~1.0, "reasoning": "한국어 분석 근거"}

⚠️ 주의: 이 분석은 참고용이며 투자 결정의 책임은 사용자에게 있습니다.`
  }

  private async callLLM(prompt: string): Promise<string> {
    if (this.params.provider === 'openai') {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.params.apiKey}`,
          },
          body: JSON.stringify({
            model: this.params.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: this.params.temperature,
            max_tokens: 300,
          }),
        }
      )
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      return data.choices[0]?.message?.content ?? ''
    }

    if (this.params.provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.params.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.params.model,
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = (await response.json()) as {
        content: Array<{ text: string }>
      }
      return data.content[0]?.text ?? ''
    }

    throw new Error(`Unsupported provider: ${this.params.provider}`)
  }

  private parseResponse(
    response: string,
    indicators: Record<string, number>
  ): {
    signal: Signal
    confidence: number
    reasoning: string
    indicators: Record<string, number>
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found')
      const parsed = JSON.parse(jsonMatch[0]) as {
        signal: string
        confidence: number
        reasoning: string
      }
      const signal: Signal =
        parsed.signal === 'BUY'
          ? 'BUY'
          : parsed.signal === 'SELL'
            ? 'SELL'
            : 'HOLD'
      return {
        signal,
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
        reasoning: parsed.reasoning ?? 'AI 분석 완료',
        indicators,
      }
    } catch {
      return {
        signal: 'HOLD',
        confidence: 0.3,
        reasoning: 'AI 응답 파싱 실패 — HOLD 유지',
        indicators,
      }
    }
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = []
    for (let i = 0; i < prices.length; i++) {
      if (i < period) {
        rsi.push(50)
        continue
      }
      let gains = 0
      let losses = 0
      for (let j = i - period + 1; j <= i; j++) {
        const change = prices[j] - prices[j - 1]
        if (change > 0) gains += change
        else losses -= change
      }
      const avgGain = gains / period
      const avgLoss = losses / period
      if (avgLoss === 0) {
        rsi.push(100)
      } else {
        const rs = avgGain / avgLoss
        rsi.push(100 - 100 / (1 + rs))
      }
    }
    return rsi
  }

  private calculateSMA(
    prices: number[],
    period: number
  ): (number | undefined)[] {
    return prices.map((_, i) => {
      if (i < period - 1) return undefined
      const slice = prices.slice(i - period + 1, i + 1)
      return slice.reduce((a, b) => a + b, 0) / period
    })
  }

  private calculateBollingerBands(
    prices: number[],
    period: number,
    stdDev: number
  ): { upper: number; lower: number; middle: number } | null {
    if (prices.length < period) return null
    const slice = prices.slice(-period)
    const sma = slice.reduce((a, b) => a + b, 0) / period
    const variance =
      slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period
    const sd = Math.sqrt(variance)
    return {
      upper: sma + stdDev * sd,
      middle: sma,
      lower: sma - stdDev * sd,
    }
  }

  getDefaultParams(): StrategyParams {
    return {
      provider: 'openai',
      model: 'gpt-4o-mini',
      lookbackDays: 30,
      temperature: 0.3,
    }
  }

  validateParams(params: StrategyParams): boolean {
    return (
      typeof params.provider === 'string' &&
      typeof params.model === 'string' &&
      typeof params.lookbackDays === 'number' &&
      (params.lookbackDays as number) > 0
    )
  }
}
