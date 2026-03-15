export class MarketHours {
  static isMarketOpen(now?: Date): boolean {
    const d = now ?? new Date()
    const kst = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
    const day = kst.getDay()
    if (day === 0 || day === 6) return false
    const hours = kst.getHours()
    const minutes = kst.getMinutes()
    const totalMinutes = hours * 60 + minutes
    return totalMinutes >= 540 && totalMinutes < 930
  }

  static getTimezone(): string {
    return 'Asia/Seoul'
  }
}
