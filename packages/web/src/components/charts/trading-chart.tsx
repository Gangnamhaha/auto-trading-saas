/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useRef, useState } from 'react'

interface CandleData {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface MarkerData {
  time: string
  position: 'aboveBar' | 'belowBar'
  color: string
  shape: 'arrowUp' | 'arrowDown' | 'circle'
  text: string
}

interface TradingChartProps {
  symbol?: string
  data?: CandleData[]
  markers?: MarkerData[]
  height?: number
  showVolume?: boolean
  showMA?: boolean
  showBollinger?: boolean
}

export function TradingChart({
  symbol = '005930',
  data: initialData,
  markers = [],
  height = 500,
  showVolume = true,
  showMA = true,
  showBollinger = false,
}: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [priceChange, setPriceChange] = useState<number>(0)

  useEffect(() => {
    if (!chartContainerRef.current) return

    let chart: ReturnType<
      typeof import('lightweight-charts').createChart
    > | null = null
    let isMounted = true

    const initChart = async () => {
      const lc = await import('lightweight-charts')

      if (!isMounted || !chartContainerRef.current) return

      chart = lc.createChart(chartContainerRef.current, {
        layout: {
          background: { type: lc.ColorType.Solid, color: '#ffffff' },
          textColor: '#374151',
        },
        grid: {
          vertLines: { color: '#f0f0f0' },
          horzLines: { color: '#f0f0f0' },
        },
        crosshair: { mode: lc.CrosshairMode.Normal },
        rightPriceScale: { borderColor: '#e5e7eb' },
        timeScale: { borderColor: '#e5e7eb', timeVisible: true },
        width: chartContainerRef.current.clientWidth,
        height,
      })

      const chartData = initialData ?? generateDummyData(symbol)

      // 캔들스틱
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const candleSeries = chart.addSeries(lc.CandlestickSeries as any, {
        upColor: '#ef4444',
        downColor: '#3b82f6',
        borderUpColor: '#ef4444',
        borderDownColor: '#3b82f6',
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      candleSeries.setData(chartData as any)

      if (chartData.length > 0) {
        const latest = chartData[chartData.length - 1]
        const prev =
          chartData.length > 1 ? chartData[chartData.length - 2] : latest
        setCurrentPrice(latest.close)
        setPriceChange(((latest.close - prev.close) / prev.close) * 100)
      }

      // 거래량
      if (showVolume) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const volSeries = chart.addSeries(lc.HistogramSeries as any, {
          priceFormat: { type: 'volume' },
          priceScaleId: 'vol',
        })
        volSeries
          .priceScale()
          .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
        volSeries.setData(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          chartData.map((d) => ({
            time: d.time,
            value: d.volume ?? Math.random() * 1000000,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            color:
              d.close >= d.open
                ? 'rgba(239,68,68,0.3)'
                : 'rgba(59,130,246,0.3)',
          })) as any
        )
      }

      // 이동평균
      if (showMA) {
        const closes = chartData.map((d) => d.close)
        const addMA = (values: (number | null)[], color: string) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = chart!.addSeries(lc.LineSeries as any, {
            color,
            lineWidth: 1,
          })
          s.setData(
            values
              .map((v, i) =>
                v !== null ? { time: chartData[i].time, value: v } : null
              )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter(Boolean) as any
          )
        }
        addMA(calculateMA(closes, 5), '#f59e0b')
        addMA(calculateMA(closes, 20), '#8b5cf6')
      }

      // 볼린저밴드
      if (showBollinger) {
        const closes = chartData.map((d) => d.close)
        const bb = calculateBollinger(closes, 20, 2)
        const addBB = (values: (number | null)[]) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const s = chart!.addSeries(lc.LineSeries as any, {
            color: 'rgba(59,130,246,0.4)',
            lineWidth: 1,
          })
          s.setData(
            values
              .map((v, i) =>
                v !== null ? { time: chartData[i].time, value: v } : null
              )
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter(Boolean) as any
          )
        }
        addBB(bb.upper)
        addBB(bb.lower)
      }

      // 매매 시그널 마커
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Markers: v5 uses chart.addSeries markers differently
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (markers.length > 0 && (candleSeries as any).setMarkers)
        (candleSeries as any).setMarkers(markers)

      chart.timeScale().fitContent()

      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    const cleanup = initChart()
    return () => {
      isMounted = false
      cleanup?.then((fn) => fn?.())
      chart?.remove()
    }
  }, [symbol, initialData, markers, height, showVolume, showMA, showBollinger])

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold">{symbol}</h3>
          <span className="text-2xl font-bold">
            {currentPrice > 0 ? currentPrice.toLocaleString() : '—'}
          </span>
          <span
            className={`text-sm font-medium ${priceChange >= 0 ? 'text-red-500' : 'text-blue-500'}`}
          >
            {priceChange >= 0 ? '+' : ''}
            {priceChange.toFixed(2)}%
          </span>
        </div>
        <div className="flex gap-2 text-xs text-gray-500">
          {showMA && (
            <>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                MA5
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                MA20
              </span>
            </>
          )}
          {showBollinger && (
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
              BB
            </span>
          )}
        </div>
      </div>
      <div ref={chartContainerRef} />
      <div className="border-t px-4 py-2 text-xs text-gray-400">
        ⚠️ 차트는 참고용이며 투자 결정의 책임은 이용자에게 있습니다.
      </div>
    </div>
  )
}

function generateDummyData(symbol: string): CandleData[] {
  const data: CandleData[] = []
  let price =
    symbol === 'AAPL'
      ? 195
      : symbol === 'TSLA'
        ? 250
        : symbol === 'MSFT'
          ? 420
          : 72000
  const now = new Date()
  for (let i = 90; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue
    const change = (Math.random() - 0.48) * price * 0.03
    const open = price
    const close = price + change
    const high = Math.max(open, close) + Math.random() * price * 0.01
    const low = Math.min(open, close) - Math.random() * price * 0.01
    price = close
    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume: Math.round(Math.random() * 1000000 + 500000),
    })
  }
  return data
}

function calculateMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) =>
    i < period - 1
      ? null
      : Math.round(
          prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) /
            period
        )
  )
}

function calculateBollinger(
  prices: number[],
  period: number,
  stdDev: number
): { upper: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(null)
      lower.push(null)
      continue
    }
    const slice = prices.slice(i - period + 1, i + 1)
    const sma = slice.reduce((a, b) => a + b, 0) / period
    const sd = Math.sqrt(
      slice.reduce((s, v) => s + Math.pow(v - sma, 2), 0) / period
    )
    upper.push(Math.round(sma + stdDev * sd))
    lower.push(Math.round(sma - stdDev * sd))
  }
  return { upper, lower }
}
