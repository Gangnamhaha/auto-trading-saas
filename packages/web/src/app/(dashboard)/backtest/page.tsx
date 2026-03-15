'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const strategies = [
  { id: 1, name: 'MA 크로스오버' },
  { id: 2, name: 'RSI 과매수/과매도' },
]

const backtestResults = {
  totalReturn: '+15.2%',
  mdd: '-8.3%',
  sharpe: '1.42',
  winRate: '62.5%',
  trades: [
    {
      date: '2024-01-15',
      symbol: '삼성전자',
      type: '매수',
      price: 71500,
      quantity: 10,
    },
    {
      date: '2024-01-20',
      symbol: '삼성전자',
      type: '매도',
      price: 73500,
      quantity: 10,
    },
    {
      date: '2024-02-01',
      symbol: 'SK하이닉스',
      type: '매수',
      price: 140000,
      quantity: 5,
    },
    {
      date: '2024-02-10',
      symbol: 'SK하이닉스',
      type: '매도',
      price: 142000,
      quantity: 5,
    },
  ],
}

const equityCurve = [
  { date: '2024-01', value: 10000000 },
  { date: '2024-02', value: 10200000 },
  { date: '2024-03', value: 10100000 },
  { date: '2024-04', value: 10400000 },
  { date: '2024-05', value: 10600000 },
  { date: '2024-06', value: 10500000 },
  { date: '2024-07', value: 10800000 },
  { date: '2024-08', value: 11000000 },
  { date: '2024-09', value: 11200000 },
  { date: '2024-10', value: 11100000 },
  { date: '2024-11', value: 11300000 },
  { date: '2024-12', value: 11520000 },
]

export default function BacktestPage() {
  const [selectedStrategy, setSelectedStrategy] = React.useState(
    strategies[0].id
  )
  const [startDate, setStartDate] = React.useState('2024-01-01')
  const [endDate, setEndDate] = React.useState('2024-12-31')
  const [initialCapital, setInitialCapital] = React.useState('10000000')
  const [showResults, setShowResults] = React.useState(true)

  const runBacktest = () => {
    setShowResults(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">백테스팅</h1>
        <p className="text-gray-600">전략의 과거 성과를 검증하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>백테스트 설정</CardTitle>
          <CardDescription>
            전략과 기간을 선택하고 백테스트를 실행하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">전략 선택</label>
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(Number(e.target.value))}
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">초기 자본</label>
              <Input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={runBacktest}>
              <Play className="mr-2 h-4 w-4" />
              백테스트 실행
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 수익률</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {backtestResults.totalReturn}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MDD</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {backtestResults.mdd}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">샤프 비율</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtestResults.sharpe}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">승률</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {backtestResults.winRate}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>자산 곡선</CardTitle>
              <CardDescription>
                백테스트 기간 중 포트폴리오 가치 변화
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) =>
                        `₩${(value / 1000000).toFixed(1)}M`
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        `₩${Number(value).toLocaleString()}`,
                        '자산',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>거래 내역</CardTitle>
              <CardDescription>
                백테스트 기간 중 발생한 모든 거래
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-gray-500">
                      <th className="pb-3">날짜</th>
                      <th className="pb-3">종목</th>
                      <th className="pb-3">유형</th>
                      <th className="pb-3 text-right">가격</th>
                      <th className="pb-3 text-right">수량</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backtestResults.trades.map((trade, index) => (
                      <tr key={index} className="border-b text-sm">
                        <td className="py-3">{trade.date}</td>
                        <td className="py-3 font-medium">{trade.symbol}</td>
                        <td className="py-3">
                          <Badge
                            variant={
                              trade.type === '매수' ? 'default' : 'outline'
                            }
                          >
                            {trade.type}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          ₩{trade.price.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">{trade.quantity}주</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
