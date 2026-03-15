'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const pnlData = [
  { date: '1월', value: 10000000 },
  { date: '2월', value: 10200000 },
  { date: '3월', value: 10150000 },
  { date: '4월', value: 10350000 },
  { date: '5월', value: 10500000 },
  { date: '6월', value: 10450000 },
]

const recentTrades = [
  {
    id: 1,
    date: '2024-01-15',
    symbol: '삼성전자',
    type: '매수',
    quantity: 10,
    price: 71500,
    pnl: null,
  },
  {
    id: 2,
    date: '2024-01-14',
    symbol: 'SK하이닉스',
    type: '매도',
    quantity: 5,
    price: 142000,
    pnl: '+12.5%',
  },
  {
    id: 3,
    date: '2024-01-13',
    symbol: 'NAVER',
    type: '매수',
    quantity: 2,
    price: 215000,
    pnl: null,
  },
  {
    id: 4,
    date: '2024-01-12',
    symbol: '카카오',
    type: '매도',
    quantity: 20,
    price: 58500,
    pnl: '-3.2%',
  },
]

const activeStrategies = [
  { id: 1, name: 'MA 크로스오버', status: 'active', return: '+5.2%' },
  { id: 2, name: 'RSI 과매수/과매도', status: 'paused', return: '+2.1%' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">포트폴리오 현황을 확인하세요</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 자산</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩10,450,000</div>
            <p className="text-xs text-gray-500">KIS 증권 연동</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">오늘 손익</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+₩125,000</div>
            <p className="text-xs text-green-600">+1.2%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수익률</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+4.5%</div>
            <p className="text-xs text-gray-500">지난 30일</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 전략</CardTitle>
            <TrendingDown className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-gray-500">1개 일시 중지</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L 차트</CardTitle>
            <CardDescription>지난 6개월 포트폴리오 가치 변화</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pnlData}>
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
            <CardTitle>활성 전략</CardTitle>
            <CardDescription>현재 실행 중인 전략</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeStrategies.map((strategy) => (
                <div
                  key={strategy.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">{strategy.name}</p>
                    <Badge
                      variant={
                        strategy.status === 'active' ? 'success' : 'secondary'
                      }
                    >
                      {strategy.status === 'active' ? '실행 중' : '일시 중지'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {strategy.return}
                    </p>
                    <p className="text-xs text-gray-500">누적 수익률</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 거래 내역</CardTitle>
          <CardDescription>지난 7일간 거래 기록</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-500">
                  <th className="pb-3">날짜</th>
                  <th className="pb-3">종목</th>
                  <th className="pb-3">유형</th>
                  <th className="pb-3 text-right">수량</th>
                  <th className="pb-3 text-right">가격</th>
                  <th className="pb-3 text-right">손익</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} className="border-b text-sm">
                    <td className="py-3">{trade.date}</td>
                    <td className="py-3 font-medium">{trade.symbol}</td>
                    <td className="py-3">
                      <Badge
                        variant={trade.type === '매수' ? 'default' : 'outline'}
                      >
                        {trade.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">{trade.quantity}주</td>
                    <td className="py-3 text-right">
                      ₩{trade.price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {trade.pnl ? (
                        <span
                          className={
                            trade.pnl.startsWith('+')
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {trade.pnl}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
