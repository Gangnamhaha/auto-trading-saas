/**
 * KIS API PoC Script
 * 이 스크립트는 KIS API 모의투자 환경에서 실행됩니다.
 *
 * Required env:
 * - KIS_APP_KEY
 * - KIS_APP_SECRET
 * - KIS_ACCOUNT_NO (e.g. 12345678-01)
 *
 * Optional env:
 * - KIS_ENV=demo|real (default: demo)
 * - KIS_ENABLE_ORDER_TEST=true (default: false)
 */

type KisEnv = 'demo' | 'real'

declare const process: {
  env: Record<string, string | undefined>
  exitCode?: number
}

declare const require: {
  main?: unknown
}

declare const module: unknown

interface KisApiResponse<T = unknown> {
  rt_cd: string
  msg_cd: string
  msg1: string
  output?: T
  output1?: unknown[]
  output2?: unknown[]
}

interface AccessTokenOutput {
  access_token: string
  token_type: string
  expires_in: number
  access_token_token_expired: string
}

interface PriceOutput {
  stck_prpr?: string
  prdy_vrss?: string
  prdy_ctrt?: string
  acml_vol?: string
  acml_tr_pbmn?: string
  [key: string]: unknown
}

const ENV = (
  process.env.KIS_ENV?.toLowerCase() === 'real' ? 'real' : 'demo'
) as KisEnv
const BASE_URL =
  ENV === 'real'
    ? 'https://openapi.koreainvestment.com:9443'
    : 'https://openapivts.koreainvestment.com:29443'

const APP_KEY = process.env.KIS_APP_KEY ?? ''
const APP_SECRET = process.env.KIS_APP_SECRET ?? ''
const ACCOUNT_NO = process.env.KIS_ACCOUNT_NO ?? ''

function assertRequiredEnv(): void {
  const missing: string[] = []
  if (!APP_KEY) missing.push('KIS_APP_KEY')
  if (!APP_SECRET) missing.push('KIS_APP_SECRET')
  if (!ACCOUNT_NO) missing.push('KIS_ACCOUNT_NO')

  if (missing.length > 0) {
    throw new Error(`Missing environment variable(s): ${missing.join(', ')}`)
  }
}

function splitAccountNo(accountNo: string): {
  cano: string
  acntPrdtCd: string
} {
  const normalized = accountNo.replace(/\s+/g, '')
  if (/^\d{8}-\d{2}$/.test(normalized)) {
    const [cano, acntPrdtCd] = normalized.split('-')
    return { cano, acntPrdtCd }
  }
  if (/^\d{10}$/.test(normalized)) {
    return { cano: normalized.slice(0, 8), acntPrdtCd: normalized.slice(8) }
  }
  throw new Error('KIS_ACCOUNT_NO format must be 12345678-01 or 1234567801')
}

async function requestKis<T>(
  path: string,
  options: RequestInit,
  token?: string,
  trId?: string
): Promise<KisApiResponse<T>> {
  const headers = new Headers(options.headers ?? {})
  headers.set('content-type', 'application/json')

  if (token) headers.set('authorization', `Bearer ${token}`)
  if (trId) headers.set('tr_id', trId)

  if (path !== '/oauth2/tokenP') {
    headers.set('appkey', APP_KEY)
    headers.set('appsecret', APP_SECRET)
    headers.set('custtype', 'P')
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = (await response.json()) as KisApiResponse<T>

  if (!response.ok || data.rt_cd !== '0') {
    throw new Error(
      `KIS API error (${response.status}): ${data.msg_cd} - ${data.msg1}`
    )
  }

  return data
}

/**
 * 접근 토큰 발급
 */
export async function getAccessToken(
  appKey: string,
  appSecret: string
): Promise<AccessTokenOutput> {
  const response = await fetch(`${BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  })

  const data = (await response.json()) as KisApiResponse<AccessTokenOutput> &
    AccessTokenOutput

  if (!response.ok || data.rt_cd !== '0') {
    throw new Error(`Token issue failed: ${data.msg_cd} - ${data.msg1}`)
  }

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    access_token_token_expired: data.access_token_token_expired,
  }
}

/**
 * 현재가 조회 (default: 005930 삼성전자)
 */
export async function getStockPrice(
  token: string,
  symbol: string
): Promise<PriceOutput> {
  const query = new URLSearchParams({
    FID_COND_MRKT_DIV_CODE: 'J',
    FID_INPUT_ISCD: symbol,
  })

  const data = await requestKis<PriceOutput>(
    `/uapi/domestic-stock/v1/quotations/inquire-price?${query.toString()}`,
    { method: 'GET' },
    token,
    'FHKST01010100'
  )

  return data.output ?? {}
}

/**
 * 주문 (모의투자 권장)
 * side: buy | sell
 * orderType: 00(지정가) | 01(시장가)
 */
export async function placeOrder(
  token: string,
  symbol: string,
  side: 'buy' | 'sell',
  qty: number,
  price: number,
  orderType: '00' | '01' = '00'
): Promise<Record<string, unknown>> {
  const { cano, acntPrdtCd } = splitAccountNo(ACCOUNT_NO)

  const trId =
    side === 'buy'
      ? ENV === 'real'
        ? 'TTTC0802U'
        : 'VTTC0802U'
      : ENV === 'real'
        ? 'TTTC0801U'
        : 'VTTC0801U'

  const body = {
    CANO: cano,
    ACNT_PRDT_CD: acntPrdtCd,
    PDNO: symbol,
    ORD_DVSN: orderType,
    ORD_QTY: String(qty),
    ORD_UNPR: orderType === '01' ? '0' : String(price),
  }

  const data = await requestKis<Record<string, unknown>>(
    '/uapi/domestic-stock/v1/trading/order-cash',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    token,
    trId
  )

  return data.output ?? {}
}

/**
 * 잔고 조회
 */
export async function getBalance(
  token: string,
  accountNo: string
): Promise<{ output1: unknown[]; output2: unknown[] }> {
  const { cano, acntPrdtCd } = splitAccountNo(accountNo)
  const params = new URLSearchParams({
    CANO: cano,
    ACNT_PRDT_CD: acntPrdtCd,
    AFHR_FLPR_YN: 'N',
    OFL_YN: '',
    INQR_DVSN: '02',
    UNPR_DVSN: '01',
    FUND_STTL_ICLD_YN: 'N',
    FNCG_AMT_AUTO_RDPT_YN: 'N',
    PRCS_DVSN: '00',
    CTX_AREA_FK100: '',
    CTX_AREA_NK100: '',
  })

  const trId = ENV === 'real' ? 'TTTC8434R' : 'VTTC8434R'

  const data = await requestKis(
    `/uapi/domestic-stock/v1/trading/inquire-balance?${params.toString()}`,
    { method: 'GET' },
    token,
    trId
  )

  return {
    output1: data.output1 ?? [],
    output2: data.output2 ?? [],
  }
}

/**
 * Rate Limit 측정 (PoC)
 * - 연속 현재가 조회 호출 후 성공/실패/소요시간 기록
 */
export async function testRateLimit(token: string): Promise<{
  attempts: number
  success: number
  fail: number
  elapsedMs: number
}> {
  const attempts = 20
  let success = 0
  let fail = 0
  const startedAt = Date.now()

  for (let i = 0; i < attempts; i += 1) {
    try {
      await getStockPrice(token, '005930')
      success += 1
    } catch {
      fail += 1
    }
  }

  return {
    attempts,
    success,
    fail,
    elapsedMs: Date.now() - startedAt,
  }
}

async function main(): Promise<void> {
  assertRequiredEnv()

  console.log(`[KIS PoC] env=${ENV}, baseUrl=${BASE_URL}`)

  const tokenInfo = await getAccessToken(APP_KEY, APP_SECRET)
  const token = tokenInfo.access_token
  console.log(`[KIS PoC] token issued, expires_in=${tokenInfo.expires_in}s`)

  const price = await getStockPrice(token, '005930')
  console.log('[KIS PoC] price(005930)', {
    stck_prpr: price.stck_prpr,
    prdy_vrss: price.prdy_vrss,
    prdy_ctrt: price.prdy_ctrt,
    acml_vol: price.acml_vol,
  })

  const balance = await getBalance(token, ACCOUNT_NO)
  console.log('[KIS PoC] balance', {
    positions: balance.output1.length,
    summaries: balance.output2.length,
  })

  if (process.env.KIS_ENABLE_ORDER_TEST === 'true') {
    const orderResult = await placeOrder(token, '005930', 'buy', 1, 70000, '00')
    console.log('[KIS PoC] order result', orderResult)
  } else {
    console.log(
      '[KIS PoC] order test skipped (set KIS_ENABLE_ORDER_TEST=true to enable)'
    )
  }

  const limitResult = await testRateLimit(token)
  console.log('[KIS PoC] rate limit probe', limitResult)
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[KIS PoC] failed:', message)
    process.exitCode = 1
  })
}
