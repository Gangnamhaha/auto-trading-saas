# AutoTrade KR 운영 런북

## 1. 트레이딩 엔진 장애 대응

### 증상

- /api/health 응답에서 trading_engine: "disconnected"
- 사용자 자동매매 중단 알림 급증

### 대응 절차

1. AWS ECS 콘솔 -> autotrading-engine 태스크 상태 확인
2. CloudWatch 로그 확인: `/ecs/autotrading-engine`
3. 태스크 재시작: `aws ecs update-service --force-new-deployment`
4. 재시작 후 /api/health 확인
5. 사용자 공지 (상태 페이지 업데이트)

### 예방

- ECS 자동 재시작 설정 (desiredCount=1, 장애 시 자동 교체)
- 헬스체크 30초 간격

## 2. DB 복원 절차

### RDS Point-in-Time Recovery

1. AWS RDS 콘솔 -> 인스턴스 선택
2. "Restore to point in time" 클릭
3. 복원 시점 선택 (최대 35일 이내)
4. 새 인스턴스 생성 후 DNS 업데이트
5. 목표: 10분 이내 복원

## 3. 배포 절차

### 웹 앱 (Vercel)

- main 브랜치 push -> 자동 배포
- 롤백: Vercel 대시보드 -> 이전 배포 선택 -> Promote

### 트레이딩 엔진 (AWS ECS)

```bash
# 새 이미지 빌드 + 푸시
docker build -f deploy/Dockerfile.engine -t trading-engine .
docker tag trading-engine:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# ECS 서비스 업데이트
aws ecs update-service --cluster autotrading --service trading-engine --force-new-deployment
```

## 4. 긴급 연락처

- 개발자: [이름] / [연락처]
- AWS 지원: [지원 플랜 링크]
- 토스페이먼츠 긴급: 1588-xxxx
