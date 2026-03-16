'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'credentials' | 'otp' | 'success'>(
    'credentials'
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // MVP: 하드코딩 관리자 (프로덕션에서는 DB 검증)
    if (email === 'admin@alphix.kr' && password === 'AlphixAdmin2026!') {
      setStep('otp')
    } else {
      setError('관리자 계정 정보가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // MVP: 고정 OTP (프로덕션에서는 TOTP 검증)
    if (otp === '000000' || otp.length === 6) {
      setStep('success')
      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 1500)
    } else {
      setError('인증 코드가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 text-2xl font-black text-white shadow-2xl">
            A
          </div>
          <h1 className="mt-4 text-2xl font-black text-white">Alphix 관리자</h1>
          <p className="mt-1 text-gray-400">관리자 전용 로그인</p>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-800/50 p-6 shadow-2xl backdrop-blur">
          {/* Step 1: 이메일/비밀번호 */}
          {step === 'credentials' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  관리자 이메일
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    🔒
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@alphix.kr"
                    required
                    className="w-full rounded-xl border border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">
                  비밀번호
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    🔑
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    className="w-full rounded-xl border border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-600 py-3 font-bold text-white shadow-lg transition-all hover:from-red-700 hover:to-orange-700 disabled:opacity-50"
              >
                {loading ? '⏳ 확인 중...' : '🔐 관리자 로그인'}
              </button>
            </form>
          )}

          {/* Step 2: OTP 인증 */}
          {step === 'otp' && (
            <form onSubmit={handleOTP} className="space-y-4">
              <div className="text-center">
                <span className="text-4xl">🛡️</span>
                <p className="mt-2 font-bold text-white">2단계 인증</p>
                <p className="mt-1 text-sm text-gray-400">
                  관리자 이메일로 발송된 6자리 인증 코드를 입력하세요
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  required
                  className="w-full rounded-xl border border-gray-600 bg-gray-700 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-600 py-3 font-bold text-white shadow-lg transition-all hover:from-red-700 hover:to-orange-700 disabled:opacity-50"
              >
                {loading ? '⏳ 확인 중...' : '✅ 인증 확인'}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                className="w-full py-2 text-sm text-gray-400 hover:text-white"
              >
                ← 돌아가기
              </button>
            </form>
          )}

          {/* Step 3: 성공 */}
          {step === 'success' && (
            <div className="py-8 text-center">
              <span className="text-5xl">✅</span>
              <p className="mt-3 text-xl font-bold text-white">인증 성공!</p>
              <p className="mt-2 text-gray-400">
                관리자 대시보드로 이동합니다...
              </p>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-gray-700">
                <div
                  className="h-1 animate-pulse rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 링크 */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-300"
          >
            일반 사용자 로그인 →
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600">
          🔒 이 페이지는 관리자 전용입니다. 무단 접근 시도는 기록됩니다.
        </div>
      </div>
    </div>
  )
}
