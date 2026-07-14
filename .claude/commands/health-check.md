---
name: 헬스체크
description: 전 서비스 상태를 점검하고 이상 여부를 보고한다
allowed-tools:
  - Bash(curl *)
  - Bash(monkos-ops/scripts/runpod_balance_check.sh *)
---

## 서비스 헬스체크

!`curl -s -o /dev/null -w "%{http_code}" https://monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://image.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://idphoto-kr.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://idphoto-jp.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://studio.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://monk.kr/ 2>/dev/null`

## RunPod 잔액 (matte 서빙 — 선불 충전제)

!`monkos-ops/scripts/runpod_balance_check.sh --check-only 2>/dev/null`

## 판정 기준

| 코드 | 판정 |
|------|------|
| 200 | ✅ 정상 |
| 그 외 | ❌ 이상 — 상세 확인 필요 |

RunPod 잔액은 스크립트 출력의 ✅/🚨 판정을 따른다 (임계값 $2 — 미만 시 matte 서빙 Gemini 폴백 임박).

위 결과를 테이블로 종합 보고한다. 이상 서비스가 있으면 Cloud Run 로그 확인을 권고한다. RunPod 잔액 부족 시 https://console.runpod.io/user/billing 충전을 권고한다.
