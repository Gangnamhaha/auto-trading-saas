import { randomUUID } from 'node:crypto'

import { NextResponse } from 'next/server'

import { hashPassword } from '../../../../lib/auth/password'
import { query } from '../../../../lib/db'

type SignupBody = {
  email?: string
  password?: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as SignupBody
  const email = body.email?.trim().toLowerCase()
  const password = body.password

  if (!email || !EMAIL_REGEX.test(email) || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const existing = await query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 LIMIT 1',
    [email]
  )
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
  }

  const id = randomUUID()
  const hashedPassword = await hashPassword(password)

  const inserted = await query<{ id: string; email: string }>(
    `INSERT INTO users (id, email, hashed_password)
     VALUES ($1, $2, $3)
     RETURNING id, email`,
    [id, email, hashedPassword]
  )

  const user = inserted[0]
  return NextResponse.json({ user }, { status: 201 })
}
