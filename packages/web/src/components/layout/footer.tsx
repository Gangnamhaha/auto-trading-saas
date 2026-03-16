import { Disclaimer } from './disclaimer'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-primary-600">Alphix</h3>
            <p className="text-sm text-gray-600">한국 주식 자동매매 플랫폼</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">서비스</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/strategies" className="hover:text-primary-600">
                  전략 설정
                </a>
              </li>
              <li>
                <a href="/backtest" className="hover:text-primary-600">
                  백테스팅
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-primary-600">
                  요금제
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">고객지원</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/help" className="hover:text-primary-600">
                  도움말
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-primary-600">
                  자주 묻는 질문
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-primary-600">
                  문의하기
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold">법적 고지</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="/terms" className="hover:text-primary-600">
                  이용약관
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-primary-600">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="/risk" className="hover:text-primary-600">
                  투자위험고지
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <Disclaimer />
          <p className="mt-4 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} Alphix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
