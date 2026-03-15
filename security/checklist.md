# AutoTrade KR 보안 체크리스트

## 데이터 보안

- [x] 브로커 API 키: AES-256-GCM 암호화 저장
- [x] 비밀번호: bcrypt 해싱 (saltRounds=12)
- [x] JWT: 15분 만료 + 7일 리프레시 토큰
- [x] 로그: 민감 정보 마스킹 (\*\*\*\*last4)
- [ ] DB: SSL 연결 (프로덕션)
- [ ] Redis: 인증 설정 (프로덕션)

## API 보안

- [x] Rate Limiting: 브로커 API (초당 5회)
- [ ] Rate Limiting: 웹 API (미구현 - Wave 5에서)
- [x] 입력 유효성 검사: 이메일, 비밀번호
- [ ] CSRF 보호: Next.js 기본 제공
- [ ] SQL Injection: Drizzle ORM 파라미터화 쿼리

## 법적 준수

- [x] 면책 고지: 모든 페이지 footer
- [x] 투자 원금 손실 경고
- [x] 과거 수익률 보장 금지 문구
- [ ] 개인정보처리방침 페이지 (Wave 5에서)
- [ ] 이용약관 페이지 (Wave 5에서)

## 트레이딩 안전

- [x] 페이퍼트레이딩 30일 의무
- [x] 회로차단기 (일일 손실 한도)
- [x] 포지션 크기 제한
- [x] 실전/모의 환경 분리
