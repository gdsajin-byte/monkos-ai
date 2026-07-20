---
type: report
date: 2026-07-20
device: iMac
agent: 민아
status: 제출
---

# REPORT — PF 축 정렬 감사: 활성 26개 가배속 + 휴면 선별 + 정합 결함

**[2026-07-20 15:01 KST]** iMac/민아 → 작가님, iMac/쌍아

> 발단: 작가님 PF 추렴 방향(7/20 오전) + 감사 착수 지시(15:00). 성격: **읽기 전용 실측** — 재편(병합·상태 변경·리다이렉트)은 본 보고서 범위 밖, 쌍아+작가님 결정 사안.
> 데이터: 전 PF README frontmatter status + 히스토리 최종 활동일 + 행수 실측 (2026-07-20 15:01 기준).

## 1. 축 정의 — 5축 가배속안

기존 메타 PF를 축 정본으로 공인하는 방식 (신규 PF 생성 0건):

| 축 | 정본(메타 PF) | 역할 |
|---|---|---|
| **A. IDPASS** | PF_IDPHOTO | 증명사진 서비스 본체 — 오늘 승인된 척추 프레임의 집 |
| **B. 포털·콘텐츠·마케팅** | PF_OPUS | 콘텐츠 플라이휠 통괄 (기정의 "메타(통괄)") |
| **C. 인프라** | PF_AUTOPILOT | 접착 레이어 — 흡수 실적 2건(SECURITY·BRIEF) 기보유 |
| **D. 서비스 진화** | PF_STYLER | 증명사진→헤드샷→모델스→커머스 로드맵 (기정의 "메타(서비스)") |
| **E. 사업/제휴** | PF_PARTNER | B2B 채널 — 오늘 논의된 납품 라인의 귀속 후보 |

## 2. 가배속 표 (활성 26 + draft 2)

| PF | 최종 활동 | 축 | 판정 | 비고 |
|----|---------|---|------|------|
| IDPHOTO | 6/19 | **A 정본** | 유지 | 오늘 흡수 결정의 집행 PF — 활동 재개 예정 |
| CROP | 7/12 | A | 유지 | ⚠️ **704줄 — 아카이브 트리거 초과** (ch4 9조) |
| STUDIO | 6/17 | A | 유지 | 카메라 모듈 이식(오늘 결정 ②)의 실행처 |
| SPECS | 7/20 | A | 유지 | B축 이중 접점(SEO 자산) — 귀속 A, 접점 표기 |
| PORTAL | 7/16 | **B** | 유지 | |
| CITADEL | 7/19 | B | 유지 | 487줄 — 트리거 근접 |
| SPREAD | 7/15 | B | 유지 | ⚠️ **522줄 — 아카이브 트리거 초과** |
| KKU | 7/8 | B | 유지 | |
| OPUS | 7/19 | **B 정본** | 유지 | frontmatter `status:"active"` 따옴표 이형 — 소소 보정 |
| EVENT | **4/22** | B | 🟡 paused 후보 | 3개월 무활동. 단 재점화 결정(TODO#1)과 연동 — completed 아닌 paused |
| MUSE | **5/14** | B | 🟡 paused 후보 | 2개월 무활동 |
| PRESENTATION | **5/17** | B | 🟡 paused 후보 | 〃 |
| VIDEO | **5/17** | B | 🟡 paused 후보 | 〃 |
| AUTOPILOT | 7/12 | **C 정본** | 유지 | |
| CDP | 7/19 | C | 유지 | 오늘 사본 정리 완료 |
| RETRIEVAL | 7/20 | C | 유지 | |
| INFRA | 7/15 | C | 유지 | |
| CHATBOT | **6/2** | C | 🟡 관찰 | 6주 무활동 — 챗봇 서비스는 라이브, PF만 정체 |
| DOCS | **5/6** | C | 🟡 paused 후보 | 2.5개월 무활동 |
| IMAGE_PRO | **6/6** | C | 유지(관찰) | "공작기계" 엔진 — 인프라성. 6주 무활동 |
| MONK_OS | 7/16 | C | 유지 | Agent OS 로드맵 — C축 내 메타 성격 표기 |
| FACTORY | 6/10 | C | draft 유지 | 4060 야간 생산 — VTON과 연동 대기 |
| STYLER | 7/12 | **D 정본** | 유지 | |
| VTON | 6/1 | D | 유지(관찰) | 4060 트랙 |
| PROFILES | 6/22 | D | 🟠 **흡수 후보 1순위** | STYLER 로드맵의 마디와 완전 중복 — D 정본 흡수 검토 |
| PARTNER | 7/13 | **E 정본** | 유지 | B2B 납품 라인 귀속 시 활동 재개 |
| RND | **4/24** | E | 🟡 paused 후보 | 정부 사업 시즌성 — completed 아닌 paused |

**집계**: 축 정본 5 · 현역 14 · paused 후보 6(EVENT·MUSE·PRESENTATION·VIDEO·DOCS·RND) · 흡수 후보 1(PROFILES) · 관찰 3(CHATBOT·IMAGE_PRO·VTON) · draft 1(FACTORY).

## 3. 정합 결함 (감사 발견 — 보정 필요)

| # | 결함 | 실측 | 보정안 |
|---|------|------|--------|
| 1 | **PF_SECURITY 상태 불일치** | 인덱스=completed(→AUTOPILOT) vs README frontmatter=**active** | README status를 completed로 — 인덱스가 정본 판정과 일치 |
| 2 | **PF_PROFILES 상태 불일치** | 인덱스=draft vs README=**active**(최종 활동 6/22) | 실활동 있었으므로 인덱스를 active로 보정 후 흡수 검토 |
| 3 | **아카이브 트리거 초과 2건** | CROP 704줄 · SPREAD 522줄 (기준 500) | ch4 9조 비대화 관리 — 쌍아 아카이브 분리 |
| 4 | OPUS frontmatter 이형 | `status: "active"` (따옴표) | 파서 오작동 예방 소소 보정 |

## 4. 인덱스 개편안 (쌍아 실행 대상)

1. `portfolios/README.md` 인덱스에 **귀속(축) 컬럼 1개 추가** — 기존 도메인 컬럼 유지(종류≠위계, 이중 분류 경합 방지)
2. 운용 원칙에 1줄 추가: *"PROPOSAL 승인 시 신규 PF 생성 전 기존 축 귀속을 먼저 검토한다"*
3. paused/흡수 확정 건은 선례 형식 준수: completed/paused 표기 + 리다이렉트 노트 (삭제 금지)

## 5. 유보 (작가님 결정 대기)

- paused 후보 6건의 확정 — 특히 EVENT(재점화 연동)·RND(시즌성)는 paused가 적정하고 completed는 부적정하다는 게 감사 의견
- PROFILES→STYLER 흡수 여부
- B2B 납품 라인의 PARTNER 귀속 (오전 제안서 S 시리즈와 연동)
- 본 감사의 축 배정은 **가배속**이다 — 이의 있는 배정은 개별 판정(다중매칭 원칙: 주제>도구 준용)으로 확정한다
