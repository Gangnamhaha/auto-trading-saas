export type Locale = 'ko' | 'en' | 'ja' | 'zh'

export const translations: Record<Locale, Record<string, string>> = {
  ko: {
    // 네비게이션
    'nav.home': '홈',
    'nav.dashboard': '대시보드',
    'nav.strategies': '전략 설정',
    'nav.backtest': '백테스팅',
    'nav.chart': '실시간 차트',
    'nav.screener': '종목 추천',
    'nav.builder': '전략 빌더',
    'nav.social': '소셜 트레이딩',
    'nav.marketing': '마케팅 자동화',
    'nav.broker': '브로커 연결',
    'nav.admin': '관리자',
    'nav.login': '로그인',
    'nav.signup': '회원가입',

    // 랜딩
    'hero.title': '한국 주식 자동매매, 이제 쉽게',
    'hero.subtitle':
      '코딩 없이 전략을 설정하고, 백테스팅으로 검증한 뒤, 바로 실전 트레이딩을 시작하세요.',
    'hero.cta': '무료로 시작하기',
    'hero.demo': '데모 보기',

    // 가격
    'pricing.title': '요금제 안내',
    'pricing.subtitle': '투자 스타일에 맞는 플랜을 선택하세요',
    'pricing.free': '무료',
    'pricing.free.desc': '개인 학습용',
    'pricing.basic': '9,900원/월',
    'pricing.basic.desc': '개인 투자자',
    'pricing.pro': '29,900원/월',
    'pricing.pro.desc': '전문 투자자',
    'pricing.popular': '인기',

    // 대시보드
    'dash.total': '총 자산',
    'dash.pnl': '오늘 손익',
    'dash.return': '총 수익률',
    'dash.active': '활성 전략',
    'dash.heatmap': '포지션 히트맵',
    'dash.positions': '보유종목',
    'dash.trades': '최근거래',
    'dash.alerts': '알림',
    'dash.live': 'LIVE',

    // 공통
    'common.disclaimer':
      '⚠️ 투자 원금 손실이 발생할 수 있습니다. 과거 수익률이 미래 수익을 보장하지 않습니다.',
    'common.disclaimer2':
      '본 서비스는 투자자문이 아닌 기술적 자동주문 도구입니다. 모든 투자 판단의 책임은 이용자에게 있습니다.',
    'common.buy': '매수',
    'common.sell': '매도',
    'common.hold': '대기',
  },

  en: {
    'nav.home': 'Home',
    'nav.dashboard': 'Dashboard',
    'nav.strategies': 'Strategies',
    'nav.backtest': 'Backtest',
    'nav.chart': 'Live Chart',
    'nav.screener': 'Screener',
    'nav.builder': 'Strategy Builder',
    'nav.social': 'Social Trading',
    'nav.marketing': 'Marketing',
    'nav.broker': 'Broker',
    'nav.admin': 'Admin',
    'nav.login': 'Login',
    'nav.signup': 'Sign Up',

    'hero.title': 'Automated Stock Trading, Made Easy',
    'hero.subtitle':
      'Set strategies without coding, validate with backtesting, and start live trading instantly.',
    'hero.cta': 'Start Free',
    'hero.demo': 'View Demo',

    'pricing.title': 'Pricing Plans',
    'pricing.subtitle': 'Choose the plan that fits your trading style',
    'pricing.free': 'Free',
    'pricing.free.desc': 'For learning',
    'pricing.basic': '$7.99/mo',
    'pricing.basic.desc': 'Individual trader',
    'pricing.pro': '$24.99/mo',
    'pricing.pro.desc': 'Professional trader',
    'pricing.popular': 'Popular',

    'dash.total': 'Total Assets',
    'dash.pnl': 'Today P&L',
    'dash.return': 'Total Return',
    'dash.active': 'Active Strategies',
    'dash.heatmap': 'Position Heatmap',
    'dash.positions': 'Holdings',
    'dash.trades': 'Recent Trades',
    'dash.alerts': 'Alerts',
    'dash.live': 'LIVE',

    'common.disclaimer':
      '⚠️ Investment may result in loss of principal. Past performance does not guarantee future results.',
    'common.disclaimer2':
      'This service is an automated order tool, not investment advice. All investment decisions are your responsibility.',
    'common.buy': 'BUY',
    'common.sell': 'SELL',
    'common.hold': 'HOLD',
  },

  ja: {
    'nav.home': 'ホーム',
    'nav.dashboard': 'ダッシュボード',
    'nav.strategies': '戦略設定',
    'nav.backtest': 'バックテスト',
    'nav.chart': 'リアルタイムチャート',
    'nav.screener': '銘柄推薦',
    'nav.builder': '戦略ビルダー',
    'nav.social': 'ソーシャル取引',
    'nav.marketing': 'マーケティング',
    'nav.broker': 'ブローカー',
    'nav.admin': '管理者',
    'nav.login': 'ログイン',
    'nav.signup': '新規登録',

    'hero.title': '株式自動売買、簡単に始めよう',
    'hero.subtitle':
      'コーディング不要で戦略を設定し、バックテストで検証後、すぐに実践トレーディングを開始。',
    'hero.cta': '無料で始める',
    'hero.demo': 'デモを見る',

    'pricing.title': '料金プラン',
    'pricing.subtitle': 'あなたの投資スタイルに合ったプランを選択',
    'pricing.free': '無料',
    'pricing.free.desc': '個人学習用',
    'pricing.basic': '¥980/月',
    'pricing.basic.desc': '個人投資家',
    'pricing.pro': '¥2,980/月',
    'pricing.pro.desc': 'プロ投資家',
    'pricing.popular': '人気',

    'dash.total': '総資産',
    'dash.pnl': '今日の損益',
    'dash.return': '総収益率',
    'dash.active': 'アクティブ戦略',
    'dash.heatmap': 'ポジションヒートマップ',
    'dash.positions': '保有銘柄',
    'dash.trades': '最近の取引',
    'dash.alerts': '通知',
    'dash.live': 'LIVE',

    'common.disclaimer':
      '⚠️ 投資元本の損失が発生する可能性があります。過去の収益率は将来の収益を保証しません。',
    'common.disclaimer2':
      '本サービスは投資助言ではなく、技術的な自動注文ツールです。すべての投資判断の責任は利用者にあります。',
    'common.buy': '買い',
    'common.sell': '売り',
    'common.hold': '待機',
  },

  zh: {
    'nav.home': '首页',
    'nav.dashboard': '仪表盘',
    'nav.strategies': '策略设置',
    'nav.backtest': '回测',
    'nav.chart': '实时图表',
    'nav.screener': '选股推荐',
    'nav.builder': '策略构建器',
    'nav.social': '社交交易',
    'nav.marketing': '营销自动化',
    'nav.broker': '券商连接',
    'nav.admin': '管理员',
    'nav.login': '登录',
    'nav.signup': '注册',

    'hero.title': '股票自动交易，轻松开始',
    'hero.subtitle': '无需编程即可设置策略，通过回测验证后，立即开始实盘交易。',
    'hero.cta': '免费开始',
    'hero.demo': '查看演示',

    'pricing.title': '定价方案',
    'pricing.subtitle': '选择适合您投资风格的方案',
    'pricing.free': '免费',
    'pricing.free.desc': '个人学习',
    'pricing.basic': '¥49/月',
    'pricing.basic.desc': '个人投资者',
    'pricing.pro': '¥149/月',
    'pricing.pro.desc': '专业投资者',
    'pricing.popular': '热门',

    'dash.total': '总资产',
    'dash.pnl': '今日盈亏',
    'dash.return': '总收益率',
    'dash.active': '活跃策略',
    'dash.heatmap': '持仓热力图',
    'dash.positions': '持仓',
    'dash.trades': '近期交易',
    'dash.alerts': '通知',
    'dash.live': 'LIVE',

    'common.disclaimer':
      '⚠️ 投资可能导致本金损失。过去的收益不保证未来的回报。',
    'common.disclaimer2':
      '本服务是自动下单工具，不构成投资建议。所有投资决策的责任由用户承担。',
    'common.buy': '买入',
    'common.sell': '卖出',
    'common.hold': '持有',
  },
}

export const LOCALE_NAMES: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  ko: '🇰🇷',
  en: '🇺🇸',
  ja: '🇯🇵',
  zh: '🇨🇳',
}
