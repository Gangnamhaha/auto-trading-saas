const MAX_WAIT_MS = 5000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number

  constructor(maxTokens: number, refillRate: number) {
    if (maxTokens <= 0 || refillRate <= 0) {
      throw new Error('maxTokens and refillRate must be positive values')
    }

    this.maxTokens = maxTokens
    this.refillRate = refillRate
    this.tokens = maxTokens
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    const startedAt = Date.now()

    while (Date.now() - startedAt <= MAX_WAIT_MS) {
      this.refill()

      if (this.tokens >= 1) {
        this.tokens -= 1
        return
      }

      const deficit = 1 - this.tokens
      const waitMs = Math.max(10, Math.ceil((deficit / this.refillRate) * 1000))
      await sleep(waitMs)
    }

    throw new Error('Rate limiter wait timeout exceeded')
  }

  private refill(): void {
    const now = Date.now()
    const elapsedSeconds = (now - this.lastRefill) / 1000

    if (elapsedSeconds <= 0) {
      return
    }

    const refillAmount = elapsedSeconds * this.refillRate
    this.tokens = Math.min(this.maxTokens, this.tokens + refillAmount)
    this.lastRefill = now
  }
}
