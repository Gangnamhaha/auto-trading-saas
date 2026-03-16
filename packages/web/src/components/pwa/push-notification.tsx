'use client'

import { useState } from 'react'

export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setEnabled(true)
        // 테스트 알림
        new Notification('Alphix', {
          body: '푸시 알림이 활성화되었습니다! 매매 체결 시 알림을 받습니다.',
          icon: '/icons/icon-192.svg',
        })
      }
    } catch {
      // Permission request failed
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <p className="font-medium">🔔 푸시 알림</p>
        <p className="text-sm text-gray-500">
          매매 체결, 리스크 경고 등 실시간 알림
        </p>
      </div>
      <button
        onClick={requestPermission}
        disabled={enabled || loading}
        className={`rounded-lg px-4 py-2 text-sm font-medium ${
          enabled
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {loading ? '처리 중...' : enabled ? '✓ 활성화됨' : '활성화'}
      </button>
    </div>
  )
}
