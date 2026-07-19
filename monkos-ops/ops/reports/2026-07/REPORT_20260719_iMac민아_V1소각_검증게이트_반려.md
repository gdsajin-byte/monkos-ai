---
type: report
date: 2026-07-19
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# 검증 게이트 보고 — V1 소각+유색 개방 (스포크 ①) : **반려 (P0 1건)**

**[2026-07-19 12:28 KST]** iMac/민아 → 작가님, iMac/쌍아

> 대상: 막내1 f8d392b5(V1 소각+유색 게이트 개방, prod 00511-rwd) + 막내2 022633bd(kw·om 배경 검증·교정)
> 방법: 코드 정밀 리뷰 + prod 라이브 6페이지 기계 판정(curl) + 실브라우저 업로드 실주행(DataTransfer 주입) + jest 재실행

## 판정 요약

| 게이트 항목 | 결과 |
|------|------|
| 6페이지 V2 서빙 (V1 잔존 0) | ✅ 전 페이지 v2 퍼널 마크업 + `v2-file-input` 존재 |
| 게이트 코드 A1 (유색 제외 삭제) | ✅ 잔존 조건 = 파싱불가·가로형만 |
| T1 유색 비노출 (A5) | ✅ kw·om·id 비노출, kr 대조군 노출 |
| jest | ✅ 105/105 (npm test 정본 스크립트 재확인) |
| **업로드 실작동** | ❌ **P0 — 개방 6페이지 전원 업로드 후 무반응 (하단 상술)** |
| 유색 T0 생성 실측 | ❌ P0에 막혀 생성 단계 도달 불가 |

## P0 — specs-funnel.js 초기 평가 크래시로 개방 페이지 전원 퍼널 사망

- **원인**: `public/js/specs-funnel.js:520` — `document.getElementById('ip-t1-buy').addEventListener(...)`가 **무조건 실행**. 유색 페이지는 A5 게이팅으로 T1 카드 마크업이 통째로 제거되어(`spec-funnel-markup.js:176` `${isColoredBg ? '' : ...}`) `ip-t1-buy`가 없음 → `null.addEventListener` TypeError → **스크립트 초기 평가가 520행에서 중단** → 그 아래 전체(`fitTimers` 초기화 536행·안착 시어터·생성·결제 로직) 미평가.
- **증상**: 사진 선택 → precheck까지 진행 → `prepareFreeReady→fitClearTimers`에서 `undefined.forEach` TypeError(콘솔 `[precheck-catch]`) → **화면 무반응**. V1 데드 UI와 동일한 사용자 체감이 V2에서 재현.
- **실증** (prod 00511-rwd, 실브라우저 DataTransfer 주입):
  - kw-visa: `ip-t1-buy` 부재 확인 → 업로드 후 무반응 + 콘솔 TypeError ❌
  - cn-resume: T1 카드 자체 부재(soon-card도 없음 — 별도 분기 추정) → 동일 무반응, `v2-phase-upload` 고착 ❌
  - kr-passport 대조군: `ip-t1-buy` 존재 → 동일 주입으로 `v2-phase-fit`(안착 시어터) 정상 진입 ✅
- **범위**: 개방 대상 6페이지 전원 (kw-passport·kw-visa·om-passport·om-visa·id-passport·cn-resume). GSC 상위 랭킹(om-visa ko 1위·kw-visa ko 3위 등) 자리가 여전히 전환 0 구조 — **스포크 ①의 목적 미달성 상태**.
- **처방**: JS 측 방어가 정본 — `ip-t1-buy` null 가드 (`var el=document.getElementById('ip-t1-buy'); if(el) el.addEventListener(...)`). 마크업 쪽 복원(disabled soon-card 부활)보다 JS 가드가 cn-resume류 별도 분기까지 일괄 커버. 수정 → 재배포 → 민아 재검증(동일 절차).

## P1 — 2건

1. **isV2Spec 게이트 사문화**: `render-specs.js:382` 정의만 남고 **호출부 0** — A1 명세의 잔존 게이트(파싱불가·가로형)가 실효 상실. 현재 실피해는 cn-resume 1건(전 428슬러그 중 게이트 탈락 유일): size `1寸 · 2寸` 파싱불가 + pixels 필드가 mm 값(`25×35 / 35×49 mm`, px 단위 없어 parsePixels null) → `getSpecCropParams=null` → 크롭 미적용 → **Gemini 무규격 출고 경로**. "규격 위반 결과물을 규격 적합으로 안내 금지" 원칙 위반 소지 — P0 수정 시 cn-resume 퍼널이 살아나므로 **동시 처리 필요** (A2 조기 실행 또는 cn-resume 한정 퍼널 게이트 재배선).
2. **om-passport 교정 미배포**: 022633bd(파랑→흰색, grade A)가 00511-rwd 빌드 **이후** 커밋이라 라이브는 여전히 "파란색". P0 수정 재배포에 자연 편승 — 별도 배포 불요. 재배포 후 om-passport는 흰색 판정 → T1 카드 노출로 전환됨(게이트 로직상 올바른 동작).

## P2 — 2건 (차기 정리)

- `render-specs.js:362~366` 스테일 주석 — 구 게이트 설명("v1 유지·배경 흰색만·비율 1.15")이 현행 코드와 불일치.
- `spec-funnel-markup.js:176` `${isColoredBg ? '' : showT1 ? ...}` — `showT1`이 이미 `!isColoredBg` 포함, 이중 가드 (기능 무해).

## 막내2 검증분 소견 (스포크 ②) — 통과

- 안전 조항 준수 확인: 미확정 kw-visa·om-visa **데이터 무접촉** ✅. 교정은 om-passport 1건만, 4개 언어+officialSource+grade 정합 ✅ (countries.jsonl 2본 동시 갱신 포함).
- 소견: om 근거가 발급기관(ROP)이 아닌 외무부 대사관 페이지(fm.gov.om) — 공식 도메인이며 4개 서비스 일관 "white"라 교정 타당하나, CDP 재시도 시 **ROP 원문 재확인을 C0 후속에 포함 권고** (구 officialSource였던 rop.gov.om은 색상 무언급 확인됨).

## 다음 단계 (작가님 결정)

1. **P0+P1 동시 수정 재투입** — 막내1 재투입(수정 2점: funnel JS null 가드 + cn-resume 게이트 처리) 후 재배포. om 교정 편승. → 민아 재검증.
2. 수정 규모가 경미(가드 1줄+α)하므로 ③항 준용 민아 직접 핫픽스도 가능 — 작가님 지시 시.
