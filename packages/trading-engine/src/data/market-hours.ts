export type MarketType = 'KR' | 'US' | 'CRYPTO'

export class MarketHours {
  /**
   * 한국 주식시장: 09:00-15:30 KST (월~금)
   * 미국 주식시장: 09:30-16:00 EST (월~금)
   * 암호화폐: 24/7
   */
  static isMarketOpen(market: MarketType = 'KR', now?: Date): boolean {
    if (market === 'CRYPTO') return true

    const d = now ?? new Date()

    if (market === 'KR') {
      const kst = new Date(
        d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      )
      const day = kst.getDay()
      if (day === 0 || day === 6) return false
      const totalMinutes = kst.getHours() * 60 + kst.getMinutes()
      return totalMinutes >= 540 && totalMinutes < 930 // 09:00 ~ 15:30
    }

    if (market === 'US') {
      const est = new Date(
        d.toLocaleString('en-US', { timeZone: 'America/New_York' })
      )
      const day = est.getDay()
      if (day === 0 || day === 6) return false
      const totalMinutes = est.getHours() * 60 + est.getMinutes()
      return totalMinutes >= 570 && totalMinutes < 960 // 09:30 ~ 16:00
    }

    return false
  }

  static getTimezone(market: MarketType = 'KR'): string {
    switch (market) {
      case 'KR':
        return 'Asia/Seoul'
      case 'US':
        return 'America/New_York'
      case 'CRYPTO':
        return 'UTC'
      default:
        return 'Asia/Seoul'
    }
  }

  static getMarketName(market: MarketType): string {
    switch (market) {
      case 'KR':
        return '한국 주식시장 (KOSPI/KOSDAQ)'
      case 'US':
        return '미국 주식시장 (NYSE/NASDAQ)'
      case 'CRYPTO':
        return '암호화폐 (24/7)'
      default:
        return 'Unknown'
    }
  }
}
