# portfolios/ — 포트폴리오 (PF)

> 정본 위치. 프로젝트의 기안→완성 생애주기를 추적하는 허브 문서.
> 에이전트가 투입될 때 **세션 로그 대신 PF를 진입점**으로 읽는다.

## PF 인덱스

| PF | 코드네임 | 도메인 | 주제 | 상태 | 생성일 |
|----|---------|--------|------|------|--------|
| [PF_PHOTOPRO](PF_PHOTOPRO.md) | PHOTOPRO | 서비스 | AI 증명사진/프로필 사진 서비스 | active | 01-11 |
| [PF_PORTAL](PF_PORTAL.md) | PORTAL | 서비스 | 포털 v4 + CMS + 블록에디터 + 다국어 | active | 01-16 |
| [PF_CROP](PF_CROP.md) | CROP | 서비스 | MONKOS Crop — ICAO 크롭 + 특허 | active | 03-11 |
| [PF_STUDIO](PF_STUDIO.md) | STUDIO | 서비스 | AI 촬영실 UX + 음성 코칭 | paused | 03-06 |
| [PF_CDP](PF_CDP.md) | CDP | 인프라 | 로컬 CDP 브라우저 제어 — 에이전트 독립 인프라 | active | 03-27 |
| [PF_SECURITY](PF_SECURITY/README.md) | SECURITY | 인프라 | IAM·SA 권한 재조정·분기 재설계 | blocked | 04-23 |
| [PF_CITADEL](PF_CITADEL.md) | CITADEL | 전략 | SEO/GEO/AEO 통합 | active | 03-26 |
| [PF_SPREAD](PF_SPREAD.md) | SPREAD | 전략 | 콘텐츠 배포·마케팅 통합 전략 | active | 03-04 |
| [PF_EVENT](PF_EVENT.md) | EVENT | 전략 | 매출 전환 이벤트 | active | 04-21 |
| [PF_PROFILES](PF_PROFILES.md) | PROFILES | 전략 | AI 프로필 사진 독립 서비스 | draft | 04-28 |
| [PF_MONK_OS](PF_MONK_OS/README.md) | MONK_OS | 운영 | 범용 Agent OS 이식 로드맵 | draft | 04-23 |
| [PF_DOCS](PF_DOCS/README.md) | DOCS | 운영 | 문서 편집 체계 (포맷별 도구·파이프라인) | active | 05-04 |
| [PF_RND](PF_RND/README.md) | RND | 운영 | 정부 R&D·IP 지원사업 통합 추적 | active | 04-24 |
| [PF_BRIEF](PF_BRIEF.md) | BRIEF | 콘텐츠 | 매일 자동 브리핑 — 성과 보고 + SEO 교정 + 뉴스 | active | 04-10 |
| [PF_PRESENTATION](PF_PRESENTATION.md) | PRESENTATION | 콘텐츠 | PT 콘텐츠 자동화 엔진 — 3D캐릭터/TTS | active | 04-03 |
| [PF_VIDEO](PF_VIDEO.md) | VIDEO | 콘텐츠 | AI 영상 생성 엔진 — video.monkos.ai | active | 04-27 |

## 네이밍

`PF_{코드네임}.md` (파일형) 또는 `PF_{코드네임}/README.md` (폴더형)

## 운용 원칙

- Phase 완료·지시서 발행·배포 시 해당 PF 히스토리를 **즉시 어펜드**
- 히스토리는 **append-only** (삭제·수정 금지, 헌법 제3조 준용)
- 지시서에 `portfolio: PF_XXX` 필드를 기재하면, 막내는 착수 전 해당 PF를 먼저 읽는다
- PROPOSAL 승인 → PF 생성. PROPOSAL 미승인 건은 PF를 만들지 않는다
- PF 갱신은 **쌍아가 수행** (ch3 3조, ch4 9조). 막내는 세션 로그 + COMPLETION으로 납품

## PF 위상 — 작가님 원문 기반 (2026-03-26)

> origin: memory/project_pf_philosophy.md

- **어젠다** = "이것이 필요하다"는 인지의 영역
- **PF** = 기안과 어젠다들이 구체적 영역으로 정의되어 **파일링 시스템에 도입**된 것
- PF는 **살아있는 활성 영역** — 확장/축소/분기/병합이 자연스럽게 일어남
- 코드가 움직이는 곳에 PF가 붙는다

### MONK OS 4대 파트
- **거버넌스**: 헌법·법률·철학 → `governance/`
- **오피스**: 관리·영업·리서치·일상 업무 → 디폴트 모드
- **PF(실행)**: 오피스에서 추적이 필요해진 순간 정의되어 분리된 것 → `portfolios/`
- **아카이브**: 보물창고, 읽기전용 → `docs/`

## 참조

- 법률 근거: ch4 3조 #15, ch4 4조, ch4 9조 (PF 운용 규칙)
- 템플릿: [PF_TEMPLATE.md](PF_TEMPLATE.md)
