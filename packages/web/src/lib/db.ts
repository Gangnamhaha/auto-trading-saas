import { Pool, type QueryResultRow } from 'pg'

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) {
    return pool
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required')
  }

  pool = new Pool({
    connectionString: databaseUrl,
  })

  return pool
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const client = getPool()
  const result = await client.query<T>(text, values)
  return result.rows
}
