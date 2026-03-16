'use client'

import { useState } from 'react'

type ConditionType =
  | 'RSI'
  | 'MA_CROSS'
  | 'PRICE'
  | 'VOLUME'
  | 'BB'
  | 'MACD'
  | 'STOCH'
type Operator = '<' | '>' | '==' | 'crosses_above' | 'crosses_below'
type ActionType = 'BUY' | 'SELL' | 'HOLD'

interface Condition {
  id: string
  indicator: ConditionType
  operator: Operator
  value: number | string
  label: string
}

interface Rule {
  id: string
  name: string
  conditions: Condition[]
  action: ActionType
  positionSize: number
}

const INDICATORS: Array<{
  type: ConditionType
  name: string
  icon: string
  operators: Operator[]
  defaultValue: number | string
  description: string
}> = [
  {
    type: 'RSI',
    name: 'RSI',
    icon: '📊',
    operators: ['<', '>'],
    defaultValue: 30,
    description: 'RSI(14일) 과매도/과매수',
  },
  {
    type: 'MA_CROSS',
    name: '이동평균',
    icon: '📈',
    operators: ['crosses_above', 'crosses_below'],
    defaultValue: '5MA/20MA',
    description: '이동평균 골든/데드크로스',
  },
  {
    type: 'PRICE',
    name: '가격',
    icon: '💰',
    operators: ['<', '>'],
    defaultValue: 70000,
    description: '특정 가격 돌파/이탈',
  },
  {
    type: 'VOLUME',
    name: '거래량',
    icon: '📦',
    operators: ['>'],
    defaultValue: 200,
    description: '평균 대비 거래량(%)',
  },
  {
    type: 'BB',
    name: '볼린저밴드',
    icon: '🔔',
    operators: ['<', '>'],
    defaultValue: 'lower',
    description: '밴드 상단/하단 터치',
  },
  {
    type: 'MACD',
    name: 'MACD',
    icon: '〽️',
    operators: ['crosses_above', 'crosses_below'],
    defaultValue: 'signal',
    description: 'MACD/시그널 크로스',
  },
  {
    type: 'STOCH',
    name: '스토캐스틱',
    icon: '🎯',
    operators: ['<', '>'],
    defaultValue: 20,
    description: 'K값 과매도/과매수',
  },
]

const OP_LABELS: Record<Operator, string> = {
  '<': '미만',
  '>': '초과',
  '==': '같음',
  crosses_above: '상향 돌파',
  crosses_below: '하향 돌파',
}

const ACTION_STYLES: Record<ActionType, string> = {
  BUY: 'bg-red-500 text-white',
  SELL: 'bg-blue-500 text-white',
  HOLD: 'bg-gray-400 text-white',
}

export default function StrategyBuilderPage() {
  const [rules, setRules] = useState<Rule[]>([
    {
      id: 'rule-1',
      name: '매수 규칙 1',
      conditions: [
        {
          id: 'c1',
          indicator: 'RSI',
          operator: '<',
          value: 30,
          label: 'RSI < 30 (과매도)',
        },
        {
          id: 'c2',
          indicator: 'VOLUME',
          operator: '>',
          value: 200,
          label: '거래량 > 200%',
        },
      ],
      action: 'BUY',
      positionSize: 10,
    },
    {
      id: 'rule-2',
      name: '매도 규칙 1',
      conditions: [
        {
          id: 'c3',
          indicator: 'RSI',
          operator: '>',
          value: 70,
          label: 'RSI > 70 (과매수)',
        },
      ],
      action: 'SELL',
      positionSize: 100,
    },
  ])

  const [strategyName, setStrategyName] = useState('나의 커스텀 전략')
  const [showAddCondition, setShowAddCondition] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    show: boolean
    returnPct: number
    trades: number
    winRate: number
  } | null>(null)
  const [saved, setSaved] = useState(false)

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        name: `규칙 ${rules.length + 1}`,
        conditions: [],
        action: 'BUY',
        positionSize: 10,
      },
    ])
  }

  const removeRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId))
  }

  const addCondition = (ruleId: string, indicator: (typeof INDICATORS)[0]) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r
        const newCondition: Condition = {
          id: `c-${Date.now()}`,
          indicator: indicator.type,
          operator: indicator.operators[0],
          value: indicator.defaultValue,
          label: `${indicator.name} ${OP_LABELS[indicator.operators[0]]} ${indicator.defaultValue}`,
        }
        return { ...r, conditions: [...r.conditions, newCondition] }
      })
    )
    setShowAddCondition(null)
  }

  const removeCondition = (ruleId: string, condId: string) => {
    setRules(
      rules.map((r) =>
        r.id === ruleId
          ? { ...r, conditions: r.conditions.filter((c) => c.id !== condId) }
          : r
      )
    )
  }

  const updateAction = (ruleId: string, action: ActionType) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, action } : r)))
  }

  const runBacktest = () => {
    setTestResult({
      show: true,
      returnPct: +(Math.random() * 25 + 5).toFixed(1),
      trades: Math.floor(Math.random() * 50 + 10),
      winRate: +(Math.random() * 30 + 50).toFixed(1),
    })
  }

  const saveStrategy = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🧩 커스텀 전략 빌더</h1>
          <p className="text-gray-500">
            조건을 조합하여 나만의 자동매매 전략을 만드세요
          </p>
        </div>
        <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
          Pro 전용
        </span>
      </div>

      {/* 전략 이름 */}
      <div className="rounded-xl border bg-white p-4">
        <label className="text-sm font-medium text-gray-600">전략 이름</label>
        <input
          type="text"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          className="mt-1 w-full rounded-lg border px-4 py-2 text-lg font-bold focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* 규칙 목록 */}
      <div className="space-y-4">
        {rules.map((rule, ruleIndex) => (
          <div
            key={rule.id}
            className="rounded-xl border bg-white shadow-sm overflow-hidden"
          >
            {/* 규칙 헤더 */}
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {ruleIndex + 1}
                </span>
                <span className="font-semibold">{rule.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">실행:</span>
                {(['BUY', 'SELL', 'HOLD'] as ActionType[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => updateAction(rule.id, a)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${rule.action === a ? ACTION_STYLES[a] : 'bg-gray-100 text-gray-500'}`}
                  >
                    {a === 'BUY' ? '매수' : a === 'SELL' ? '매도' : '대기'}
                  </button>
                ))}
                <button
                  onClick={() => removeRule(rule.id)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 조건 목록 */}
            <div className="p-4 space-y-2">
              {rule.conditions.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  조건을 추가하세요 ↓
                </p>
              )}

              {rule.conditions.map((cond, ci) => (
                <div key={cond.id} className="flex items-center gap-2">
                  {ci > 0 && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                      AND
                    </span>
                  )}
                  <div className="flex flex-1 items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
                    <span className="text-lg">
                      {INDICATORS.find((i) => i.type === cond.indicator)?.icon}
                    </span>
                    <span className="font-medium">
                      {INDICATORS.find((i) => i.type === cond.indicator)?.name}
                    </span>
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                      {OP_LABELS[cond.operator]}
                    </span>
                    <span className="font-mono font-bold">
                      {String(cond.value)}
                    </span>
                  </div>
                  <button
                    onClick={() => removeCondition(rule.id, cond.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* 조건 추가 */}
              {showAddCondition === rule.id ? (
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg border-2 border-dashed border-blue-200 bg-blue-50 p-3 md:grid-cols-4">
                  {INDICATORS.map((ind) => (
                    <button
                      key={ind.type}
                      onClick={() => addCondition(rule.id, ind)}
                      className="flex items-center gap-2 rounded-lg bg-white p-2 text-left text-sm shadow-sm hover:shadow-md transition-shadow"
                    >
                      <span className="text-xl">{ind.icon}</span>
                      <div>
                        <p className="font-medium">{ind.name}</p>
                        <p className="text-xs text-gray-400">
                          {ind.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCondition(rule.id)}
                  className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500"
                >
                  + 조건 추가
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 규칙 추가 버튼 */}
      <button
        onClick={addRule}
        className="w-full rounded-xl border-2 border-dashed border-gray-300 py-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + 새 규칙 추가
      </button>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={runBacktest}
          className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-bold text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
        >
          🧪 백테스트 실행
        </button>
        <button
          onClick={saveStrategy}
          className={`flex-1 rounded-xl py-3 font-bold shadow-lg transition-all ${saved ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'}`}
        >
          {saved ? '✅ 저장 완료!' : '💾 전략 저장'}
        </button>
      </div>

      {/* 백테스트 결과 */}
      {testResult?.show && (
        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
          <h3 className="font-bold text-lg mb-3">
            🧪 백테스트 결과 — &ldquo;{strategyName}&rdquo;
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-white p-3 text-center shadow">
              <p className="text-sm text-gray-500">수익률</p>
              <p className="text-2xl font-black text-red-500">
                +{testResult.returnPct}%
              </p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center shadow">
              <p className="text-sm text-gray-500">총 거래</p>
              <p className="text-2xl font-black">{testResult.trades}건</p>
            </div>
            <div className="rounded-lg bg-white p-3 text-center shadow">
              <p className="text-sm text-gray-500">승률</p>
              <p className="text-2xl font-black">{testResult.winRate}%</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-amber-600">
            ⚠️ 백테스트 결과는 과거 데이터 기반이며 미래 수익을 보장하지
            않습니다.
          </p>
        </div>
      )}

      {/* 전략 미리보기 (코드) */}
      <div className="rounded-xl border bg-gray-900 p-4 text-sm text-green-400 font-mono">
        <p className="text-gray-500 mb-2">// 생성된 전략 로직</p>
        {rules.map((rule) => (
          <div key={rule.id} className="mb-2">
            <p>
              <span className="text-purple-400">if</span>
              {' ('}
              {rule.conditions.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && <span className="text-yellow-400"> && </span>}
                  <span className="text-cyan-300">{c.indicator}</span>
                  <span className="text-white"> {c.operator} </span>
                  <span className="text-orange-300">{String(c.value)}</span>
                </span>
              ))}
              {') '}
              <span className="text-purple-400">then</span>{' '}
              <span
                className={
                  rule.action === 'BUY'
                    ? 'text-red-400'
                    : rule.action === 'SELL'
                      ? 'text-blue-400'
                      : 'text-gray-400'
                }
              >
                {rule.action}
              </span>
              {'({'}
              <span className="text-gray-400">size: {rule.positionSize}%</span>
              {'})'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
