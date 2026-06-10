# portfolios/ — 포트폴리오 (PF)

> 정본 위치. 프로젝트의 기안→완성 생애주기를 추적하는 허브 문서.
> 에이전트가 투입될 때 **세션 로그 대신 PF를 진입점**으로 읽는다.

## PF 인덱스

| PF | 코드네임 | 도메인 | 주제 | 상태 | 생성일 |
|----|---------|--------|------|------|--------|
| **[PF_IDPHOTO](PF_IDPHOTO/README.md)** | **IDPHOTO** | **서비스** | **MONKOS 증명사진 — IDPASS(iOS) + AI 생성(Web/App) 통합 상품** | **active** | **01-11** |
| [PF_PHOTOPRO](PF_PHOTOPRO/README.md) | PHOTOPRO | 서비스 | AI 증명사진/프로필 사진 서비스 | completed (→ PF_IDPHOTO) | 01-11 |
| [PF_PORTAL](PF_PORTAL/README.md) | PORTAL | 서비스 | 포털 v4 + CMS + 블록에디터 + 다국어 | active | 01-16 |
| [PF_CROP](PF_CROP/README.md) | CROP | 서비스 | MONKOS Crop — ICAO 크롭 + 특허 | active | 03-11 |
| [PF_STUDIO](PF_STUDIO/README.md) | STUDIO | 서비스 | AI 촬영실 UX + 음성 코칭 | active | 03-06 |
| [PF_VTON](PF_VTON/README.md) | VTON | 서비스 | 이너웨어/패션 AI 가상착장(VTON) — 4060 로컬 CatVTON | active | 05-31 |
| [PF_CDP](PF_CDP/README.md) | CDP | 인프라 | 로컬 CDP 브라우저 제어 — 에이전트 독립 인프라 | active | 03-27 |
| [PF_SECURITY](PF_SECURITY/README.md) | SECURITY | 인프라 | IAM·SA 권한 재조정·분기 재설계 | completed (→ AUTOPILOT) | 04-23 |
| [PF_CITADEL](PF_CITADEL/README.md) | CITADEL | 전략 | SEO/GEO/AEO 통합 | active | 03-26 |
| [PF_SPREAD](PF_SPREAD/README.md) | SPREAD | 전략 | 콘텐츠 배포·마케팅 통합 전략 | active | 03-04 |
| [PF_EVENT](PF_EVENT/README.md) | EVENT | 전략 | 매출 전환 이벤트 | active | 04-21 |
| [PF_PROFILES](PF_PROFILES/README.md) | PROFILES | 전략 | AI 프로필 사진 독립 서비스 | draft | 04-28 |
| [PF_MONK_OS](PF_MONK_OS/README.md) | MONK_OS | 운영 | 범용 Agent OS 이식 로드맵 + 하네스 아키텍처 | active | 04-23 |
| [PF_DOCS](PF_DOCS/README.md) | DOCS | 운영 | 문서 편집 체계 (포맷별 도구·파이프라인) | active | 05-04 |
| [PF_RND](PF_RND/README.md) | RND | 운영 | 정부 R&D·IP 지원사업 통합 추적 | active | 04-24 |
| [PF_CHATBOT](PF_CHATBOT/README.md) | CHATBOT | 인프라 | 통합 AI 챗봇 — 6채널 엔진 + RAG + 온디바이스 | active | 01-10 |
| [PF_AUTOPILOT](PF_AUTOPILOT/README.md) | AUTOPILOT | 인프라 | 접착 레이어 — CF↔CR 중계 + 시크릿 통합 + 멀티레포 연결 + 에이전트 연결 | active | 05-11 |
| [PF_FACTORY](PF_FACTORY/README.md) | FACTORY | 인프라 | 4060 GPU 팩토리 — 야간 생산 + 모델 연구 + 텔레그램 보고/지시 | draft | 05-11 |
| [PF_BRIEF](PF_BRIEF/README.md) | BRIEF | 콘텐츠 | 매일 자동 브리핑 — 성과 보고 + SEO 교정 + 뉴스 | completed (→ AUTOPILOT) | 04-10 |
| [PF_PRESENTATION](PF_PRESENTATION/README.md) | PRESENTATION | 콘텐츠 | PT 콘텐츠 자동화 엔진 — 3D캐릭터/TTS | active | 04-03 |
| [PF_VIDEO](PF_VIDEO/README.md) | VIDEO | 콘텐츠 | AI 영상 생성 엔진 — video.monkos.ai | active | 04-27 |
| [PF_MUSE](PF_MUSE/README.md) | MUSE | 콘텐츠 | 멀티 에이전트 토론방 — 서사적 유희 + 창작 + 아이디어 발산 | active | 05-11 |
| **[PF_SPECS](PF_SPECS/README.md)** | **SPECS** | **전략** | **글로벌 증명사진 규격 허브 — 9언어 × 320문서 SEO/GEO 자산** | **active** | **05-22** |
| **[PF_OPUS](PF_OPUS/README.md)** | **OPUS** | **메타(통괄)** | **콘텐츠 플라이휠 통괄 — 생산공장 완성으로 자생 유입 엔진 구축** | **active** | **06-05** |
| **[PF_IMAGE_PRO](PF_IMAGE_PRO/README.md)** | **IMAGE_PRO** | **서비스** | **MONKOS Image Pro — image.monkos.ai** | **active** | **01-16** |
| **[PF_KKU](PF_KKU/README.md)** | **KKU** | **콘텐츠/마케팅** | **꾸 콘텐츠 루틴 — 7채널 멀티배포 + 사진관 마케팅** | **active** | **06-07** |
| [PF_TEMPLATE](PF_TEMPLATE/README.md) | TEMPLATE | 메타 | 신규 PF 생성 템플릿 | — | — |

## 네이밍

`PF_{코드네임}/README.md` (폴더 구조 통일)

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
- 템플릿: [PF_TEMPLATE](PF_TEMPLATE/README.md)
