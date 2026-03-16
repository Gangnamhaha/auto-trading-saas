import { EventEmitter } from 'events'
import { ContentGenerator } from './content-generator'

export interface ScheduledTask {
  id: string
  type: 'blog' | 'sns' | 'newsletter' | 'report'
  schedule: string // cron-like: 'weekly:mon:09:00' | 'daily:18:00'
  status: 'pending' | 'running' | 'completed' | 'failed'
  lastRunAt: Date | null
  nextRunAt: Date
  config: Record<string, unknown>
}

/**
 * 마케팅 스케줄러
 *
 * 자동화 작업:
 * - 매주 월요일 09:00: 주간 시장 리뷰 블로그 발행
 * - 매일 18:00: SNS 포스트 예약
 * - 매주 금요일 17:00: 뉴스레터 발송
 * - 매일 09:30: 일일 성과 리포트 생성
 */
export class MarketingScheduler extends EventEmitter {
  private tasks: Map<string, ScheduledTask> = new Map()
  private intervals: Map<string, ReturnType<typeof setInterval>> = new Map()
  private generator: ContentGenerator
  private running = false

  constructor(
    aiProvider: 'openai' | 'anthropic' = 'openai',
    apiKey: string = ''
  ) {
    super()
    this.generator = new ContentGenerator(aiProvider, apiKey)
    this.initDefaultTasks()
  }

  private initDefaultTasks(): void {
    const now = new Date()

    this.tasks.set('weekly-blog', {
      id: 'weekly-blog',
      type: 'blog',
      schedule: 'weekly:mon:09:00',
      status: 'pending',
      lastRunAt: null,
      nextRunAt: this.getNextMonday(now),
      config: { topic: 'weekly-market-review' },
    })

    this.tasks.set('daily-sns', {
      id: 'daily-sns',
      type: 'sns',
      schedule: 'daily:18:00',
      status: 'pending',
      lastRunAt: null,
      nextRunAt: this.getNextTime(now, 18, 0),
      config: { platforms: ['twitter', 'instagram', 'threads'] },
    })

    this.tasks.set('weekly-newsletter', {
      id: 'weekly-newsletter',
      type: 'newsletter',
      schedule: 'weekly:fri:17:00',
      status: 'pending',
      lastRunAt: null,
      nextRunAt: this.getNextFriday(now),
      config: { recipients: 'all-subscribers' },
    })

    this.tasks.set('daily-report', {
      id: 'daily-report',
      type: 'report',
      schedule: 'daily:09:30',
      status: 'pending',
      lastRunAt: null,
      nextRunAt: this.getNextTime(now, 9, 30),
      config: { strategies: ['ma_crossover', 'rsi', 'macd'] },
    })
  }

  start(): void {
    if (this.running) return
    this.running = true

    // 1분마다 스케줄 체크
    const checkInterval = setInterval(() => {
      this.checkSchedule()
    }, 60000)
    this.intervals.set('scheduler', checkInterval)

    this.emit('started')
  }

  stop(): void {
    this.running = false
    for (const [key, interval] of this.intervals) {
      clearInterval(interval)
      this.intervals.delete(key)
    }
    this.emit('stopped')
  }

  private async checkSchedule(): Promise<void> {
    const now = new Date()

    for (const [id, task] of this.tasks) {
      if (task.status === 'running') continue
      if (now >= task.nextRunAt) {
        await this.executeTask(id, task)
      }
    }
  }

  private async executeTask(id: string, task: ScheduledTask): Promise<void> {
    task.status = 'running'
    this.emit('task_started', { id, type: task.type })

    try {
      let content = ''

      switch (task.type) {
        case 'blog':
          content = await this.generator.generateWeeklyReview({
            kospiChange: (Math.random() - 0.5) * 4,
            kosdaqChange: (Math.random() - 0.5) * 5,
            topGainers: [
              { name: '삼성전자', change: 2.5 },
              { name: 'SK하이닉스', change: 3.1 },
            ],
            strategyPerformance: [
              { name: 'MA 크로스오버', returnPct: 1.2 },
              { name: 'MACD', returnPct: 0.8 },
            ],
          })
          break

        case 'sns': {
          const posts =
            await this.generator.generateSNSPosts('이번 주 자동매매 전략 성과')
          content = JSON.stringify(posts, null, 2)
          break
        }

        case 'newsletter':
          content = await this.generator.generateNewsletter({
            weekNumber: Math.ceil(
              (Date.now() - new Date('2026-01-01').getTime()) /
                (7 * 24 * 60 * 60 * 1000)
            ),
            marketSummary:
              'KOSPI는 이번 주 소폭 상승하며 안정적인 흐름을 보였습니다.',
            featuredStrategy: 'MA 크로스오버',
            strategyReturn: 1.5,
          })
          break

        case 'report':
          content = await this.generator.generateBacktestReport({
            strategy: 'MA 크로스오버',
            symbol: '005930',
            period: '2026-03-10 ~ 2026-03-16',
            totalReturn: 1.2,
            maxDrawdown: -2.1,
            sharpeRatio: 1.3,
            winRate: 62.5,
            totalTrades: 8,
          })
          break
      }

      task.status = 'completed'
      task.lastRunAt = new Date()
      task.nextRunAt = this.getNextRunTime(task)

      this.emit('task_completed', { id, type: task.type, content })
    } catch (error) {
      task.status = 'failed'
      this.emit('task_failed', { id, type: task.type, error })
    }
  }

  async runNow(taskId: string): Promise<string> {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)
    await this.executeTask(taskId, task)
    return `Task ${taskId} executed`
  }

  getTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values())
  }

  getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id)
  }

  isRunning(): boolean {
    return this.running
  }

  private getNextRunTime(task: ScheduledTask): Date {
    const now = new Date()
    if (task.schedule.startsWith('daily')) return this.getNextTime(now, 18, 0)
    if (task.schedule.includes('mon')) return this.getNextMonday(now)
    if (task.schedule.includes('fri')) return this.getNextFriday(now)
    return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }

  private getNextMonday(from: Date): Date {
    const d = new Date(from)
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7))
    d.setHours(9, 0, 0, 0)
    return d
  }

  private getNextFriday(from: Date): Date {
    const d = new Date(from)
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7 || 7))
    d.setHours(17, 0, 0, 0)
    return d
  }

  private getNextTime(from: Date, hours: number, minutes: number): Date {
    const d = new Date(from)
    d.setHours(hours, minutes, 0, 0)
    if (d <= from) d.setDate(d.getDate() + 1)
    return d
  }
}
