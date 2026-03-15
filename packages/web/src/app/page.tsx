import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { TrendingUp, Settings2, FlaskConical, Check } from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: '🇰🇷 한국 주식 특화',
    description: 'KOSPI/KOSDAQ 실시간 데이터 기반 전략 실행',
  },
  {
    icon: Settings2,
    title: '📊 노코드 전략 설정',
    description: '코딩 없이 드래그 앤 드롭으로 전략 구성',
  },
  {
    icon: FlaskConical,
    title: '🔬 백테스팅 + 실전 원스톱',
    description: '검증된 전략을 바로 실전에 적용',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '무료',
    description: '개인 학습용',
    features: ['전략 1개', '백테스팅 기본', '모의투자만'],
    cta: '무료로 시작하기',
    popular: false,
  },
  {
    name: 'Basic',
    price: '9,900원',
    period: '/월',
    description: '개인 투자자',
    features: ['전략 3개', '백테스팅 고급', '실전 트레이딩', '이메일 지원'],
    cta: 'Basic 시작하기',
    popular: true,
  },
  {
    name: 'Pro',
    price: '29,900원',
    period: '/월',
    description: '전문 투자자',
    features: [
      '전략 무제한',
      '백테스팅 프리미엄',
      '실전 트레이딩',
      '우선 지원',
      'API 접근',
    ],
    cta: 'Pro 시작하기',
    popular: false,
  },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary-50 to-white px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              한국 주식 자동매매,
              <br />
              <span className="text-primary-600">이제 쉽게</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              코딩 없이 전략을 설정하고, 백테스팅으로 검증한 뒤,
              <br className="hidden sm:block" />
              바로 실전 트레이딩을 시작하세요.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  무료로 시작하기
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  데모 보기
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              왜 AutoTrade인가요?
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      <feature.icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <h2 className="text-center text-3xl font-bold text-gray-900">
              요금제 안내
            </h2>
            <p className="mt-4 text-center text-gray-600">
              투자 스타일에 맞는 플랜을 선택하세요
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {pricingPlans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`relative ${
                    plan.popular
                      ? 'border-primary-500 ring-2 ring-primary-500'
                      : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      인기
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-gray-500">{plan.period}</span>
                      )}
                    </div>
                    <CardDescription className="mt-2">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-primary-600" />
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/signup" className="mt-6 block">
                      <Button
                        variant={plan.popular ? 'default' : 'outline'}
                        className="w-full"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
