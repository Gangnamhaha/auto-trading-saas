'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Play, Pause, AlertCircle } from 'lucide-react'

const strategies = [
  {
    id: 1,
    name: 'MA 크로스오버',
    description:
      '단기 이동평균선이 장기 이동평균선을 상향 돌파할 때 매수, 하향 돌파할 때 매도',
    parameters: [
      { name: '단기 MA', value: '5일' },
      { name: '장기 MA', value: '20일' },
    ],
    status: 'active',
    return: '+5.2%',
  },
  {
    id: 2,
    name: 'RSI 과매수/과매도',
    description: 'RSI가 30 이하일 때 매수, 70 이상일 때 매도',
    parameters: [
      { name: 'RSI 기간', value: '14일' },
      { name: '과매수 기준', value: '70' },
      { name: '과매도 기준', value: '30' },
    ],
    status: 'paused',
    return: '+2.1%',
  },
]

export default function StrategiesPage() {
  const [strategyStates, setStrategyStates] = React.useState<
    Record<number, boolean>
  >(
    strategies.reduce(
      (acc, s) => ({ ...acc, [s.id]: s.status === 'active' }),
      {}
    )
  )

  const toggleStrategy = (id: number) => {
    setStrategyStates((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">전략 설정</h1>
          <p className="text-gray-600">자동매매 전략을 관리하세요</p>
        </div>
        <Link href="/strategies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            전략 추가
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Free 플랜 제한 안내
            </p>
            <p className="text-xs text-yellow-700">
              현재 Free 플랜을 이용 중입니다. 최대 1개의 전략만 활성화할 수
              있습니다. 더 많은 전략을 사용하려면{' '}
              <Link href="/pricing" className="underline">
                플랜을 업그레이드
              </Link>
              하세요.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {strategies.map((strategy) => (
          <Card key={strategy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <Badge
                  variant={
                    strategyStates[strategy.id] ? 'success' : 'secondary'
                  }
                >
                  {strategyStates[strategy.id] ? '실행 중' : '일시 중지'}
                </Badge>
              </div>
              <CardDescription>{strategy.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">파라미터</p>
                <div className="grid gap-2">
                  {strategy.parameters.map((param) => (
                    <div
                      key={param.name}
                      className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                    >
                      <span className="text-sm text-gray-600">
                        {param.name}
                      </span>
                      <Input
                        className="w-24"
                        value={param.value}
                        onChange={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">누적 수익률</p>
                <p className="text-lg font-bold text-green-600">
                  {strategy.return}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Button>
                <Button
                  variant={
                    strategyStates[strategy.id] ? 'destructive' : 'default'
                  }
                  size="sm"
                  onClick={() => toggleStrategy(strategy.id)}
                >
                  {strategyStates[strategy.id] ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      중지
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      실행
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
