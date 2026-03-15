'use client'

import * as React from 'react'
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
    href: '/settings/broker',
    label: '브로커 연결',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/" className="text-xl font-bold text-primary-600">
          AutoTrade
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
            업그레이드하여 더 많은 기능을 사용하세요
          </p>
        </div>
      </div>
    </aside>
  )
}
