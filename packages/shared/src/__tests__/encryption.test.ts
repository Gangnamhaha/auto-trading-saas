import { describe, expect, it } from 'bun:test'

import { decrypt, encrypt } from '../crypto/encryption'

const KEY_HEX =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('encryption', () => {
  it('encrypts and decrypts correctly (roundtrip)', () => {
    const plaintext = 'sensitive-api-key'
    const encrypted = encrypt(plaintext, KEY_HEX)

    expect(decrypt(encrypted, KEY_HEX)).toBe(plaintext)
  })

  it('encrypted value differs from plaintext', () => {
    const plaintext = 'plain-secret'
    const encrypted = encrypt(plaintext, KEY_HEX)

    expect(encrypted).not.toContain(plaintext)
    expect(encrypted).not.toBe(plaintext)
  })

  it('different IVs produce different ciphertexts for same input', () => {
    const plaintext = 'same-input'

    const encryptedA = encrypt(plaintext, KEY_HEX)
    const encryptedB = encrypt(plaintext, KEY_HEX)

    expect(encryptedA).not.toBe(encryptedB)
  })

  it('throws on wrong key', () => {
    const plaintext = 'api-secret'
    const encrypted = encrypt(plaintext, KEY_HEX)
    const wrongKeyHex =
      'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'

    expect(() => decrypt(encrypted, wrongKeyHex)).toThrow()
  })
})
