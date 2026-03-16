'use client'

import * as React from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(
          data.error === 'Invalid credentials'
            ? '이메일 또는 비밀번호가 잘못되었습니다.'
            : (data.error ?? '로그인에 실패했습니다.')
        )
        return
      }

      // 토큰 저장
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
      }
      window.location.href = '/dashboard'
    } catch {
      setError('서버 연결에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Alphix
          </Link>
          <h1 className="mt-4 text-xl font-bold">로그인</h1>
          <p className="mt-1 text-sm text-gray-500">계정에 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">비밀번호</label>
              <Link href="/forgot-password" className="text-xs text-blue-600">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳ 로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-blue-600 font-medium">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
