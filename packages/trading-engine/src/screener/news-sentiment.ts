/**
 * 📰 AI 뉴스 감성 분석
 *
 * 뉴스/공시/SNS 텍스트를 AI로 분석하여
 * 매매 시그널에 반영
 *
 * 감성 점수: -100 (극도 부정) ~ +100 (극도 긍정)
 */

export interface NewsItem {
  title: string
  source: string
  timestamp: Date
  symbol?: string
}

export interface SentimentResult {
  symbol: string
  score: number // -100 ~ +100
  label: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish'
  newsCount: number
  topNews: string[]
  confidence: number // 0~100
}

export class NewsSentimentAnalyzer {
  private positiveWords = [
    '상승',
    '급등',
    '신고가',
    '호실적',
    '어닝서프라이즈',
    '매수',
    '성장',
    '흑자',
    '수주',
    '계약',
    '특허',
    '승인',
    '확대',
    'surge',
    'rally',
    'breakthrough',
    'beat',
    'upgrade',
    'bullish',
    'record',
    'growth',
    'profit',
    'innovation',
    'approved',
  ]

  private negativeWords = [
    '하락',
    '급락',
    '폭락',
    '적자',
    '손실',
    '매도',
    '리콜',
    '소송',
    '제재',
    '규제',
    '파산',
    '축소',
    '감소',
    '위기',
    'crash',
    'decline',
    'loss',
    'recall',
    'lawsuit',
    'bearish',
    'downgrade',
    'warning',
    'bankruptcy',
    'risk',
    'investigation',
  ]

  private strongPositive = [
    '급등',
    '신고가',
    '어닝서프라이즈',
    'surge',
    'breakthrough',
    'record',
  ]
  private strongNegative = [
    '폭락',
    '파산',
    '위기',
    'crash',
    'bankruptcy',
    'investigation',
  ]

  analyzeNews(news: NewsItem[], symbol: string): SentimentResult {
    const relevant = news.filter((n) => !n.symbol || n.symbol === symbol)
    if (relevant.length === 0) {
      return {
        symbol,
        score: 0,
        label: 'neutral',
        newsCount: 0,
        topNews: [],
        confidence: 0,
      }
    }

    let totalScore = 0

    for (const item of relevant) {
      const text = item.title.toLowerCase()
      let itemScore = 0

      for (const word of this.strongPositive) {
        if (text.includes(word.toLowerCase())) itemScore += 15
      }
      for (const word of this.positiveWords) {
        if (text.includes(word.toLowerCase())) itemScore += 5
      }
      for (const word of this.strongNegative) {
        if (text.includes(word.toLowerCase())) itemScore -= 15
      }
      for (const word of this.negativeWords) {
        if (text.includes(word.toLowerCase())) itemScore -= 5
      }

      totalScore += Math.max(-30, Math.min(30, itemScore))
    }

    const avgScore = Math.round(totalScore / relevant.length)
    const score = Math.max(-100, Math.min(100, avgScore * 3))

    const label: SentimentResult['label'] =
      score >= 50
        ? 'very_bullish'
        : score >= 20
          ? 'bullish'
          : score <= -50
            ? 'very_bearish'
            : score <= -20
              ? 'bearish'
              : 'neutral'

    return {
      symbol,
      score,
      label,
      newsCount: relevant.length,
      topNews: relevant.slice(0, 3).map((n) => n.title),
      confidence: Math.min(100, relevant.length * 15),
    }
  }

  async analyzeWithAI(
    news: NewsItem[],
    symbol: string,
    apiKey: string
  ): Promise<SentimentResult> {
    const fallback = this.analyzeNews(news, symbol)

    if (!apiKey || news.length === 0) return fallback

    try {
      const titles = news
        .slice(0, 10)
        .map((n) => n.title)
        .join('\n')
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: `다음 뉴스 제목들의 ${symbol} 주가 영향을 분석하세요.\n\n${titles}\n\nJSON 반환: {"score": -100~100, "label": "very_bullish/bullish/neutral/bearish/very_bearish", "reasoning": "한줄요약"}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 200,
          }),
        }
      )
      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      const text = data.choices[0]?.message?.content ?? ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        return {
          ...fallback,
          score: parsed.score ?? fallback.score,
          label: parsed.label ?? fallback.label,
          confidence: 85,
        }
      }
    } catch {
      // AI 실패 시 규칙 기반 폴백
    }
    return fallback
  }
}
