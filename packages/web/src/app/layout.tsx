import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoTrade - 한국 주식 자동매매 플랫폼',
  description:
    '한국 주식 자동매매, 이제 쉽게. 노코드 전략 설정과 백테스팅을 한 곳에서.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  )
}
