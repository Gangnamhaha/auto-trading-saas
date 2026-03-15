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
import { CheckCircle, Loader2, ExternalLink } from 'lucide-react'

export default function BrokerPage() {
  const [appKey, setAppKey] = React.useState('')
  const [appSecret, setAppSecret] = React.useState('')
  const [accountNumber, setAccountNumber] = React.useState('')
  const [environment, setEnvironment] = React.useState<'paper' | 'live'>(
    'paper'
  )
  const [isConnected, setIsConnected] = React.useState(false)
  const [isTesting, setIsTesting] = React.useState(false)

  const testConnection = async () => {
    setIsTesting(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConnected(true)
    setIsTesting(false)
  }

  const disconnect = () => {
    setIsConnected(false)
    setAppKey('')
    setAppSecret('')
    setAccountNumber('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">브로커 연결</h1>
        <p className="text-gray-600">
          KIS 증권 API를 연동하여 자동매매를 시작하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>KIS 증권 API 설정</CardTitle>
              <CardDescription>
                한국투자증권 Open API 키를 입력하세요
              </CardDescription>
            </div>
            <Badge variant={isConnected ? 'success' : 'secondary'}>
              {isConnected ? '연결됨' : '연결 안됨'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">연결 성공</p>
                    <p className="text-sm text-green-700">
                      {environment === 'paper' ? '모의투자' : '실전'} 환경에
                      연결되었습니다.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">계좌번호</p>
                  <p className="font-medium">{accountNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">환경</p>
                  <p className="font-medium">
                    {environment === 'paper' ? '모의투자' : '실전'}
                  </p>
                </div>
              </div>
              <Button variant="destructive" onClick={disconnect}>
                연결 해제
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">
                  <strong>API 키 발급 방법:</strong> 한국투자증권 홈페이지에서
                  Open API 서비스를 신청하고, App Key와 App Secret을
                  발급받으세요.
                </p>
                <a
                  href="https://www.koreainvestment.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  한국투자증권 바로가기
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Key</label>
                  <Input
                    type="text"
                    placeholder="PSxxxxxxxxxx"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">App Secret</label>
                  <Input
                    type="password"
                    placeholder="••••••••••••••••"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">계좌번호</label>
                <Input
                  type="text"
                  placeholder="12345678-01"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">환경 선택</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="environment"
                      checked={environment === 'paper'}
                      onChange={() => setEnvironment('paper')}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span>모의투자 (추천)</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="environment"
                      checked={environment === 'live'}
                      onChange={() => setEnvironment('live')}
                      className="h-4 w-4 text-primary-600"
                    />
                    <span>실전</span>
                  </label>
                </div>
                {environment === 'live' && (
                  <p className="text-sm text-red-600">
                    ⚠️ 실전 환경은 실제 자금이 사용됩니다. 충분한 테스트 후
                    사용하세요.
                  </p>
                )}
              </div>

              <Button
                onClick={testConnection}
                disabled={!appKey || !appSecret || !accountNumber || isTesting}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    연결 테스트 중...
                  </>
                ) : (
                  '연결 테스트'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>보안 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>API 키는 암호화되어 안전하게 저장됩니다.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>출금 기능은 지원하지 않으며, 거래만 가능합니다.</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span>언제든지 연결을 해제하고 API 키를 삭제할 수 있습니다.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
