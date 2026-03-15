import jwt from 'jsonwebtoken'

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type TokenPayload,
} from '../lib/auth/auth'
import { hashPassword, verifyPassword } from '../lib/auth/password'

const payload: TokenPayload = {
  userId: 'user-123',
  email: 'trader@example.com',
  subscriptionTier: 'pro',
}

process.env.JWT_ACCESS_SECRET = 'test-access-secret'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret'

describe('auth', () => {
  it('generates valid access token', () => {
    const token = generateAccessToken(payload)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('generates valid refresh token', () => {
    const token = generateRefreshToken(payload)

    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('verifies valid access token', () => {
    const token = generateAccessToken(payload)
    const decoded = verifyAccessToken(token)

    expect(decoded).toEqual(payload)
  })

  it('verifies valid refresh token', () => {
    const token = generateRefreshToken(payload)
    const decoded = verifyRefreshToken(token)

    expect(decoded).toEqual(payload)
  })

  it('throws on expired token', () => {
    const expiredToken = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET as string,
      {
        expiresIn: '-1s',
      }
    )

    expect(() => verifyAccessToken(expiredToken)).toThrow(
      'Invalid or expired token'
    )
  })

  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.value')).toThrow(
      'Invalid or expired token'
    )
  })

  it('hashes password correctly', async () => {
    const password = 'StrongPass123!'
    const hash = await hashPassword(password)

    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(20)
  })

  it('verifies correct password', async () => {
    const password = 'StrongPass123!'
    const hash = await hashPassword(password)

    await expect(verifyPassword(password, hash)).resolves.toBe(true)
  })

  it('rejects wrong password', async () => {
    const hash = await hashPassword('StrongPass123!')

    await expect(verifyPassword('WrongPass123!', hash)).resolves.toBe(false)
  })
})
