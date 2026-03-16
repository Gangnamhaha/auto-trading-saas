import { EventEmitter } from 'events'

/**
 * Alphix 텔레그램 봇
 *
 * 기능:
 * - 매매 체결 알림 (BUY/SELL + 종목 + 가격)
 * - 리스크 경고 (회로차단기 발동)
 * - 원격 제어 (/start, /stop, /status, /balance, /strategies)
 * - 일일 수익 리포트
 *
 * 사용법:
 * 1. @BotFather에서 봇 생성 → 토큰 발급
 * 2. TELEGRAM_BOT_TOKEN 환경변수 설정
 * 3. TELEGRAM_CHAT_ID 환경변수 설정 (봇에게 메시지 보낸 후 getUpdates로 확인)
 */
export class TelegramBot extends EventEmitter {
  private baseUrl: string
  private polling = false
  private pollOffset = 0
  private commands: Map<
    string,
    (chatId: number, args: string) => Promise<string>
  > = new Map()

  constructor(
    private token: string,
    private chatId: string
  ) {
    super()
    this.baseUrl = `https://api.telegram.org/bot${token}`
    this.registerDefaultCommands()
  }

  private registerDefaultCommands(): void {
    this.commands.set(
      '/start',
      async () =>
        '🤖 Alphix 봇이 활성화되었습니다!\n\n' +
        '📋 명령어 목록:\n' +
        '/status — 데몬 상태 확인\n' +
        '/balance — 잔고 조회\n' +
        '/strategies — 전략 목록\n' +
        '/pnl — 오늘 수익 확인\n' +
        '/pause — 자동매매 일시 중지\n' +
        '/resume — 자동매매 재개\n' +
        '/help — 도움말\n\n' +
        '⚠️ 투자 원금 손실이 발생할 수 있습니다.'
    )

    this.commands.set(
      '/help',
      async () =>
        '📋 Alphix 봇 명령어\n\n' +
        '/status — 데몬 상태 (실행중/중지/시장 상태)\n' +
        '/balance — 현재 잔고 및 포지션\n' +
        '/strategies — 활성 전략 목록\n' +
        '/pnl — 오늘 손익 현황\n' +
        '/pause — 자동매매 일시 중지\n' +
        '/resume — 자동매매 재개\n' +
        '/market — 시장 개장 상태'
    )

    this.commands.set('/market', async () => {
      const now = new Date()
      const kst = new Date(
        now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      )
      const est = new Date(
        now.toLocaleString('en-US', { timeZone: 'America/New_York' })
      )
      const kstH = kst.getHours()
      const estH = est.getHours()

      return (
        '🕐 시장 현황\n\n' +
        `🇰🇷 한국: ${kstH >= 9 && kstH < 16 ? '🟢 개장' : '🔴 폐장'} (KST ${kst.toLocaleTimeString('ko-KR')})\n` +
        `🇺🇸 미국: ${estH >= 9 && estH < 16 ? '🟢 개장' : '🔴 폐장'} (EST ${est.toLocaleTimeString('en-US')})\n` +
        `🌐 암호화폐: 🟢 24/7`
      )
    })
  }

  registerCommand(
    command: string,
    handler: (chatId: number, args: string) => Promise<string>
  ): void {
    this.commands.set(command, handler)
  }

  async sendMessage(text: string, chatId?: string): Promise<void> {
    const target = chatId ?? this.chatId
    await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: target,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    })
  }

  async sendTradeAlert(data: {
    signal: 'BUY' | 'SELL'
    symbol: string
    price: number
    quantity: number
    strategy: string
  }): Promise<void> {
    const emoji = data.signal === 'BUY' ? '🟢' : '🔴'
    const text =
      `${emoji} *${data.signal}* — ${data.symbol}\n\n` +
      `💰 가격: ${data.price.toLocaleString()}원\n` +
      `📦 수량: ${data.quantity}주\n` +
      `📊 전략: ${data.strategy}\n` +
      `🕐 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n\n` +
      `⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다.`
    await this.sendMessage(text)
  }

  async sendRiskAlert(type: string, message: string): Promise<void> {
    const text =
      `🚨 *리스크 경고*\n\n` +
      `유형: ${type}\n` +
      `내용: ${message}\n` +
      `시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
    await this.sendMessage(text)
  }

  async sendDailyReport(data: {
    totalPnl: number
    totalTrades: number
    winRate: number
    topStrategy: string
  }): Promise<void> {
    const pnlEmoji = data.totalPnl >= 0 ? '📈' : '📉'
    const text =
      `${pnlEmoji} *일일 리포트*\n\n` +
      `💰 총 손익: ${data.totalPnl >= 0 ? '+' : ''}${data.totalPnl.toLocaleString()}원\n` +
      `📊 총 거래: ${data.totalTrades}건\n` +
      `🎯 승률: ${data.winRate.toFixed(1)}%\n` +
      `⭐ 최고 전략: ${data.topStrategy}\n\n` +
      `⚠️ 과거 수익률이 미래 수익을 보장하지 않습니다.`
    await this.sendMessage(text)
  }

  async startPolling(): Promise<void> {
    this.polling = true
    this.emit('polling_started')

    while (this.polling) {
      try {
        const response = await fetch(
          `${this.baseUrl}/getUpdates?offset=${this.pollOffset}&timeout=30`
        )
        const data = (await response.json()) as {
          ok: boolean
          result: Array<{
            update_id: number
            message?: { chat: { id: number }; text?: string }
          }>
        }

        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            this.pollOffset = update.update_id + 1
            if (update.message?.text) {
              await this.handleCommand(
                update.message.chat.id,
                update.message.text
              )
            }
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 5000))
      }
    }
  }

  stopPolling(): void {
    this.polling = false
    this.emit('polling_stopped')
  }

  private async handleCommand(chatId: number, text: string): Promise<void> {
    const [command, ...argParts] = text.split(' ')
    const args = argParts.join(' ')
    const cmd = command.toLowerCase()

    const handler = this.commands.get(cmd)
    if (handler) {
      const response = await handler(chatId, args)
      await this.sendMessage(response, String(chatId))
    } else {
      await this.sendMessage(
        '❓ 알 수 없는 명령어입니다. /help 를 입력해주세요.',
        String(chatId)
      )
    }

    this.emit('command', { chatId, command: cmd, args })
  }

  isPolling(): boolean {
    return this.polling
  }
}
