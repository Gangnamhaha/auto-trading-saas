'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  LineChart,
  Settings,
  TestTube,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const sidebarLinks = [
  {
    href: '/dashboard',
    label: '대시보드',
    icon: LayoutDashboard,
  },
  {
    href: '/strategies',
    label: '전략 설정',
    icon: TrendingUp,
  },
  {
    href: '/backtest',
    label: '백테스팅',
    icon: TestTube,
  },
  {
    href: '/chart',
    label: '실시간 차트',
    icon: LineChart,
  },
  {
    href: '/screener',
    label: '종목 추천',
    icon: TrendingUp,
  },
  {
    href: '/autopilot',
    label: '오토파일럿',
    icon: TrendingUp,
  },
  {
    href: '/strategy-builder',
    label: '전략 빌더',
    icon: Settings,
  },
  {
    href: '/settings/broker',
    label: '브로커 연결',
    icon: Settings,
  },
  {
    href: '/social',
    label: '소셜 트레이딩',
    icon: TrendingUp,
  },
  {
    href: '/marketing',
    label: '마케팅 자동화',
    icon: LineChart,
  },
  {
    href: '/analytics',
    label: '수익 분석',
    icon: LineChart,
  },
  {
    href: '/notifications',
    label: '알림 센터',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const decoded = JSON.parse(atob(token))
        setUserEmail(decoded.email || 'User')
      }
    } catch {
      /* ignore */
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="text-xl font-bold text-primary-600">
          Alphix
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <link.icon className="mr-3 h-5 w-5" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-200 p-4">
        <div className="rounded-md bg-gray-50 p-4">
          <div className="flex items-center space-x-2">
            <LineChart className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium">Free 플랜</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {userEmail || '업그레이드하여 더 많은 기능을 사용하세요'}
          </p>
        </div>
      </div>
      {userEmail && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200"
          >
            로그아웃
          </button>
        </div>
      )}
    </aside>
  )
}
