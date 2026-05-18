---
type: order
id: ORDER_20260326_iMac쌍아_막내12_PF스냅샷생성
date: 2026-03-26 13:44 KST
from: iMac/쌍아
to: 막내1, 막내2
status: pending
priority: P1
tags: [PF, portfolio, 스냅샷, 생성]
---

# 지시서: PF 스냅샷 생성 — 5건 분할

> **[2026-03-26 13:44 KST] iMac/쌍아 → 막내1, 막내2**

## 역할 선언
> **너는 막내N호다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

## 배경

PF 분기 분석(총동원)이 완료되어 **6건의 PF가 확정**되었다.
PF_CITADEL은 이미 존재. 나머지 **5건의 현재 상태 스냅샷**을 생성한다.

**핵심 원칙:**
- **소급 불적용**(ch4 9조 5항): 히스토리 역추적 하지 않는다. 현재 상태만 기록.
- **PF_TEMPLATE.md** 기반 7섹션 구조 사용. domain은 기재하지 않는다(선택 필드).
- 히스토리는 **"현재 시점 기준 주요 마일스톤"을 5~10행**으로 요약 (세션 로그 역추적이 아닌, 분기 분석 보고서 기반).
- Phase 현황은 **현재 활성 Phase만 상세, 과거 Phase는 완료 1줄 요약**.

## 담당 분할

| 막내 | PF | 파일명 |
|------|-----|--------|
| **막내1** | PF_PHOTOPRO, PF_PORTAL, PF_CROP | 3건 |
| **막내2** | PF_STUDIO, PF_SPREAD | 2건 |

## 각 PF 스냅샷 가이드

### PF_PHOTOPRO — AI 사진 서비스 본체

```yaml
type: portfolio
id: PF_PHOTOPRO
name: PHOTOPRO
subject: AI 증명사진/프로필 사진 서비스 — monk.kr + monkos.ai 핵심 상품
created: 2026-01-11
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
```

포함 범위: Image Pro MVP, idphoto-kr, idphoto-jp, 결제 퍼널(v5), REST API, Vertex AI 통합
참고 소스: 막내3 보고서 §1-1(AI 사진), §1-9(일본), 막내2 보고서 PF_FUNNEL·PF_JAPAN, 막내1 보고서

### PF_PORTAL — 포털 v4 + CMS + 블록에디터

```yaml
type: portfolio
id: PF_PORTAL
name: PORTAL
subject: monkos.ai 포털 메인 레이아웃 + CMS + 블록에디터 + 다국어
created: 2026-01-16
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
```

포함 범위: v4 레이아웃(3컬럼), 갤러리 Firestore, 블록에디터 Phase 0, 블로그 에디터 v2, i18n, 어드민, render.js 모듈 분리(#31)
참고 소스: 막내1 보고서 PU-1·PU-2, 막내2 보고서 PF_PORTAL, PORTAL_V4_EVOLUTION_SPEC.md
기존 스펙: `monkos-ops/tech/guides/PORTAL_V4_EVOLUTION_SPEC.md` — 관련 문서 인덱스에 링크

### PF_CROP — 크롭앱 + 특허

```yaml
type: portfolio
id: PF_CROP
name: CROP
subject: MONKOS Crop — ICAO 규격 자동 크롭 도구 + 특허 출원
created: 2026-03-11
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
```

포함 범위: FaceMesh+ICAO 규격 검증, 크롭 엔진, /crop 독립 URL, 메타 최적화(CITADEL Phase 1), 특허 출원
참고 소스: 막내1 보고서 PU-4, 막내2 보고서 PF_CROP, 어젠다 #25

### PF_STUDIO — 촬영실/코칭 UX

```yaml
type: portfolio
id: PF_STUDIO
name: STUDIO
subject: AI 촬영실 UX + 음성 코칭 — 내부 스튜디오 앱
created: 2026-03-06
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: paused
```

포함 범위: idphoto-kr 기반 Studio 독립 배포, T2I+I2I SPA 기안, 코칭 모드
참고 소스: 막내2 보고서 PF_STUDIO, 막내1 보고서 PU-5, PROPOSAL_20260318_스튜디오v2

### PF_SPREAD — 마케팅 통합 전략

```yaml
type: portfolio
id: PF_SPREAD
name: SPREAD
subject: 콘텐츠 제작·배포·마케팅 통합 전략 — 21채널 오케스트레이션
created: 2026-03-04
owner: 작가님
leads: 쌍아(설계), 코웍이(전략), 한(JP 마케팅)
status: active
```

포함 범위: SPREAD v2 종합전략, 콘텐츠 배포 시스템, 텔레그램/LINE 봇, 블로그 다국어 발행, 외부 채널
참고 소스: 막내2 보고서 PF_SPREAD, 막내1 보고서 PU-7, PROPOSAL_20260319_SPREAD_v2

## 작성 규칙

1. `monkos-ops/ops/portfolios/PF_{코드네임}.md` 에 생성
2. 7섹션 구조 (비전/히스토리/Phase/성과/복기/문서인덱스/리스크)
3. 히스토리: 분기 분석 보고서에서 주요 마일스톤 5~10행 발췌. 날짜·주체·내용·상태
4. Phase 현황: 현재 상태 기준. 과거 Phase는 "✅ 완료" 1줄 요약
5. 성과: 실측 데이터가 있으면 기재, 없으면 "측정 예정" 표기
6. 관련 문서 인덱스: PROPOSAL, SPEC, 주요 ORDER 링크
7. **portfolios/README.md** 에 6건 전체 PF 인덱스 갱신

## ⚠️ 준수 조항
- ch4 9조 5항: 소급 불적용 — 히스토리 역추적 금지
- 헌법 제3조(적립) 1항: 타임스탬프 시스템 시간만 사용
- ch7 1조: 완료 보고 형식 준수

## 엔드라인
| 항목 | 내용 |
|------|------|
| 포트폴리오 | 해당 없음 (PF 체계 수립) |
| 마무리 | `커밋+push` |
| 산출물 | `monkos-ops/ops/portfolios/PF_*.md` × 5건 + README.md 갱신 |
| 문서 유형 | `PORTFOLIO` |
| 세션 로그 | `[pf] PF 스냅샷 5건 생성` |
