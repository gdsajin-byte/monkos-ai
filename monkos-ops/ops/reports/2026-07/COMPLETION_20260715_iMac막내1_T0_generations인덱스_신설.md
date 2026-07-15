---
type: completion
date: 2026-07-15
device: iMac
agent: 막내1
portfolio: PF_PORTAL
subject: T0 — generations 컬렉션 신설 + saveImages 동시 기록 + GCS 백필
status: 완료
order: ORDER_20260715_iMac쌍아_막내_T0_generations인덱스_신설.md
---

# COMPLETION — T0 generations 인덱스 신설

**[2026-07-15 13:59 KST]** iMac/막내1 → 작가님

---

## 결과

✅ `gcs-save.js` — Firestore `generations` 컬렉션 동시 기록 추가 (GCS 저장 후 인덱스 1건 기록, 실패 시 WARNING 로그만 — 사진 저장 우선)
✅ `server.js:834` — extras에 `sessionId`, `slug` 전달 (1행만 변경)
✅ Firestore 복합 인덱스 생성 (userId ASC + createdAt DESC)
✅ `scripts/backfill-generations.js` — 백필 스크립트 작성 + 실행 완료
✅ 백필 결과: 329건 생성, 622건 스킵 (original.jpg 아닌 파일), 에러 0건
✅ dev 배포 (rev 00128-9hm) 성공
✅ prod 배포 (rev 00479-rf4) 성공

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/gcs-save.js` | firestore import + gensCol + generations 동시 기록 |
| `monkos_AI/portal/server.js:834` | extras에 sessionId, slug 전달 (1행) |
| `monkos_AI/portal/scripts/backfill-generations.js` | 신규 — GCS 백필 스크립트 |

## 배포

- dev: `monkos-portal-dev` rev 00128-9hm
- prod: `monkos-portal` rev 00479-rf4

## 준수 조항 확인

1. ✅ gcs-save.js 내부 한정 — server.js는 extras 전달 1행만
2. ✅ 비로그인 처리 — `specs-visitor` → `anonymous_{sessionId}`
3. ✅ generations 기록 실패는 GCS 저장 비차단 — try-catch WARNING
4. ✅ Firestore 직접 접근 — 서비스 코드 내 접근 (ch4 10조 6항 부합)
5. ✅ deploy.sh prod 경유 배포

## Firestore 인덱스

```
컬렉션: generations
필드: userId (ASC) + createdAt (DESC)
상태: READY
```

## 백필 상세

- 버킷: monk-customer-photos
- 총 파일: 1,929개
- _original.jpg: 329건 → generations 생성
- 중복/비대상: 622건 스킵
- 에러: 0건
