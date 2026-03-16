/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import type { QueryResultRow } from 'pg'

/**
 * DB 레이어 — PostgreSQL 연결 시 실제 DB, 미연결 시 인메모리 폴백
 */

// 인메모리 저장소 (DB 없을 때 사용)
const memoryStore: Map<string, Array<Record<string, unknown>>> = new Map()
memoryStore.set('users', [])

let useMemory = false

function getPool() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    useMemory = true
    return null
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require('pg')
    return new Pool({ connectionString: databaseUrl })
  } catch {
    useMemory = true
    return null
  }
}

const pool = getPool()

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  // 실제 DB 연결 시
  if (pool && !useMemory) {
    try {
      const result = await pool.query(text, values)
      return result.rows
    } catch {
      useMemory = true
      // DB 실패 시 인메모리 폴백
    }
  }

  // 인메모리 폴백
  return memoryQuery<T>(text, values)
}

function memoryQuery<T>(text: string, values: unknown[]): T[] {
  const upperText = text.toUpperCase().trim()

  // SELECT ... FROM users WHERE email = $1
  if (
    upperText.startsWith('SELECT') &&
    upperText.includes('USERS') &&
    upperText.includes('WHERE')
  ) {
    const users = memoryStore.get('users') ?? []
    const email = values[0]
    const found = users.filter((u) => u.email === email)
    return found as T[]
  }

  // INSERT INTO users
  if (upperText.startsWith('INSERT') && upperText.includes('USERS')) {
    const users = memoryStore.get('users') ?? []
    const newUser = {
      id: values[0],
      email: values[1],
      hashed_password: values[2],
      subscription_tier: 'free',
      created_at: new Date().toISOString(),
    }
    users.push(newUser)
    memoryStore.set('users', users)
    return [{ id: values[0], email: values[1] }] as T[]
  }

  // SELECT all users
  if (upperText.startsWith('SELECT') && upperText.includes('USERS')) {
    return (memoryStore.get('users') ?? []) as T[]
  }

  return []
}

export function getMemoryUsers(): Array<Record<string, unknown>> {
  return memoryStore.get('users') ?? []
}
