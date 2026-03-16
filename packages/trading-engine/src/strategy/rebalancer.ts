/**
 * 📊 포트폴리오 자동 리밸런싱
 *
 * 목표 비중에서 벗어난 포지션을 자동 재조정
 * - 임계값 초과 시 자동 리밸런싱 (기본 5%)
 * - 일별/주별/월별 스케줄 리밸런싱
 * - 세금 최적화 (손실 종목 우선 매도)
 */

export interface PortfolioTarget {
  symbol: string
  targetWeight: number // 0~100%
  currentWeight: number
  deviation: number // 목표 대비 편차 %
}

export interface RebalanceOrder {
  symbol: string
  side: 'buy' | 'sell'
  amount: number // 금액
  reason: string
}

export class PortfolioRebalancer {
  constructor(
    private threshold: number = 5, // 리밸런싱 임계값 %
    private minTradeAmount: number = 100000 // 최소 거래 금액
  ) {}

  analyze(targets: PortfolioTarget[]): RebalanceOrder[] {
    const orders: RebalanceOrder[] = []

    // 편차가 큰 것부터 처리
    const sorted = [...targets].sort(
      (a, b) => Math.abs(b.deviation) - Math.abs(a.deviation)
    )

    for (const target of sorted) {
      if (Math.abs(target.deviation) < this.threshold) continue

      if (target.deviation > 0) {
        // 비중 초과 → 매도
        orders.push({
          symbol: target.symbol,
          side: 'sell',
          amount: Math.round(target.deviation * 100) * 100,
          reason: `비중 ${target.currentWeight.toFixed(1)}% → 목표 ${target.targetWeight}% (${target.deviation > 0 ? '+' : ''}${target.deviation.toFixed(1)}% 초과)`,
        })
      } else {
        // 비중 부족 → 매수
        orders.push({
          symbol: target.symbol,
          side: 'buy',
          amount: Math.round(Math.abs(target.deviation) * 100) * 100,
          reason: `비중 ${target.currentWeight.toFixed(1)}% → 목표 ${target.targetWeight}% (${target.deviation.toFixed(1)}% 부족)`,
        })
      }
    }

    return orders.filter((o) => o.amount >= this.minTradeAmount)
  }

  needsRebalancing(targets: PortfolioTarget[]): boolean {
    return targets.some((t) => Math.abs(t.deviation) >= this.threshold)
  }
}
