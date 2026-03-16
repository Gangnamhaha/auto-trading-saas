import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { PWARegister } from '@/components/pwa/pwa-register'
import { I18nProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Alphix — 한국 주식 자동매매 플랫폼',
  description:
    '코딩 없이 한국 주식(KOSPI/KOSDAQ) 자동매매. 백테스팅으로 전략 검증 후 실전 투자. 무료로 시작하세요.',
  keywords: [
    '주식 자동매매',
    '자동매매 프로그램',
    '퀀트 투자',
    '백테스팅',
    'KOSPI',
    'KOSDAQ',
    '한국 주식',
    '알고리즘 트레이딩',
  ],
  openGraph: {
    title: 'Alphix — 한국 주식 자동매매 플랫폼',
    description:
      '코딩 없이 한국 주식 자동매매. 백테스팅으로 전략 검증 후 실전 투자.',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Alphix',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alphix — 한국 주식 자동매매 플랫폼',
    description:
      '코딩 없이 한국 주식 자동매매. 백테스팅으로 전략 검증 후 실전 투자.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://autotrade.kr',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Alphix',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID

  return (
    <html lang="ko">
      {ga4Id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${ga4Id}');
            `}
          </Script>
        </>
      )}
      <body className="min-h-screen bg-white antialiased">
        <I18nProvider>{children}</I18nProvider>
        <PWARegister />
      </body>
    </html>
  )
}
