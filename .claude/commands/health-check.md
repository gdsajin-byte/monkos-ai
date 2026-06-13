---
name: 헬스체크
description: 전 서비스 상태를 점검하고 이상 여부를 보고한다
allowed-tools:
  - Bash(curl *)
---

## 서비스 헬스체크

!`curl -s -o /dev/null -w "%{http_code}" https://monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://image.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://idphoto-kr.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://idphoto-jp.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://studio.monkos.ai/health 2>/dev/null`
!`curl -s -o /dev/null -w "%{http_code}" https://monk.kr/ 2>/dev/null`

## 판정 기준

| 코드 | 판정 |
|------|------|
| 200 | ✅ 정상 |
| 그 외 | ❌ 이상 — 상세 확인 필요 |

위 결과를 테이블로 종합 보고한다. 이상 서비스가 있으면 Cloud Run 로그 확인을 권고한다.
