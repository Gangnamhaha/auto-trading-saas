'use client'

import { useState } from 'react'

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (adminId === 'admin' && password === '7777') {
      window.location.href = '/admin/dashboard'
    } else {
      setError('아이디 또는 비밀번호가 틀렸습니다.')
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111827',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto',
              borderRadius: 14,
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 28,
              fontWeight: 900,
            }}
          >
            A
          </div>
          <p
            style={{
              color: '#fff',
              fontSize: 22,
              fontWeight: 800,
              marginTop: 14,
            }}
          >
            관리자
          </p>
        </div>

        {/* 폼 */}
        <form
          onSubmit={handleLogin}
          style={{
            background: '#1f2937',
            borderRadius: 14,
            padding: 28,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                color: '#d1d5db',
                fontSize: 13,
                display: 'block',
                marginBottom: 6,
              }}
            >
              아이디
            </label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                color: '#d1d5db',
                fontSize: 13,
                display: 'block',
                marginBottom: 6,
              }}
            >
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '11px 14px',
                background: '#374151',
                border: '1px solid #4b5563',
                borderRadius: 10,
                color: '#fff',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p
              style={{
                background: '#7f1d1d',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 18,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: 13,
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            로그인
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24 }}>
          <a
            href="/login"
            style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}
          >
            일반 로그인 →
          </a>
        </p>
      </div>
    </div>
  )
}
