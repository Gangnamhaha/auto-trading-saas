function maskValue(value: string): string {
  const normalized = value.trim()
  const tail = normalized.slice(-4)
  return `****${tail}`
}

function maskAuthorization(value: string): string {
  const [scheme, token] = value.split(' ')
  if (!token) {
    return maskValue(value)
  }

  return `${scheme} ${maskValue(token)}`
}

function isSensitiveKey(key: string): boolean {
  return /appkey|appsecret|access_token|authorization/i.test(key)
}

export function maskSensitive(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitive(item))
  }

  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (isSensitiveKey(key) && typeof value === 'string') {
        result[key] =
          key.toLowerCase() === 'authorization'
            ? maskAuthorization(value)
            : maskValue(value)
        continue
      }

      result[key] = maskSensitive(value)
    }

    return result
  }

  return obj
}

export function logRequest(
  method: string,
  url: string,
  headers: Record<string, string>
): void {
  // eslint-disable-next-line no-console
  console.log('[KIS]', method, url, maskSensitive(headers))
}
