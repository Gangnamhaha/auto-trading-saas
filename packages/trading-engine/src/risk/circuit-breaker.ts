export class CircuitBreaker {
  private dailyLossPercent = 0
  private tripped = false
  private lastResetDate = ''

  constructor(private maxDailyLossPercent: number) {}

  recordLoss(pnl: number, accountBalance: number): void {
    this.checkAndReset()
    if (pnl < 0 && accountBalance > 0) {
      this.dailyLossPercent += (Math.abs(pnl) / accountBalance) * 100
      if (this.dailyLossPercent >= this.maxDailyLossPercent) {
        this.tripped = true
      }
    }
  }

  isTripped(): boolean {
    this.checkAndReset()
    return this.tripped
  }

  getDailyLoss(): number {
    this.checkAndReset()
    return this.dailyLossPercent
  }

  private checkAndReset(): void {
    const today = new Date().toISOString().split('T')[0]
    if (this.lastResetDate !== today) {
      this.dailyLossPercent = 0
      this.tripped = false
      this.lastResetDate = today
    }
  }
}
