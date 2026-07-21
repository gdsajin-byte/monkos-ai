---
type: portfolio
id: PF_DESIGNLAB
name: DESIGNLAB
subject: 디자인 토큰·브랜딩·UI 시스템 — 전 서비스 표면의 횡단 기반층
created: 2026-07-21
owner: 작가님
leads: 쌍아(토큰 아키텍처), 민아(브랜딩 정합), 꾸(시안·스킨, 경로④)
status: active
---

# PF_DESIGNLAB — 디자인 토큰·브랜딩·UI 시스템

> 전 서비스 표면(specs·IDPASS·헤드샷·취업·스타일러·마켓아이·어드민)의 디자인 일관성을 관장하는 기반층.
> L0/L1 토큰을 주조하고, 각 서비스 PF는 L2 스킨(오버라이드)만 소유·소비.

---

## 1. 배경

- 표면 CSS 11파일이 각자 색·간격을 소유 중 (home/headshot/portal/admin/attire-picker/tg-style 등)
- tokens.css (7/15 생성) 존재하나 --specs-* 한정, 브랜드 전역 아님
- DESIGN_SYSTEM.md는 3/14 스테일 — 구 monk.kr 다크 팔레트(#05070A), 현행 specs 라이트(#6c4fff)와 불일치
- 아키텍처 전환(Phase 1~2)에서 CSS 재조립 예정 — 토큰 선행 없이 지으면 12번째 CSS 파일이 하나 더 생길 뿐

---

## 2. 소관 경계

| 소관 | 소유 | 비고 |
|------|------|------|
| **DESIGNLAB** | L0 프리미티브 토큰 (--mk-*), L1 시맨틱 토큰, DESIGN_SYSTEM.md 정본, 피그마 동기화, 이식 게이트 | 토큰 변경 = 전 표면 파급 → 게이트 필수 |
| **각 서비스 PF** | L2 스킨 (서비스별 오버라이드 파일 5~10변수) | 서비스 론칭 시 DESIGNLAB에서 스킨 1세트 발급 |

---

## 3. 토큰 3층 구조 (민아 제안 골격)

| 층 | 내용 | 산출물 |
|----|------|--------|
| **L0 프리미티브** | 브랜드 전역 원판: 색·타이포 스케일·간격·라운드·그림자 (MONKOS 1벌) | `--mk-*` tokens.css 정본 1파일 승격 |
| **L1 시맨틱** | 역할 변수 (accent·surface·text) + 라이트/다크 쌍 | 마켓아이 대시보드(다크)·specs(라이트) 공존 |
| **L2 서비스 스킨** | IDPASS·헤드샷·스타일러·취업·마켓아이 = L1 오버라이드 최소 세트 | 서비스별 파일, 신규 론칭 디자인 비용 상수화 |

**연동**: Tailwind config (ch2 준수) + Figma variables ↔ tokens.css 동기화

---

## 4. 현재 디자인 자산 실측 (7/21 민아)

| 항목 | 상태 |
|------|------|
| tokens.css | 존재 (7/15), --specs-* 한정 |
| DESIGN_SYSTEM.md | 3/14 스테일, 현행 불일치 |
| 표면 CSS | 11파일 각자 진화 중 |
| 피그마 | 서비스별 산재, 토큰 미연동 |

---

## 5. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/14 | — | DESIGN_SYSTEM.md 최초 작성 (다크 팔레트, monk.kr 기준) | DESIGN_SYSTEM.md | ✅ (현재 스테일) |
| 07/15 | M1/막내 | tokens.css 생성 — specs 퍼널 분리 시 CSS 변수 추출. "컴포넌트 px 소유 금지" 원칙 | tokens.css | ✅ |
| 07/21 | M1/민아 | **디자인 자산 실측** — 표면 CSS 11파일 산재, tokens.css --specs-* 한정, DESIGN_SYSTEM.md 스테일 확인. 3층 토큰 골격 제안 (L0/L1/L2) | 세션로그 | ✅ |
| 07/21 | 작가님 | **PF_DESIGNLAB 신설 결정** — 디자인 토큰·브랜딩은 공정이 다르므로 별도 PF. 아키텍처 전환 Phase 0~1 선행 조건으로 편입 | 본 README | ✅ |

---

## 6. Phase 로드맵

### Phase 0 — 토큰 설계 (선행)

| 항목 | 상태 |
|------|------|
| L0 프리미티브 토큰 정의 (색·타이포·간격·라운드·그림자) | ⏳ |
| L1 시맨틱 토큰 정의 (라이트/다크) | ⏳ |
| tokens.css --specs-* → --mk-* 승격 | ⏳ |
| DESIGN_SYSTEM.md 개정 (현행 정합) | ⏳ |
| Tailwind config 연동 | ⏳ |

### Phase 1 — 이식

| 항목 | 상태 |
|------|------|
| specs 표면 토큰 이식 (specs-funnel.css 등) | ⏳ |
| IDPASS 허브 SPA 토큰 기반 구축 | ⏳ |
| 취업 랜딩 토큰 기반 구축 | ⏳ |

### Phase 2 — 확산

| 항목 | 상태 |
|------|------|
| headshot·스타일러·어드민 이식 | ⏳ |
| 마켓아이 대시보드 다크 스킨 | ⏳ |
| Figma variables 동기화 | ⏳ |
| 꾸 시안 피드백 루프 (경로④) | ⏳ |
