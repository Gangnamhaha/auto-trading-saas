import { EventEmitter } from 'events'
import type { MarketTick } from './types'

export class KISWebSocket extends EventEmitter {
  private approvalKey: string | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private subscribedSymbols: Set<string> = new Set()
  private connected = false

  constructor(
    private appKey: string,
    private appSecret: string,
    private env: 'demo' | 'real' = 'demo'
  ) {
    super()
  }

  getBaseUrl(): string {
    return this.env === 'demo'
      ? 'https://openapivts.koreainvestment.com:29443'
      : 'https://openapi.koreainvestment.com:9443'
  }

  getWsUrl(): string {
    return 'wss://ops.koreainvestment.com:21443'
  }

  async connect(): Promise<void> {
    this.approvalKey = await this.getApprovalKey()
    this.connected = true
    this.reconnectAttempts = 0
    this.emit('connected')
  }

  private async getApprovalKey(): Promise<string> {
    const url = `${this.getBaseUrl()}/oauth2/Approval`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: this.appKey,
        secretkey: this.appSecret,
      }),
    })
    const data = (await response.json()) as { approval_key: string }
    return data.approval_key
  }

  subscribe(symbol: string): void {
    this.subscribedSymbols.add(symbol)
    this.emit('subscribed', symbol)
  }

  unsubscribe(symbol: string): void {
    this.subscribedSymbols.delete(symbol)
    this.emit('unsubscribed', symbol)
  }

  parseMessage(raw: string): MarketTick | null {
    try {
      const parts = raw.split('|')
      if (parts.length < 4) return null
      const trId = parts[1]
      if (trId !== 'H0STCNT0') return null
      const payload = parts[3]
      const fields = payload.split('^')
      if (fields.length < 12) return null
      return {
        symbol: fields[0],
        price: Number(fields[2]),
        volume: Number(fields[7]),
        timestamp: new Date(),
        side: Number(fields[5]) > 0 ? 'buy' : 'sell',
      }
    } catch {
      return null
    }
  }

  handleMessage(raw: string): void {
    const tick = this.parseMessage(raw)
    if (tick) {
      this.emit('tick', tick)
    }
  }

  async reconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('error', new Error('Max reconnect attempts exceeded'))
      return
    }
    const delay = Math.pow(2, this.reconnectAttempts) * 1000
    this.reconnectAttempts++
    await new Promise((resolve) => setTimeout(resolve, delay))
    try {
      await this.connect()
    } catch {
      await this.reconnect()
    }
  }

  disconnect(): void {
    this.connected = false
    this.subscribedSymbols.clear()
    this.emit('disconnected')
  }

  isConnected(): boolean {
    return this.connected
  }

  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols)
  }
}
