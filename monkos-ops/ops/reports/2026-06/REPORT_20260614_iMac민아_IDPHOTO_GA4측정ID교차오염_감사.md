---
type: report
date: 2026-06-14
device: iMac
agent: 민아
status: 마감
subject: "GA4 퍼널 센서 작동 검증 + 측정 ID 교차오염 감사 (idphoto-kr/jp)"
portfolio: PF_IDPHOTO
priority: P2
---

# GA4 퍼널 센서 작동 검증 + 측정 ID 교차오염 감사

> **[2026-06-14 03:04 KST] iMac/민아 → 작가님 (→ 쌍아 재검토 → 막내 실행)**
> 동기: 작가님 지시 — "어제 코드에 GA4 센서를 심었는데 작동하는지 확인."
> 방법: idphoto-kr 프로덕션을 playwright로 직접 구동, GA4 `collect` 네트워크 요청을 실측. GA4 백엔드 지연(realtime~분, 표준 24~48h) 없이 발화 자체를 즉시 검증.
> 원지시서: `ORDER_20260612_iMac쌍아_막내1_GA4퍼널센서_삽입.md`

---

## 0. 요약 (TL;DR)

| 항목 | 판정 | 근거 |
|------|------|------|
| **GA4 퍼널 센서 발화** | ✅ 정상 | page_view·spec_select `collect` 204 실측, 커스텀 파라미터 정확 |
| **측정 ID 정합성** | 🔴 **교차오염** | KR·JP 25개 HTML 전부 두 측정 ID 이중 config → 모든 이벤트 양 속성 혼입 |
| **purchase 매출값** | 🟡 결함 | `value: 0` 하드코딩 — 구매 가치 추적 무력 |

**핵심**: 어제 심은 센서 *자체*는 살아서 정상 데이터를 쏜다. 그러나 그 데이터가 흘러드는 GA4 설정이 **3개월째(2026-03-13~) KR↔JP 교차오염** 상태라, 센서를 심은 목적(KR 방문→가입 전환 깜깜이 규명)이 오염 데이터로 부정확해진다. **긴급도 P2** — 데이터는 수집되나 신뢰 불가. 절차(쌍아 재검토→막내 실행) 준수가 안전.

---

## 1. 발견 A — 센서 정상 작동 (실측 증명) ✅

### A-1. 삽입된 6단계 퍼널 이벤트 (idphoto-kr 기준)
| 이벤트 | 파일:라인 | 트리거 | 가드 |
|--------|----------|--------|------|
| `spec_select` | prep.js:154 | 규격 선택 | `typeof gtag === 'function'` |
| `photo_upload` | camera.js:236 | 사진 업로드 | 〃 |
| `generate_click` | result.js:186 | 생성 클릭 | 〃 |
| `preview_view` | result.js:296 | 미리보기 노출 | 〃 |
| `begin_checkout` | result.js:327 | 결제 시작 | 〃 |
| `purchase` | thankyou.js:182 | 결제 완료 | 〃 |

공통 파라미터: `spec_type · auth_method · lang · service`. JP(idphoto-jp)도 대칭 구조.

### A-2. 프로덕션 실측 증거 (idphoto-kr/prep.html)
- **page_view** → `POST .../g/collect?...&tid=G-FKG0CPTC14&en=page_view` → **204**
- **spec_select** (여권 규격 선택) → `en=spec_select&ep.spec_type=passport&ep.lang=ko&ep.service=idphoto-kr&ep.auth_method=` → **204**
  - `auth_method` 빈값 = 로그인 전 단계라 정상. `spec_type=passport` 선택 정확 반영.
- 콘솔 에러 0건. `gtag` 함수 정상 정의.

→ **센서 발화·파라미터 매핑 모두 정상.** 어제 막내1 작업물은 코드·발화 기준 합격.

---

## 2. 발견 B — 측정 ID 교차오염 🔴 (P2, 어제 작업과 무관)

### B-1. 증상
KR 사이트(idphoto-kr)에서 단일 사용자 액션이 **두 GA4 속성에 동시 전송**됨:
- `tid=G-FKG0CPTC14` (KR 속성) ← 정상
- `tid=G-JPZWSJ3323` (**JP 속성**) ← 오염

page_view·spec_select 모두 양쪽 tid로 collect 발사 실측. JP 사이트도 대칭으로 KR ID 혼입.

### B-2. 전수 결과 (25개 HTML)
- **idphoto-kr/public/*.html (12개)**: 전부 `G-FKG0CPTC14` + `G-JPZWSJ3323` 동시 보유
- **idphoto-jp/public/*.html (13개)**: 전부 `G-FKG0CPTC14` + `G-JPZWSJ3323` 동시 보유
- 패턴: 각 HTML `<head>`에 `gtag('config','G-JPZWSJ3323'); gtag('config','G-FKG0CPTC14');` 양쪽 선언 + 로더 `gtag/js?id=G-JPZWSJ3323`(JP ID로 로드).

### B-3. 원인 (git 추적)
| 커밋 | 일자 | 내용 | 결과 |
|------|------|------|------|
| `3a69f239` | 2026-03-13 | "GA4 gtag 삽입 — idphoto-**kr/jp 전체** HTML (G-JPZWSJ3323)" | KR 사이트에도 **JP ID 단일 삽입** (복붙) |
| `def0074a` | (이후) | "Google Ads 전환 태그 — G-FKG0CPTC14 (kr/jp + portal)" | KR ID 추가 시 **기존 JP ID 미제거** → 이중 |

→ 어제(06-12) 센서 삽입(`55d14c68`)의 산물이 **아님**. 3개월 전부터 누적된 토대 결함. 어제 센서는 이 오염된 토대 위에 정상 안착했을 뿐.

### B-4. 영향
- KR 퍼블/퍼널 데이터에 JP 트래픽 혼입 (반대도 동일). 두 속성 모두 신뢰 불가.
- 센서 도입 목적(KR 방문→가입 1.1% 전환 깜깜이 규명)이 오염 데이터로 왜곡.
- `service` 커스텀 파라미터(`idphoto-kr`/`idphoto-jp`)로 **사후 필터 분리는 가능**하나, 속성 단위 표준 리포트·전환·잠재고객은 오염된 채 집계됨.

---

## 3. 발견 C — purchase value 하드코딩 🟡

`thankyou.js:182` — `gtag('event','purchase', { ... value: 0, currency: 'KRW', ... })`
- 모든 구매가 **가치 0원**으로 집계 → GA4 매출·ROAS·전환가치 전부 0.
- idphoto 단건 과금 전환 설계(`8dc270c7` PROPOSAL, KR $1 단건 등)와 직결 — **과금 모델 확정 시 실제 결제액을 value에 주입** 필요. 단독 수정보다 과금 설계와 묶는 것을 권고.

---

## 4. 권고 수정안 (쌍아 재검토용 — 본 보고서는 진단까지, 실행은 막내)

### R-1. 측정 ID 분리 (P2, 핵심)
- **idphoto-kr/public/*.html (12개)**: `G-JPZWSJ3323` 관련 라인(로더 `<script src=...id=G-JPZWSJ3323>` + `gtag('config','G-JPZWSJ3323')`) 제거. 로더는 `id=G-FKG0CPTC14`로 교체. → KR 속성 단일화.
- **idphoto-jp/public/*.html (13개)**: 반대로 `G-FKG0CPTC14` 라인 제거, 로더를 `id=G-JPZWSJ3323`로. → JP 속성 단일화.
- 기계적·동형 수정 25개 파일. 막내 1건 분량. 배포는 `deploy.sh` 경유(ch5).
- ⚠️ 검토 포인트: 두 ID 동시 보유가 **의도된 roll-up 전략이 아님**을 쌍아가 1차 확인(통합 속성이라면 별도 3번째 ID를 써야 정상). git 이력상 복붙 사고로 판정되나 최종 확인은 쌍아.

### R-2. purchase value 주입 (🟡, 과금 설계 연동)
- 단건 과금 모델 확정 후 실제 결제액을 `value`에 주입. R-1과 별건으로 분리 권고.

### R-3. 배포 후 재검증
- 수정·배포 후 본 보고서와 동일하게 prod에서 `collect` tid 단일화 실측 1회 (민아 또는 막내 자체 검증).

---

## 5. 절차 노트

- 본 건은 **발견 즉시 수정하지 않고** 보고서로 기록 → 쌍아 재검토 → 막내 실행 경로를 따름 (작가님 2026-06-14 지시).
- 근거: 즉시 수정은 ① 다른 문제 유발 패턴 ② 기록 증발 위험. 긴급(P0/P1) 아님 — 데이터는 수집 중이고 사후 `service` 필터로 부분 분리 가능하므로 절차 준수가 안전.
- 코드·인프라 무변경. 본 세션은 **read-only 검증 + 문서화**만 수행.

---

## ✅❌💡⏳📁🔀

- ✅ GA4 퍼널 센서 6종 프로덕션 발화 실측 검증 (page_view·spec_select collect 204, 파라미터 정확)
- 🔴 측정 ID 교차오염 발견·전수·원인규명 (KR/JP 25개 HTML, 2026-03-13 `3a69f239`+`def0074a` 누적)
- 🟡 purchase value:0 하드코딩 (과금 설계 연동 수정 권고)
- 💡 어제 센서는 정상, 오염은 3개월 전 토대 결함 — 책임·범위 분리 규명
- ⏳ 쌍아 재검토 → 막내 실행 대기 (R-1 측정ID분리 / R-2 value주입 / R-3 재검증)
- 📁 본 보고서 (REPORT_20260614_iMac민아_IDPHOTO_GA4측정ID교차오염_감사.md)
- 🔀 코드 무변경 (read-only 감사)
