'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        setLoggedIn(true)
        const decoded = JSON.parse(atob(token))
        setEmail(decoded.email || '')
      }
    } catch {
      /* not logged in */
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.href = '/login'
  }

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        borderBottom: '1px solid #e5e7eb',
        background: '#fff',
      }}
    >
      <Link
        href="/"
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: '#2563eb',
          textDecoration: 'none',
        }}
      >
        Alphix
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loggedIn ? (
          <>
            <span style={{ fontSize: 13, color: '#6b7280' }}>{email}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}
            >
              로그인
            </Link>
            <Link
              href="/signup"
              style={{
                padding: '6px 14px',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 8,
                fontSize: 13,
                textDecoration: 'none',
              }}
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
