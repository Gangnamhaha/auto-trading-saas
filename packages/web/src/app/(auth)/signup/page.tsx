'use client'

import * as React from 'react'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [agreeTerms, setAgreeTerms] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (!agreeTerms) {
      setError('이용약관에 동의해주세요.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(
          data.error === 'Email already exists'
            ? '이미 사용 중인 이메일입니다.'
            : (data.error ?? '회원가입에 실패했습니다.')
        )
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch {
      setError('서버 연결에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <span className="text-5xl">🎉</span>
          <h2 className="mt-4 text-2xl font-bold">회원가입 완료!</h2>
          <p className="mt-2 text-gray-500">로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Alphix
          </Link>
          <h1 className="mt-4 text-xl font-bold">회원가입</h1>
          <p className="mt-1 text-sm text-gray-500">
            새 계정을 만들어 자동매매를 시작하세요
          </p>
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
            <label className="text-sm font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="8자 이상"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="비밀번호 재입력"
              className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-600">
              <Link href="/terms" className="text-blue-600 underline">
                이용약관
              </Link>{' '}
              및{' '}
              <Link href="/privacy" className="text-blue-600 underline">
                개인정보처리방침
              </Link>
              에 동의합니다
            </span>
          </label>

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
            {loading ? '⏳ 처리 중...' : '회원가입'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-blue-600 font-medium">
            로그인
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          ⚠️ 투자 원금 손실이 발생할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
