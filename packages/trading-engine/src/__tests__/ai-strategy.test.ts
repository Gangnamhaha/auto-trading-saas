import { describe, expect, it, vi } from 'vitest'
import { AIStrategy } from '../strategy/ai-strategy'
import type { OHLCV } from '../strategy/types'

function makeOHLCV(closes: number[]): OHLCV[] {
  return closes.map((close, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    open: close - 50,
    high: close + 100,
    low: close - 100,
    close,
    volume: 1000,
  }))
}

describe('AIStrategy', () => {
  it('returns HOLD for insufficient data', () => {
    const ai = new AIStrategy()
    expect(ai.analyze(makeOHLCV([70000]))[0]).toBe('HOLD')
  })

  it('handles 30-day declining prices', () => {
    const ai = new AIStrategy()
    const prices = Array.from({ length: 30 }, (_, i) => 80000 - i * 500)
    const signals = ai.analyze(makeOHLCV(prices))
    expect(['BUY', 'SELL', 'HOLD']).toContain(signals[signals.length - 1])
  })

  it('handles 30-day rising prices', () => {
    const ai = new AIStrategy()
    const prices = Array.from({ length: 30 }, (_, i) => 60000 + i * 500)
    const signals = ai.analyze(makeOHLCV(prices))
    expect(['BUY', 'SELL', 'HOLD']).toContain(signals[signals.length - 1])
  })

  it('HOLD for sideways market', () => {
    const ai = new AIStrategy()
    const prices = Array(30)
      .fill(0)
      .map((_, i) => 70000 + Math.sin(i * 0.5) * 100)
    expect(ai.analyze(makeOHLCV(prices))[prices.length - 1]).toBe('HOLD')
  })

  it('analyzeAsync returns fallback on API failure', async () => {
    const ai = new AIStrategy({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'bad',
      lookbackDays: 30,
      temperature: 0.3,
    })
    const orig = globalThis.fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fail'))
    const result = await ai.analyzeAsync(makeOHLCV(Array(30).fill(70000)))
    expect(result).toHaveProperty('signal')
    expect(result).toHaveProperty('confidence')
    expect(result.reasoning).toContain('폴백')
    globalThis.fetch = orig
  })

  it('analyzeAsync parses valid LLM response', async () => {
    const ai = new AIStrategy({
      provider: 'openai',
      model: 'gpt-4o-mini',
      apiKey: 'key',
      lookbackDays: 30,
      temperature: 0.3,
    })
    const orig = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi
        .fn()
        .mockResolvedValue({
          choices: [
            {
              message: {
                content:
                  '{"signal":"BUY","confidence":0.8,"reasoning":"골든크로스"}',
              },
            },
          ],
        }),
    })
    const result = await ai.analyzeAsync(makeOHLCV(Array(30).fill(70000)))
    expect(result.signal).toBe('BUY')
    expect(result.confidence).toBe(0.8)
    globalThis.fetch = orig
  })

  it('validates params', () => {
    const ai = new AIStrategy()
    expect(
      ai.validateParams({
        provider: 'openai',
        model: 'gpt-4o',
        lookbackDays: 30,
      })
    ).toBe(true)
    expect(
      ai.validateParams({
        provider: 'openai',
        model: 'gpt-4o',
        lookbackDays: -1,
      })
    ).toBe(false)
  })
})
