---
type: completion
date: 2026-05-11
device: iMac
agent: 막내1
portfolio: PF_FACTORY
order: ORDER_20260511_iMac쌍아_막내1_에이전트토론방_POC.md
status: 완료
---

# COMPLETION — 에이전트 토론방 웹 UI POC

**[2026-05-11 17:33 KST] iMac/막내1 → 작가님, 쌍아**

## 결과

✅ `apps/debate/index.html` 프론트엔드 동작 — 채팅 UI, 화자별 색상, 설정 패널
✅ `functions/api/debate.js` CF Worker 백엔드 — Workers AI 2모델 바인딩
✅ 자동 토론 3라운드 완주 — 에이전트1(Gemma 3 12B) vs 에이전트2(Qwen 2.5 32B)
✅ 사람 개입 → 자동 중단 + 양 에이전트 응답
✅ localStorage 세션 유지 — 새로고침 후 8메시지 복원 확인

## 산출물

| 파일 | 내용 |
|------|------|
| `functions/api/debate.js` | CF Worker — 턴 로직 + 시스템 프롬프트 + Workers AI 호출 |
| `apps/debate/index.html` | 프론트엔드 — 채팅 UI + 자동 토론 + 사람 개입 + 설정 + localStorage |
| `MONK_kr/debate/index.html` | 로컬 서빙용 복사본 (wrangler pages dev) |

## 검증 결과

| 시나리오 | 결과 |
|----------|------|
| A: 자동 토론 3라운드 | ✅ 주제→에이전트1 입론→에이전트2 반론→…→합의점 정리 |
| B: 사람 개입 | ✅ 자동 중단 + 양 에이전트 사람 질문에 응답 |
| C: localStorage 복원 | ✅ 새로고침 후 8메시지 전량 복원 |

## 이슈

| 이슈 | 원인 | 대응 |
|------|------|------|
| Workers AI 간헐적 500 | 콜드 스타트 타임아웃 | 프론트에 재시도 로직 추가 (2회, 2초 간격) |

## 아키텍처

```
apps/debate/index.html (프론트)
  → POST /api/debate
  → functions/api/debate.js (CF Worker)
    → Workers AI (Gemma 3 12B / Qwen 2.5 32B)
  ← JSON { speaker, message, round, done }
```

💡 프로덕션 배포는 CF Pages push 시 자동 반영 (debate.js는 functions/ 경로)
💡 `MONK_kr/debate/` 폴더는 프로덕션 배포 시 monk.kr/debate/ 에서 접근 가능
