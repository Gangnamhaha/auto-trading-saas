#!/bin/bash

echo "=== AutoTrade KR 보안 감사 ==="
PASS=0
FAIL=0

echo "1. API 키 평문 노출 검사..."
if grep -rn "appkey\|appsecret\|access_token" packages/ --include="*.log" 2>/dev/null | grep -v "****" | grep -q .; then
  echo "  FAIL: 로그에 평문 API 키 발견"
  FAIL=$((FAIL+1))
else
  echo "  PASS: 로그에 평문 API 키 없음"
  PASS=$((PASS+1))
fi

echo "2. 하드코딩된 시크릿 검사..."
if grep -rn "password.*=.*['\"][^'\"]\{8,\}['\"]" packages/*/src --include="*.ts" | grep -v "test\|spec\|mock\|example\|placeholder" | grep -q .; then
  echo "  WARN: 하드코딩된 비밀번호 패턴 발견 (검토 필요)"
else
  echo "  PASS: 하드코딩된 시크릿 없음"
  PASS=$((PASS+1))
fi

echo "3. console.log 민감 정보 검사..."
if grep -rn "console.log.*password\|console.log.*token\|console.log.*secret" packages/*/src --include="*.ts" | grep -v "test\|spec" | grep -q .; then
  echo "  FAIL: console.log에 민감 정보 출력"
  FAIL=$((FAIL+1))
else
  echo "  PASS: console.log 민감 정보 없음"
  PASS=$((PASS+1))
fi

echo "4. 암호화 모듈 확인..."
if [ -f "packages/shared/src/crypto/encryption.ts" ]; then
  echo "  PASS: AES-256-GCM 암호화 모듈 존재"
  PASS=$((PASS+1))
else
  echo "  FAIL: 암호화 모듈 없음"
  FAIL=$((FAIL+1))
fi

echo "5. 면책 고지 확인..."
if grep -rn "투자 원금 손실\|원금 손실" packages/web/src --include="*.tsx" | grep -q .; then
  echo "  PASS: 면책 고지 텍스트 존재"
  PASS=$((PASS+1))
else
  echo "  FAIL: 면책 고지 텍스트 없음"
  FAIL=$((FAIL+1))
fi

echo "6. TypeScript strict mode 확인..."
if grep -rn '"strict": true' packages/*/tsconfig.json | grep -q .; then
  echo "  PASS: TypeScript strict mode 활성화"
  PASS=$((PASS+1))
else
  echo "  WARN: TypeScript strict mode 미확인"
fi

echo ""
echo "=== 감사 결과: PASS $PASS / FAIL $FAIL ==="
[ $FAIL -eq 0 ] && echo "✅ 보안 감사 통과" || echo "❌ 보안 이슈 발견 — 수정 필요"
exit $FAIL
