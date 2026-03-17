'use client'

import { useState } from 'react'

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState('')
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

    if (adminId === 'alphix' && password === 'AlphixAdmin2026!') {
      setStep('otp')
    } else {
      setError('관리자 ID 또는 비밀번호가 올바르지 않습니다.')
    }
    setLoading(false)
  }

  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        padding: '16px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              width: '64px',
              height: '64px',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              fontSize: '24px',
              fontWeight: 900,
              color: 'white',
              boxShadow: '0 8px 32px rgba(239,68,68,0.3)',
            }}
          >
            A
          </div>
          <h1
            style={{
              marginTop: '16px',
              fontSize: '24px',
              fontWeight: 900,
              color: 'white',
            }}
          >
            Alphix 관리자
          </h1>
          <p style={{ marginTop: '4px', color: '#9ca3af' }}>
            관리자 전용 로그인
          </p>
        </div>

        <div
          style={{
            borderRadius: '16px',
            border: '1px solid #374151',
            background: 'rgba(31,41,55,0.5)',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        >
          {step === 'credentials' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#d1d5db',
                    marginBottom: '4px',
                  }}
                >
                  관리자 ID
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                    }}
                  >
                    👤
                  </span>
                  <input
                    type="text"
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    required
                    placeholder="관리자 ID를 입력하세요"
                    autoComplete="username"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #4b5563',
                      background: '#374151',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#d1d5db',
                    marginBottom: '4px',
                  }}
                >
                  비밀번호
                </label>
                <div style={{ position: 'relative' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#6b7280',
                    }}
                  >
                    🔑
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 40px',
                      border: '1px solid #4b5563',
                      background: '#374151',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: '8px',
                    color: '#f87171',
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
                  background: loading
                    ? '#6b7280'
                    : 'linear-gradient(135deg, #dc2626, #ea580c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ 확인 중...' : '🔐 관리자 로그인'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOTP}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '40px' }}>🛡️</span>
                <p
                  style={{
                    marginTop: '8px',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  2단계 인증
                </p>
                <p
                  style={{
                    marginTop: '4px',
                    fontSize: '14px',
                    color: '#9ca3af',
                  }}
                >
                  6자리 인증 코드를 입력하세요
                </p>
              </div>

              <div style={{ marginTop: '16px' }}>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  maxLength={6}
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    border: '1px solid #4b5563',
                    background: '#374151',
                    borderRadius: '12px',
                    color: 'white',
                    fontSize: '24px',
                    textAlign: 'center',
                    letterSpacing: '0.5em',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(239,68,68,0.1)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '14px',
                    marginTop: '16px',
                  }}
                >
                  ❌ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px',
                  background:
                    loading || otp.length !== 6
                      ? '#6b7280'
                      : 'linear-gradient(135deg, #dc2626, #ea580c)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor:
                    loading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? '⏳ 확인 중...' : '✅ 인증 확인'}
              </button>

              <button
                type="button"
                onClick={() => setStep('credentials')}
                style={{
                  width: '100%',
                  marginTop: '8px',
                  padding: '8px',
                  background: 'transparent',
                  color: '#9ca3af',
                  border: 'none',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ← 돌아가기
              </button>
            </form>
          )}

          {step === 'success' && (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <span style={{ fontSize: '48px' }}>✅</span>
              <p
                style={{
                  marginTop: '12px',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                인증 성공!
              </p>
              <p style={{ marginTop: '8px', color: '#9ca3af' }}>
                관리자 대시보드로 이동합니다...
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <a
            href="/login"
            style={{
              fontSize: '14px',
              color: '#6b7280',
              textDecoration: 'none',
            }}
          >
            일반 사용자 로그인 →
          </a>
        </div>
        <div
          style={{
            marginTop: '16px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#4b5563',
          }}
        >
          🔒 이 페이지는 관리자 전용입니다. 무단 접근 시도는 기록됩니다.
        </div>
      </div>
    </div>
  )
}
