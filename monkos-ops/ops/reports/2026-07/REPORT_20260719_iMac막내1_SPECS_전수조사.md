---
type: report
date: 2026-07-19
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 마감
---

# REPORT: specs 전수조사 — 서빙 버전·이미지 정합·텍스트 모순·데드 UI 계보·재색인 목록

**[2026-07-19 12:52 KST]** iMac/막내1 → 작가님

지시서 `ORDER_20260719_iMac쌍아_막내1_SPECS_전수조사.md` 결과.

---

## C1. 서빙 버전 전수 — V1 잔존 확인

| 항목 | 결과 |
|------|------|
| 총 슬러그 | 428 |
| V2 서빙 | 427 |
| V1 잔존 (의도적 제외) | 1 — cn-resume (size 복수 규격, 파싱 불가) |

**결론**: V1 잔존 = cn-resume 1건만. 의도적 제외이며 404 반환으로 안전 처리됨. 이상 없음.

---

## C2. 이미지-배경 모순 전수

비백색 배경 슬러그 20건 전수 점검:

| 카테고리 | 건수 | 슬러그 |
|----------|------|--------|
| 전용 가이드 이미지 없음 (범용 도해 폴백) | 20 | id-passport, kw-passport, kw-visa, om-visa, kz-passport/visa, de-passport/visa, ch-passport/visa, at-passport/visa, dk-passport/visa, gr-passport/visa, nz-passport/visa, usa-headshot, eu-resume |
| 이미지-배경 모순 | **0** | — |

**결론**: 유색/회색 슬러그 전부 전용 이미지 미존재 → 범용 사이즈별 도해(흰 배경) 폴백 사용 중. 이미지 색상과 규정 배경이 시각적으로 불일치하지만 이는 "전용 이미지 미제작" 이슈이며 데이터 모순은 아님.

---

## B3. 텍스트-배경 모순 스캔

유색 배경 5슬러그(id-passport, kw-passport, kw-visa, om-visa, cn-resume) 대상:

| 슬러그 | 필드 | 모순 문구 |
|--------|------|-----------|
| cn-resume | seoDescription[ko] | "흰색·파란 배경" |
| cn-resume | faqs[ko] ×3 | "흰색·파란 배경" |

**결론**: 모순 4건 전부 cn-resume (V2 제외 슬러그, 404 반환). 실 서빙 유색 V2 슬러그(kw, om, id)에서는 모순 **0건**. 교정 불요.

---

## C3. 데드 UI 계보 타임라인

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-04-25 | 5bead904 | render-specs.js 생성. V1 상세 페이지에 "규격 맞춤 도구" 섹션 포함 (before/after 정적 이미지, `input[type=file]` 없음, JS 배선 없음) |
| 2026-06-25 | 94cfa044 | specs V2 P1 — kr-passport에 실 업로드 퍼널 도입. V1은 이 시점부터 "퍼널 미동작" 데드 UI 확정 |
| 2026-07-11 | 68d4ef5d | isPilot 폐지 + T0 전면 개방. V2 커버리지 확대, V1 잔존은 엔진 비호환 + 유색 슬러그만 |
| 2026-07-18 | 4bffb9a9 | 회색 33슬러그 V2 개방. V1 잔존 = 유색 5건만 |
| 2026-07-19 | f8d392b5 | **V1 완전 소각** — 유색 게이트 삭제 + V1 본문 360줄 삭제 |

**데드 기간**: 2026-06-25 ~ 2026-07-19 = **24일간** V1 "업로드 도구" 섹션이 정적 마크업으로 잔존 (실동작 없음).

---

## C4. 재색인 대상 URL 목록

V1→V2 전환된 4슬러그 × 4언어 = **16건** (cn-resume는 404이므로 제외):

```
https://monkos.ai/specs/passport/id
https://monkos.ai/en/specs/passport/id
https://monkos.ai/ja/specs/passport/id
https://monkos.ai/es/specs/passport/id
https://monkos.ai/specs/passport/kw
https://monkos.ai/en/specs/passport/kw
https://monkos.ai/ja/specs/passport/kw
https://monkos.ai/es/specs/passport/kw
https://monkos.ai/specs/visa/kw
https://monkos.ai/en/specs/visa/kw
https://monkos.ai/ja/specs/visa/kw
https://monkos.ai/es/specs/visa/kw
https://monkos.ai/specs/visa/om
https://monkos.ai/en/specs/visa/om
https://monkos.ai/ja/specs/visa/om
https://monkos.ai/es/specs/visa/om
```

---

## C0 CDP. 배경색 원문 확보 — 결과

| 포털 | 결과 |
|------|------|
| evisa.moi.gov.kw (쿠웨이트) | WebFetch 실패 — 리다이렉트 헤더 없음 (JS SPA). CDP 미시도 (Chrome 세션 미활성). |
| evisa.rop.gov.om (오만) | WebFetch 접근 성공하나 메인 페이지에 사진 규격 정보 미기재. 사진 업로드 단계 진입 필요(인증 필수 추정). |

**결론**: 두 포털 모두 WebFetch로 배경색 원문 확보 실패. 수동 확인 필요 (브라우저에서 eVisa 신청 진행 중 사진 업로드 단계에서 확인 가능할 것으로 추정). 데이터 교정은 보류.

---

## 종합

| 항목 | 결과 | 조치 필요 |
|------|------|-----------|
| C1 V1 잔존 | cn-resume 1건 (의도적) | 불요 |
| C2 이미지-배경 | 모순 0건 (전용 이미지 미존재 20건) | 전용 이미지 제작 시 고려 |
| B3 텍스트-배경 | cn-resume 4건 (비서빙) | 불요 |
| C3 데드 UI | 06-25~07-19 24일 잔존 | 소각 완료 |
| C4 재색인 | 16 URL | 작가님 원탭 실행 대기 |
| C0 CDP | 확보 실패 | 수동 확인 필요 |
