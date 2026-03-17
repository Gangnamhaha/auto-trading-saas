'use client'

import React, { useRef, useState } from 'react'

export default function SignupPage() {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    // FormData로 직접 읽기 (모바일 호환)
    const formData = new FormData(e.currentTarget)
    const email = (formData.get('email') as string)?.trim()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const terms = formData.get('terms')

    if (!email || !email.includes('@')) {
      setError('올바른 이메일을 입력하세요.')
      return
    }
    if (!password || password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!terms) {
      setError('이용약관에 동의해주세요.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '회원가입에 실패했습니다.')
        setLoading(false)
        return
      }

      try {
        if (data.accessToken)
          localStorage.setItem('accessToken', data.accessToken)
        if (data.refreshToken)
          localStorage.setItem('refreshToken', data.refreshToken)
      } catch {
        /* localStorage unavailable */
      }

      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch {
      setError('서버에 연결할 수 없습니다.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ fontSize: '48px' }}>🎉</div>
          <h2
            style={{ marginTop: '16px', fontSize: '24px', fontWeight: 'bold' }}
          >
            회원가입 완료!
          </h2>
          <p style={{ marginTop: '8px', color: '#6b7280' }}>
            대시보드로 이동합니다...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <a
            href="/"
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2563eb',
              textDecoration: 'none',
            }}
          >
            Alphix
          </a>
          <h1
            style={{ marginTop: '16px', fontSize: '20px', fontWeight: 'bold' }}
          >
            회원가입
          </h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: '#6b7280' }}>
            새 계정을 만들어 자동매매를 시작하세요
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{ marginTop: '24px' }}
        >
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
              }}
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="name@example.com"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
              }}
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="8자 이상"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="confirmPassword"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
              }}
            >
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="비밀번호 다시 입력"
              style={{
                width: '100%',
                padding: '10px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <input
                name="terms"
                type="checkbox"
                value="agreed"
                style={{ marginTop: '2px' }}
              />
              <span style={{ color: '#4b5563' }}>
                <a href="/terms" target="_blank" style={{ color: '#2563eb' }}>
                  이용약관
                </a>{' '}
                및{' '}
                <a href="/privacy" target="_blank" style={{ color: '#2563eb' }}>
                  개인정보처리방침
                </a>
                에 동의합니다
              </span>
            </label>
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '처리 중...' : '회원가입'}
          </button>
        </form>

        <p
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          이미 계정이 있으신가요?{' '}
          <a href="/login" style={{ color: '#2563eb', fontWeight: '500' }}>
            로그인
          </a>
        </p>

        <p
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          ⚠️ 투자 원금 손실이 발생할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
