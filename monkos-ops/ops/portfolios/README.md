# portfolios/ — 포트폴리오 (PF)

> 정본 위치. 프로젝트의 기안→완성 생애주기를 추적하는 허브 문서.
> 에이전트가 투입될 때 **세션 로그 대신 PF를 진입점**으로 읽는다.

## PF 인덱스

| PF | 코드네임 | 주제 | 상태 | 생성일 |
|----|---------|------|------|--------|
| [PF_PHOTOPRO](PF_PHOTOPRO.md) | PHOTOPRO | AI 증명사진/프로필 사진 서비스 | active | 01-11 |
| [PF_PORTAL](PF_PORTAL.md) | PORTAL | 포털 v4 + CMS + 블록에디터 + 다국어 | active | 01-16 |
| [PF_CROP](PF_CROP.md) | CROP | MONKOS Crop — ICAO 크롭 + 특허 | active | 03-11 |
| [PF_CITADEL](PF_CITADEL.md) | CITADEL | SEO/GEO/AEO 통합 | active | 03-26 |
| [PF_STUDIO](PF_STUDIO.md) | STUDIO | AI 촬영실 UX + 음성 코칭 | paused | 03-06 |
| [PF_SPREAD](PF_SPREAD.md) | SPREAD | 콘텐츠 배포·마케팅 통합 전략 | active | 03-04 |
| [PF_CDP](PF_CDP.md) | CDP | 로컬 CDP 브라우저 제어 — 에이전트 독립 인프라 | active | 03-27 |

## 네이밍

`PF_{코드네임}.md` — 예: `PF_CITADEL.md`, `PF_PORTAL.md`

## 운용 원칙

- Phase 완료·지시서 발행·배포 시 해당 PF 히스토리를 **즉시 어펜드**
- 히스토리는 **append-only** (삭제·수정 금지, 헌법 제3조 준용)
- 지시서에 `portfolio: PF_XXX` 필드를 기재하면, 막내는 착수 전 해당 PF를 먼저 읽는다
- PROPOSAL 승인 → PF 생성. PROPOSAL 미승인 건은 PF를 만들지 않는다
- PF 갱신은 **쌍아가 수행** (ch3 3조, ch4 9조). 막내는 세션 로그 + COMPLETION으로 납품

## 참조

- 법률 근거: ch4 3조 #15, ch4 4조, ch4 9조 (PF 운용 규칙)
- 템플릿: [PF_TEMPLATE.md](PF_TEMPLATE.md)
