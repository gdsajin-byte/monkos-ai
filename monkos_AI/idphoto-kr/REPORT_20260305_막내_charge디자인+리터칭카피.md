# 완료 보고서 — charge 디자인 + 리터칭 카피

**[2026-03-05 09:33 KST] M1/막내1 → M1/쌍아**

---

## 지시서

`ORDER_20260305_M1쌍아_막내_charge디자인+리터칭카피.md`

---

## Phase A: charge.html 디자인 리뉴얼 ✅

| 항목 | 결과 |
|------|------|
| "현재 잔액" 카드 | 제거 완료 |
| 가격 칩 바 | `1장 = 리터칭 10c + 다운로드 70c = 80c` 추가 (B-1 겸용) |
| 와이드 카드 레이아웃 | 좌측=크레딧 정보(1.5rem/800), 우측=가격 블록(그라디언트 라운드) |
| 섹션 라벨 | "1장 완성" (첫 카드 위), "패키지" (두 번째 카드 위) |
| BEST 뱃지 | 500c 카드로 이동 |
| hidden radio | 추가 완료 |
| 푸터 | 추가 완료 |

---

## Phase B: 카피 교체 ✅

| # | 파일 | 변경 내용 | 상태 |
|---|------|----------|------|
| B-1 | charge.html | Phase A에서 "리터칭" 반영 (가격 칩) | ✅ |
| B-2 | index.html | 5건 — "첫 로그인", "리터칭" 교체 | ✅ |
| B-3 | shared.js | 2건 — 크레딧 부족 메시지 "리터칭" | ✅ |
| B-4 | config.js | 4건 — TX.step3/generating/genLoading/genFail | ✅ |
| B-5 | result.html | 1건 — "이 사진으로 리터칭" | ✅ |
| B-6 | result.js | 2건 — "리터칭 시작", "리터칭 실패" | ✅ |
| B-7 | credits.html | 2건 — "리터칭 10c", "첫 로그인 10c 증정" | ✅ |

---

## 검증 grep 결과

| 패턴 | 기대 | 결과 | 비고 |
|------|------|------|------|
| `생성 10c` | 0건 | **2건** (스코프 외) | credits.test.js (테스트 설명), seed_cs_knowledge.js (CS 시드) |
| `가입 시 10c\|가입 즉시` | 0건 | 0건 ✅ | |
| `생성에 크레딧\|생성하려면` | 0건 | **1건** (스코프 외) | `_legacy_spa/index.html` (레거시 SPA) |
| `AI 생성.*체험` | 0건 | 0건 ✅ | |

**스코프 내 7개 파일: 4패턴 모두 0건 — 완전 클리어**

---

## 스코프 외 잔존 (쌍아 검토 요청)

| 파일 | 위치 | 내용 | 비고 |
|------|------|------|------|
| `portal/__tests__/credits.test.js` | L70 | `'생성 10c + 다운로드 70c'` | 테스트 설명문 |
| `portal/seed_cs_knowledge.js` | L18 | `'생성 10c + 다운로드 70c'` | CS 챗봇 시드 데이터 |
| `idphoto-kr/public/_legacy_spa/index.html` | L1238,1242 | `'생성에 크레딧'`, `'생성하려면'` | 레거시 (미사용 추정) |

→ 지시서 스코프(7개 파일)에 포함되지 않아 미수정. 별도 지시 필요 시 대기.

---

## 변경 파일 목록 (7개)

```
monkos_AI/idphoto-kr/public/charge.html    — Phase A 전면 리뉴얼
monkos_AI/idphoto-kr/public/index.html     — B-2 카피 5건
monkos_AI/idphoto-kr/public/shared.js      — B-3 카피 2건
monkos_AI/idphoto-kr/public/config.js      — B-4 TX 4건
monkos_AI/idphoto-kr/public/result.html    — B-5 카피 1건
monkos_AI/idphoto-kr/public/result.js      — B-6 카피 2건
monkos_AI/portal/public/credits.html       — B-7 카피 2건
```

---

## 💡 참고

- charge.html의 BEST 뱃지는 지시서대로 **500c 카드**에 배치
- modules/charge.js(모달)의 BEST는 현재 300c — 지시서에서 "모달 디자인은 별도"로 스코프 제외
- 코드 내부 식별자(`generate`, `confirmAndGenerate`, `CREDIT_COST.generate` 등)는 지시서 준수하여 미변경
