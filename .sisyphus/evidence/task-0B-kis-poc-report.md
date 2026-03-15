# KIS Developers API PoC 보고서

## 1. 계정 가입 절차

1. 한국투자증권 계좌 개설 및 홈페이지/앱 로그인 준비
2. KIS Developers 접속: `https://apiportal.koreainvestment.com`
3. 상단 `API신청` 메뉴에서 Open API 서비스 신청 진행(휴대폰 본인인증 포함)
4. 유의사항/약관 동의 후 KIS Developers 서비스 가입 완료
5. 앱키/앱시크릿 발급(실전/모의투자 분리 발급)
6. HTS ID 확인(체결통보/일부 WebSocket 기능에 사용)
7. 포털 `API 문서`, `TESTBED`, `GitHub 샘플`로 호출 형식 확인

### 모의투자(Virtual Trading) 계정 준비

1. KIS Developers 신청 완료 후 모의투자용 App Key/App Secret 발급
2. 모의투자 계좌번호(8자리 + 상품코드 2자리) 확인
3. 모의투자 도메인 사용: `https://openapivts.koreainvestment.com:29443`
4. 주문/잔고 테스트는 반드시 모의투자에서만 수행

## 2. 인증 (OAuth 2.0)

- 인증 방식: `client_credentials` (개인/일반법인)
- Access Token 발급 URL: `POST /oauth2/tokenP`
- WebSocket 접속키 발급 URL: `POST /oauth2/Approval`
- 실전 도메인: `https://openapi.koreainvestment.com:9443`
- 모의 도메인: `https://openapivts.koreainvestment.com:29443`

### 접근 토큰 요청 형식

```http
POST /oauth2/tokenP
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "appkey": "<KIS_APP_KEY>",
  "appsecret": "<KIS_APP_SECRET>"
}
```

### 접근 토큰 응답 구조

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "access_token_token_expired": "YYYY-MM-DD HH:MM:SS",
  "rt_cd": "0",
  "msg_cd": "<code>",
  "msg1": "<message>"
}
```

## 3. 주요 API 엔드포인트 목록

### (A) 국내주식 현재가 조회

- Endpoint: `GET /uapi/domestic-stock/v1/quotations/inquire-price`
- 대표 TR ID: `FHKST01010100`
- 주요 Query
  - `FID_COND_MRKT_DIV_CODE`: `J` (주식/ETF/ETN)
  - `FID_INPUT_ISCD`: 종목코드(예: `005930`)

### (B) 국내주식 주문(현금)

- Endpoint: `POST /uapi/domestic-stock/v1/trading/order-cash`
- TR ID
  - 모의 매수: `VTTC0802U`
  - 모의 매도: `VTTC0801U`
  - 실전 매수: `TTTC0802U`
  - 실전 매도: `TTTC0801U`
- 주요 Body
  - `CANO` (계좌 8자리), `ACNT_PRDT_CD` (상품코드 2자리)
  - `PDNO` (종목코드)
  - `ORD_DVSN` (`00` 지정가, `01` 시장가)
  - `ORD_QTY`, `ORD_UNPR`

### (C) 국내주식 잔고 조회

- Endpoint: `GET /uapi/domestic-stock/v1/trading/inquire-balance`
- TR ID
  - 모의: `VTTC8434R`
  - 실전: `TTTC8434R`
- 주요 Query
  - `CANO`, `ACNT_PRDT_CD`
  - `AFHR_FLPR_YN`, `OFL_YN`, `INQR_DVSN`, `UNPR_DVSN`
  - `FUND_STTL_ICLD_YN`, `FNCG_AMT_AUTO_RDPT_YN`, `PRCS_DVSN`
  - `CTX_AREA_FK100`, `CTX_AREA_NK100`

### (D) WebSocket 실시간

- 접속키 발급: `POST /oauth2/Approval`
- WebSocket URL (샘플 기준)
  - 실전: `ws://ops.koreainvestment.com:21000`
  - 모의: `ws://ops.koreainvestment.com:31000` (legacy 샘플 주석)
- 구독 요청 시 `approval_key`, `tr_id`, `tr_key` 사용

## 4. 응답 데이터 구조

### 공통 응답 형태

```json
{
  "rt_cd": "0|1",
  "msg_cd": "<KIS code>",
  "msg1": "<message>",
  "output": {},
  "output1": [],
  "output2": []
}
```

### 현재가 조회(`inquire-price`) 주요 필드 예시

- `output.stck_prpr`: 현재가
- `output.prdy_vrss`: 전일 대비
- `output.prdy_ctrt`: 전일 대비율
- `output.acml_vol`: 누적 거래량
- `output.acml_tr_pbmn`: 누적 거래대금

### 주문(`order-cash`) 주요 필드 예시

- `output.KRX_FWDG_ORD_ORGNO`: 지점/주문 원번호
- `output.ODNO`: 주문번호
- `output.ORD_TMD`: 주문시각

### 잔고(`inquire-balance`) 주요 필드 예시

- `output1[]`: 종목별 잔고(종목코드, 보유수량, 평균단가 등)
- `output2[]`: 계좌 요약(예수금, 평가금액, 손익 등)

## 5. Rate Limit 정보

- 포털 공지에 `API 호출 유량 안내 (REST, 웹소켓) (2026.02.25 기준)` 존재
- 확인된 제한/신호
  - `EGW00201`: 초당 거래건수 초과
  - `EGW00133`: 접근토큰 발급 잠시후 재시도(1분당 1회)
  - 모의투자 계정이 실전 대비 호출 한도가 더 낮음(공식 샘플/README 주의사항)
  - WebSocket 무한 재연결 시 차단 예정 공지 존재
- 운영 가이드
  - 토큰 캐싱(매 호출 재발급 금지)
  - 요청 큐/스로틀러(token bucket) 적용
  - `EGW00201` 발생 시 backoff + 재시도

## 6. 에러 코드 목록

아래 코드는 KIS 포털 FAQ 오류코드 페이지 및 KIS 커뮤니티/샘플에서 확인된 코드들입니다.

| 코드     | 의미                          |
| -------- | ----------------------------- |
| EGW00001 | 일시적 오류                   |
| EGW00002 | 서버 오류                     |
| EGW00003 | 접근 거부                     |
| EGW00101 | 유효하지 않은 요청            |
| EGW00103 | 유효하지 않은 AppKey          |
| EGW00105 | 유효하지 않은 AppSecret       |
| EGW00121 | 유효하지 않은 token           |
| EGW00123 | 만료된 token                  |
| EGW00132 | 유효하지 않은 Content-Type    |
| EGW00133 | 접근토큰 발급 제한(1분당 1회) |
| EGW00201 | 초당 거래건수 초과            |
| EGW00202 | GW 라우팅 오류                |
| EGW00203 | OPS 라우팅 오류               |
| EGW00206 | API 사용 권한 없음            |
| EGW00208 | 고객유형(custtype) 오류       |

## 7. WebSocket 연결

1. `POST /oauth2/Approval`로 `approval_key` 발급
2. WebSocket 서버 접속(`ops.koreainvestment.com`)
3. 구독 메시지 전송(예: 삼성전자 `005930`)
4. 실시간 체결/호가 수신
5. 주의: 재연결 루프는 백오프 적용(무한 재시도 금지)

## 8. curl 테스트 명령어 모음

### 8.1 auth endpoint 테스트

```bash
curl -X POST "https://openapivts.koreainvestment.com:29443/oauth2/tokenP" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "client_credentials",
    "appkey": "'$KIS_APP_KEY'",
    "appsecret": "'$KIS_APP_SECRET'"
  }'
```

### 8.2 시세조회 테스트(삼성전자 005930)

```bash
curl -X GET "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=005930" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $KIS_ACCESS_TOKEN" \
  -H "appkey: $KIS_APP_KEY" \
  -H "appsecret: $KIS_APP_SECRET" \
  -H "tr_id: FHKST01010100" \
  -H "custtype: P"
```

### 8.3 모의주문 테스트(매수 1주, 지정가)

```bash
curl -X POST "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/trading/order-cash" \
  -H "Content-Type: application/json" \
  -H "authorization: Bearer $KIS_ACCESS_TOKEN" \
  -H "appkey: $KIS_APP_KEY" \
  -H "appsecret: $KIS_APP_SECRET" \
  -H "tr_id: VTTC0802U" \
  -H "custtype: P" \
  -d '{
    "CANO": "'$KIS_CANO'",
    "ACNT_PRDT_CD": "'$KIS_ACNT_PRDT_CD'",
    "PDNO": "005930",
    "ORD_DVSN": "00",
    "ORD_QTY": "1",
    "ORD_UNPR": "70000"
  }'
```

## 9. 주의사항 및 제한사항

- 실제 자금 계좌(실전)로 PoC 테스트 금지
- 토큰을 매 요청마다 재발급하지 말 것(발급 제한 존재)
- 모의투자와 실전은 도메인/키/TR ID가 다를 수 있으므로 분리 관리
- `Transfer-Encoding: chunked` 환경에서 일부 라우팅 오류 사례(EGW00202) 보고됨

### 실전 vs 모의투자 차이

| 구분           | 모의투자                                       | 실전                                       |
| -------------- | ---------------------------------------------- | ------------------------------------------ |
| REST 도메인    | `https://openapivts.koreainvestment.com:29443` | `https://openapi.koreainvestment.com:9443` |
| 목적           | 기능 검증/테스트                               | 실제 매매                                  |
| 호출 한도 체감 | 상대적으로 낮음                                | 상대적으로 높음                            |
| 리스크         | 금전 리스크 없음                               | 실제 주문/손익 발생                        |

## 10. 다음 단계 (Task 3 구현 가이드)

1. Broker 추상화 인터페이스 설계 (`getQuote`, `placeOrder`, `getBalance`, `streamQuotes`)
2. Token manager 분리(캐시 + 선갱신 + 락)
3. Rate limiter(Token Bucket) 도입 및 `EGW00201` 재시도 전략 표준화
4. 에러 코드 분류(재시도/중단/알림) 테이블화
5. 모의투자 통합 테스트 후 실전 스위치(Feature Flag) 연결
