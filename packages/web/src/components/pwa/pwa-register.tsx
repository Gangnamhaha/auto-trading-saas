'use client'

import { useEffect, useState } from 'react'

export function PWARegister() {
  const [showInstall, setShowInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null)

  useEffect(() => {
    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed silently
      })
    }

    // 앱 설치 프롬프트 캡처
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).prompt()
    setShowInstall(false)
    setDeferredPrompt(null)
  }

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-xl bg-blue-600 p-4 text-white shadow-2xl md:left-auto md:right-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">📱 앱으로 설치하기</p>
          <p className="text-sm text-blue-100">
            홈 화면에 추가하여 더 빠르게 사용하세요
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowInstall(false)}
            className="rounded-lg px-3 py-1.5 text-sm text-blue-200 hover:text-white"
          >
            닫기
          </button>
          <button
            onClick={handleInstall}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            설치
          </button>
        </div>
      </div>
    </div>
  )
}
