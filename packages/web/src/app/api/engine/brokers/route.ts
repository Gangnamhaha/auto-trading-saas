import { NextResponse } from 'next/server'

export async function GET() {
  const brokers = [
    {
      id: 'kis',
      name: '한국투자증권 (KIS)',
      market: 'KR',
      description: 'KOSPI/KOSDAQ 국내주식 자동매매',
      status: 'available',
      requiredFields: ['appKey', 'appSecret', 'accountNo'],
    },
    {
      id: 'kis-us',
      name: '한국투자증권 해외주식',
      market: 'US',
      description: 'NYSE/NASDAQ 미국주식 (KIS 계좌로 거래)',
      status: 'available',
      requiredFields: ['appKey', 'appSecret', 'accountNo'],
    },
    {
      id: 'alpaca',
      name: 'Alpaca Markets',
      market: 'US',
      description: 'NYSE/NASDAQ 미국주식 전용 (무료 계정 가능)',
      status: 'available',
      requiredFields: ['apiKey', 'apiSecret'],
    },
    {
      id: 'kiwoom',
      name: '키움증권 (영웅문)',
      market: 'KR',
      description: 'KOSPI/KOSDAQ 국내주식 (Windows 프록시 필요)',
      status: 'available',
      requiredFields: ['proxyUrl'],
      note: 'Windows PC에서 키움 프록시 서버 실행 필요',
    },
    {
      id: 'binance',
      name: 'Binance',
      market: 'CRYPTO',
      description: '글로벌 암호화폐 거래소',
      status: 'available',
      requiredFields: ['apiKey', 'apiSecret'],
    },
    {
      id: 'upbit',
      name: 'Upbit (업비트)',
      market: 'CRYPTO',
      description: '한국 암호화폐 거래소',
      status: 'available',
      requiredFields: ['accessKey', 'secretKey'],
    },
  ]
  return NextResponse.json(brokers)
}
