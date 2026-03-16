/**
 * AI 기반 마케팅 콘텐츠 자동 생성기
 *
 * 기능:
 * 1. 주간 시장 리뷰 블로그 자동 작성
 * 2. SNS 포스트 자동 생성 (인스타/트위터/스레드)
 * 3. 뉴스레터 콘텐츠 자동 작성
 * 4. 백테스트 성과 리포트 자동 생성
 */
export class ContentGenerator {
  constructor(
    private aiProvider: 'openai' | 'anthropic' = 'openai',
    private apiKey: string = ''
  ) {}

  async generateWeeklyReview(data: {
    kospiChange: number
    kosdaqChange: number
    topGainers: Array<{ name: string; change: number }>
    strategyPerformance: Array<{ name: string; returnPct: number }>
  }): Promise<string> {
    const prompt = `주간 시장 리뷰 블로그 포스트를 한국어로 작성하세요.

데이터:
- KOSPI 주간 변동: ${data.kospiChange > 0 ? '+' : ''}${data.kospiChange}%
- KOSDAQ 주간 변동: ${data.kosdaqChange > 0 ? '+' : ''}${data.kosdaqChange}%
- 상승 종목: ${data.topGainers.map((g) => `${g.name}(${g.change > 0 ? '+' : ''}${g.change}%)`).join(', ')}
- 전략 성과: ${data.strategyPerformance.map((s) => `${s.name}(${s.returnPct > 0 ? '+' : ''}${s.returnPct}%)`).join(', ')}

형식:
- 제목 (H1)
- 시장 요약 (2-3문단)
- 주요 종목 분석
- AutoTrade KR 전략 성과 요약
- 다음 주 전망

반드시 포함: "⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다. 투자 원금 손실이 발생할 수 있습니다."
마크다운 형식으로 작성.`

    return this.callAI(prompt)
  }

  async generateSNSPosts(topic: string): Promise<{
    twitter: string
    instagram: string
    threads: string
  }> {
    const prompt = `다음 주제로 SNS 포스트 3개를 한국어로 작성하세요: "${topic}"

1. 트위터 (280자 이내, 해시태그 포함)
2. 인스타그램 (캡션 500자, 해시태그 10개)
3. 스레드 (300자 이내)

모든 포스트에 포함:
- AutoTrade KR 언급
- "투자 원금 손실 가능" 면책 고지
- 수익률 보장 문구 절대 금지

JSON 형식으로 반환: {"twitter": "...", "instagram": "...", "threads": "..."}`

    const response = await this.callAI(prompt)
    try {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {
      // fallback
    }
    return {
      twitter: `📊 ${topic} — AutoTrade KR에서 자동매매로 스마트하게 투자하세요! ⚠️ 투자 원금 손실 가능 #자동매매 #주식투자 #퀀트`,
      instagram: `📈 ${topic}\n\nAutoTrade KR로 코딩 없이 자동매매를 시작하세요.\n\n⚠️ 투자 원금 손실이 발생할 수 있습니다.\n\n#자동매매 #주식투자 #퀀트투자 #백테스팅 #자동매매프로그램 #KOSPI #주식자동매매 #투자 #재테크 #AutoTradeKR`,
      threads: `📊 ${topic}\n\nAutoTrade KR — 한국 주식 자동매매 플랫폼\n\n⚠️ 투자 원금 손실 가능. 과거 수익률이 미래를 보장하지 않습니다.`,
    }
  }

  async generateNewsletter(data: {
    weekNumber: number
    marketSummary: string
    featuredStrategy: string
    strategyReturn: number
    newFeature?: string
  }): Promise<string> {
    return `# AutoTrade KR 주간 뉴스레터 #${data.weekNumber}

## 📊 이번 주 시장 요약
${data.marketSummary}

## ⭐ 주간 베스트 전략: ${data.featuredStrategy}
이번 주 수익률: ${data.strategyReturn > 0 ? '+' : ''}${data.strategyReturn}%

⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다.

${data.newFeature ? `## 🆕 새로운 기능\n${data.newFeature}\n` : ''}
## 💡 이번 주 팁
백테스팅으로 전략을 검증한 후 페이퍼트레이딩으로 30일간 연습하세요.

---
⚠️ 투자 원금 손실이 발생할 수 있습니다. 본 뉴스레터는 투자 조언이 아닙니다.
수신 거부: [링크]
`
  }

  async generateBacktestReport(result: {
    strategy: string
    symbol: string
    period: string
    totalReturn: number
    maxDrawdown: number
    sharpeRatio: number
    winRate: number
    totalTrades: number
  }): Promise<string> {
    return `# 📊 백테스트 성과 리포트

## 전략: ${result.strategy}
- 종목: ${result.symbol}
- 기간: ${result.period}

## 성과 지표
| 지표 | 값 |
|------|-----|
| 총 수익률 | ${result.totalReturn > 0 ? '+' : ''}${result.totalReturn}% |
| 최대 낙폭(MDD) | ${result.maxDrawdown}% |
| 샤프 비율 | ${result.sharpeRatio} |
| 승률 | ${result.winRate}% |
| 총 거래 | ${result.totalTrades}건 |

⚠️ 백테스트 결과는 과거 데이터 기반이며 미래 수익을 보장하지 않습니다.
실제 거래 시 슬리피지, 수수료 등으로 결과가 다를 수 있습니다.
`
  }

  private async callAI(prompt: string): Promise<string> {
    try {
      if (this.aiProvider === 'openai') {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              max_tokens: 1500,
            }),
          }
        )
        const data = (await response.json()) as {
          choices: Array<{ message: { content: string } }>
        }
        return data.choices[0]?.message?.content ?? ''
      }
      if (this.aiProvider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          }),
        })
        const data = (await response.json()) as {
          content: Array<{ text: string }>
        }
        return data.content[0]?.text ?? ''
      }
    } catch {
      return `[AI 생성 실패 — 폴백 콘텐츠]\n\n${prompt.slice(0, 200)}...`
    }
    return ''
  }
}
