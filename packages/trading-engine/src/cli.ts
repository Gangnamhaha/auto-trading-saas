import { TradingDaemon } from './daemon/trading-daemon'
import { KISAdapter } from './broker/kis-adapter'
import { PaperBroker } from './paper/paper-broker'
import { KISWebSocket } from './data/kis-websocket'
import { NotificationManager } from './notifications/notification-manager'
import { ConsoleChannel } from './notifications/console-channel'
import { WebhookChannel } from './notifications/webhook-channel'
import type { DaemonConfig } from './daemon/types'

const ENV = {
  KIS_APP_KEY: process.env.KIS_APP_KEY ?? '',
  KIS_APP_SECRET: process.env.KIS_APP_SECRET ?? '',
  KIS_ACCOUNT_NO: process.env.KIS_ACCOUNT_NO ?? '',
  KIS_ENV: (process.env.KIS_ENV ?? 'demo') as 'demo' | 'real',
  MODE: (process.env.TRADING_MODE ?? 'paper') as 'paper' | 'live',
  SYMBOLS: (process.env.TRADING_SYMBOLS ?? '005930').split(','),
  STRATEGY: process.env.TRADING_STRATEGY ?? 'ma_crossover',
  POLL_INTERVAL: Number(process.env.POLL_INTERVAL ?? '60000'),
  WEBHOOK_URL: process.env.WEBHOOK_URL ?? '',
}

function printBanner(): void {
  // eslint-disable-next-line no-console
  console.log(`
╔══════════════════════════════════════════╗
║     Alphix - Trading Daemon        ║
║     한국 주식 자동매매 엔진              ║
╚══════════════════════════════════════════╝

Mode:      ${ENV.MODE}
Strategy:  ${ENV.STRATEGY}
Symbols:   ${ENV.SYMBOLS.join(', ')}
Interval:  ${ENV.POLL_INTERVAL}ms
KIS Env:   ${ENV.KIS_ENV}

⚠️  투자 원금 손실이 발생할 수 있습니다.
⚠️  과거 수익률이 미래 수익률을 보장하지 않습니다.
`)
}

async function main(): Promise<void> {
  printBanner()

  // Setup notifications
  const notifications = new NotificationManager()
  notifications.addChannel(new ConsoleChannel())
  if (ENV.WEBHOOK_URL) {
    notifications.addChannel(new WebhookChannel(ENV.WEBHOOK_URL))
  }

  // Setup broker
  const broker =
    ENV.MODE === 'live' ? new KISAdapter() : new PaperBroker(10_000_000)

  if (ENV.MODE === 'live') {
    await broker.connect({
      appKey: ENV.KIS_APP_KEY,
      appSecret: ENV.KIS_APP_SECRET,
      accountNo: ENV.KIS_ACCOUNT_NO,
      env: ENV.KIS_ENV,
    })
  }

  // Daemon config
  const config: DaemonConfig = {
    pollingIntervalMs: ENV.POLL_INTERVAL,
    symbols: ENV.SYMBOLS,
    strategies: ENV.SYMBOLS.map((symbol, i) => ({
      id: `strat-${i}`,
      strategyName: ENV.STRATEGY,
      symbol,
      params: getDefaultParams(ENV.STRATEGY),
      mode: ENV.MODE,
      isActive: true,
    })),
    riskConfig: {
      maxPositionSizePercent: 10,
      maxDailyLossPercent: 5,
      maxDailyTrades: 50,
    },
  }

  const daemon = new TradingDaemon(config, broker)

  // Event handlers
  daemon.on('started', () => {
    notifications.notify(
      'trade_executed',
      'Daemon Started',
      `Alphix 데몬이 시작되었습니다. 전략: ${ENV.STRATEGY}`
    )
  })

  daemon.on('trade_executed', (data) => {
    notifications.notify(
      'trade_executed',
      `${data.signal} ${data.order.symbol}`,
      `${data.order.side} ${data.order.quantity}주 @ ${data.order.price}원`
    )
  })

  daemon.on('risk_violation', (data) => {
    notifications.notify(
      'risk_violation',
      'Risk Violation',
      `전략 ${data.strategyId}: ${data.error}`
    )
  })

  daemon.on('market_closed', () => {
    // Silent — don't spam notifications
  })

  daemon.on('strategy_error', (data) => {
    notifications.notify(
      'error',
      'Strategy Error',
      `전략 ${data.strategyId}: ${data.error}`
    )
  })

  // Setup WebSocket for real-time data
  if (ENV.KIS_APP_KEY) {
    const ws = new KISWebSocket(
      ENV.KIS_APP_KEY,
      ENV.KIS_APP_SECRET,
      ENV.KIS_ENV
    )

    ws.on('tick', (tick) => {
      daemon.processTick(tick)
    })

    ws.on('error', (err) => {
      notifications.notify('error', 'WebSocket Error', String(err))
    })

    try {
      await ws.connect()
      for (const symbol of ENV.SYMBOLS) {
        ws.subscribe(symbol)
      }
      // eslint-disable-next-line no-console
      console.log(`WebSocket connected. Subscribed: ${ENV.SYMBOLS.join(', ')}`)
    } catch {
      // eslint-disable-next-line no-console
      console.log(
        'WebSocket connection failed. Running without real-time data.'
      )
    }
  }

  // Start daemon
  await daemon.start()

  // eslint-disable-next-line no-console
  console.log('Daemon running. Press Ctrl+C to stop.')

  // Graceful shutdown
  const shutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('\nShutting down...')
    await daemon.stop()
    await notifications.notify(
      'trade_executed',
      'Daemon Stopped',
      'Alphix 데몬이 종료되었습니다.'
    )
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

function getDefaultParams(strategy: string): Record<string, number> {
  switch (strategy) {
    case 'ma_crossover':
      return { shortPeriod: 5, longPeriod: 20 }
    case 'rsi':
      return { period: 14, oversold: 30, overbought: 70 }
    case 'bollinger_bands':
      return { period: 20, stdDev: 2 }
    case 'macd':
      return { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }
    case 'grid_trading':
      return { upperPrice: 80000, lowerPrice: 60000, gridCount: 10 }
    default:
      return { shortPeriod: 5, longPeriod: 20 }
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal error:', err)
  process.exit(1)
})
