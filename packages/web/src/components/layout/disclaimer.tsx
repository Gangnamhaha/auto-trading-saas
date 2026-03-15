import { AlertTriangle } from 'lucide-react'

export function Disclaimer() {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-yellow-800">
            ⚠️ 투자 위험 고지
          </p>
          <p className="text-xs text-yellow-700">
            투자 원금 손실이 발생할 수 있습니다. 과거 수익률이 미래 수익률을
            보장하지 않습니다.
          </p>
          <p className="text-xs text-yellow-700">
            본 서비스는 투자자문이 아닌 기술적 자동주문 도구입니다. 모든 투자
            판단의 책임은 이용자에게 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
