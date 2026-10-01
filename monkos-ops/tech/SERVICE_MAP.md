---
type: spec
date: 2026-08-14
device: iMac
agent: 민아
subject: "서비스 지도 정본 — 시각 트리 + 명칭 인덱스 + 존재 이유 + 상태"
status: 가동
---

# SERVICE_MAP — 무엇이 있고, 왜 있는가

> **용도**: 오리엔테이션. 특정 앱·서비스가 화제에 오르면 **코드 grep 전에 이 파일 1개를 Read**한다.
> **소비 규칙**: 매 턴 자동 로딩 아님(컨텍스트 오염 방지) — 주제 진입 시 선택 로딩. 포인터: `.claude/rules/references.md` §폴더 위상.
> **실측일: 2026-08-25 (CF 엣지 계층 편입 + 웜 전면 해제 반영).** 갱신 시 references.md §배포의 재실측 3콜 + 본 문서 스탬프 갱신. 이름·상태의 정본은 각 `deploy.sh`·Cloud Run 실측이다.
> 상태 범례: 🟢 가동 / 🟡 일부 가동·간헐 / ⏸️ 중단·보류 / ⬜ 미생성 / 🗑️ 폐지 / ❓ 확인 필요

## 1. 전체 트리 (Level 0)

```
MONK.KR / MONKOS.AI
├── monk.kr ────────────────── 본진 데스크톱 (CF Pages) 🟢
│   └── 실물 사진관 연계 · 인화 스마트스토어 · AEO 오프전환 실증점
│
├── monkos.ai (모바일 AI 분기, CF 엣지 + Cloud Run)
│   ├── 엣지 (monkos-portal-edge, CF Worker) 🟢 ─ 08-24 컷오버. monkos.ai 전 트래픽 진입문
│   │        specs 2,574p 정적 서빙 · CMS 6표면 캐시(TTL 10분+SWR) · 그 외 오리진 폴백
│   │        신뢰 헤더(EDGE_TRUST_KEY AND CF대역) · 지역 재작성 · sid 발급 · page_view 중계
│   ├── 포털 (monkos-portal) 🟢 ─── 크레딧·인증·결제 허브 = 전 서비스의 심장 (웜 0 — API·SSR만 기동)
│   │   ├── [유저] 홈(/) · specs(T0 무료 증명사진, 전언어) · blog · headshot(유료)
│   │   │        credits/pricing · tg(텔레그램 게이트) · guide
│   │   ├── [어드민 /admin] §3 전수 인덱스 참조 (CMS 7 + 내부 도구 8)
│   │   └── [API] /api/credits·checkout(레몬)·toss·idphoto(specs 생성 체인)
│   ├── idphoto-kr (monkos-idphoto-kr) 🟢 ─ KR 촬영 코칭형 증명사진 (카메라+Gemini Live)
│   ├── idphoto-jp (monkos-idphoto-jp) 🟡 ─ JP 레거시 (엔화 레몬 크레딧) — JP SEO 재편 대기
│   ├── studio (monkos-studio) 🟢❓ ──── AI 증명사진 내부 생성 도구 (어드민 INTERNAL)
│   ├── IMAGE PRO (monk-image-engine) 🟢 ─ 이미지 편집·생성 엔진 (image.monkos.ai, 꾸 상시 사용)
│   ├── crop-engine ⬜ ─────────────── 규격 안착 크롭 (FaceMesh) — deploy.sh만 존재, 서비스 미생성
│   └── pt.monkos.ai ❓ ───────────── 몽코스 3D 프레젠테이션 엔진(PT) — 용도 확인(08-14), 인프라 소재 미상
│
├── 매팅 인프라
│   └── matte.monkos.ai (birefnet-matte) 🟡 ─ 4060 GPU+CF Tunnel. 비가동 시 RunPod 폴백(설계상 무피해)
│
├── 프로토타입 (apps/) ⚠️ 이중 소스 2건 — 실험장 오인 금지
│   ├── idphoto-jp-v079 → monkos-idphoto-jp 로 배포됨 (프로덕션 이중 소스)
│   ├── monk_imagen4/backend → monk-image-engine 으로 배포됨 (프로덕션 이중 소스)
│   ├── jangsam → jangsam-dev ⏸️ (prod 미생성)
│   └── monkos-matte → ⬜ 미생성
│
└── 운영 인프라 (비배포)
    ├── monkos-ops/ ─ 운영 정본 (ops·tech·contents·marketing)
    ├── scripts/ ──── credits.sh·secret·mk-push·순찰·리트리벌 MCP (도구 정본: references.md §도구 맵)
    └── ~~monkos-works~~ 🗑️ 폐지(08-13) — 이력은 원격 레포
```

## 2. 명칭 인덱스 — 부르는 이름이 다르면 여기서 찾는다

> ⚠️ **디렉터리명 ≠ 서비스명 ≠ 도메인 ≠ 통칭.** 이 표가 혼동 방지의 정본 인덱스다 (ch4 5조 약칭 레지스트리와 병용).

| 통칭(대화) | 소스 디렉터리 | Cloud Run 서비스 | 도메인 | 상태 | 왜 존재하는가 | PF |
|---|---|---|---|---|---|---|
| 포털 | `monkos_AI/portal/` | `monkos-portal`(+dev) | monkos.ai | 🟢 | 크레딧·인증·결제·specs·blog의 허브. 전 서비스가 이 API에 의존. **웜 0 (08-24 해제)** — 열람은 엣지가 흡수, 오리진은 API·SSR만 | PF_PORTAL·PF_SPECS |
| 엣지·워커 | `monkos_AI/portal/edge/` (+`tools/specs-ssg/`) | (CF Worker) `monkos-portal-edge` | monkos.ai (존 라우트 `monkos.ai/*`) | 🟢 | 08-24 컷오버. specs 정적 2,574p + CMS 캐시 + 오리진(run.app) 폴백. 배포는 `edge/deploy.sh` (SSG 선행). ⚠️ specs 렌더러·데이터 변경 시 엣지 재배포 필수 — 누락 시 무음 구본 서빙 | PF_SPECS·PF_PORTAL |
| 증명(KR)·촬영앱 | `monkos_AI/idphoto-kr/` | `monkos-idphoto-kr` | idphoto-kr.monkos.ai | 🟢 | 실물 사진관 연계 KR 시장용. 카메라 코칭(Gemini Live)+idgen(`gemini-3-pro-image`)+토스 충전 | PF_IDPHOTO |
| 증명(JP) | `monkos_AI/idphoto-jp/` | `monkos-idphoto-jp` | idphoto-jp.monkos.ai | 🟡 | JP 레거시(엔화 레몬 스토어#290457). JP 본대는 monkos.ai(ja)로 재편 권고(07-21) — 결정 대기 | PF_IDPHOTO |
| specs·무료 증명 | (포털 내장) `lib/cms/render-specs.js` | — | monkos.ai/specs/* | 🟢 | T0 무료 전언어 개방 — 트래픽·DA 확보가 목적, 캡 300/일 (매팅=BiRefNet 트랙) | PF_SPECS |
| 이미지프로 | `monkos_AI/image-pro/backend/` (단일 정본 10-01 — 구 apps 측은 `apps/_legacy/`) | **`monk-image-engine`** | image.monkos.ai | 🟢 | 이미지 편집·생성 엔진(Imagen4 T2I·Gemini I2I). 꾸 마케팅 에셋 제작 상시 사용. 어드민 EXTERNAL 링크 | PF_IMAGE_PRO |
| 스튜디오 | `monkos_AI/studio/` | `monkos-studio`(+dev) | studio.monkos.ai | 🟢❓(가동 실측 필요) | AI 증명사진 내부 생성 도구 (어드민 INTERNAL) | PF_STUDIO |
| 크롭 엔진 | `monkos_AI/crop-engine/` | ⬜ `monkos-crop-engine` 미생성 | — | ⬜ | 규격 안착 크롭(FaceMesh) 설계 — 서비스 미생성, 폴더·deploy.sh만 실재 | PF_CROP |
| 매팅·4060 | `monkos_AI/matte-server/` | (Cloud Run 아님) | matte.monkos.ai | 🟡 | 무료 매팅 원가 방어용 자가 GPU(BiRefNet). 4060 가정 사정 오프 빈발 — RunPod 폴백이 전량 흡수(07-25 체계) | PF_INFRA |
| PT·프레젠테이션 | ❓ (소스 미확인) | ❓ (도메인 매핑·서비스 부재) | pt.monkos.ai | ❓ | 몽코스 3D 프레젠테이션 엔진 (어드민 INTERNAL 명기 08-14 확인). 인프라 소재 확인 필요 [2조 한시적 예외] | PF_PRESENTATION |
| 본진·monk.kr | `MONK_kr/` | — (CF Pages · 버튼 배포 `deploy-monk-kr.yml`, 예비 wrangler — ch5 1조) | monk.kr | 🟢 | 실물 사진관 기반 데스크톱 본진. 인화 서비스 통합 방향(07-12) | PF_MONK_OS |
| 장삼 | `apps/jangsam/` | `jangsam-dev` | — | ⏸️ | (프로토 — prod 미생성) | — |
| 관상·사주 | (포털 내장, admin/gwansang) | — | monkos.ai/admin/gwansang | ⏸️ INTERNAL | 사주×관상 얼굴 지도 — 관상×취업사진 양문형 고리 전략(08-01)의 축. 유료화 전 내부 단계 | PF_FACEREAD |
| 헤드샷 | (포털 내장) `render-headshot.js` | — | monkos.ai/headshot | 🟢 | AI 프로페셔널 헤드샷 (credits 게이트 유료) | PF_PORTAL |
| 챗봇 | (포털·idphoto 내장) | — | 각 서비스 위젯 | 🟢 | CS 자동화 (RAG 보수 응답 원칙 — 되는 것만) | PF_CHATBOT |

## 3. 포털 어드민 — 메뉴 전수 인덱스 (2026-08-14 실측, /admin)

| 그룹 | 메뉴 | 파일 | 역할 | 상태 |
|---|---|---|---|---|
| CMS | Dashboard | dashboard.html | 트래픽·가입자·크레딧 현황 | 🟢 |
| CMS | Blog | blog-list/edit.html | 블로그 관리 (AEO 콘텐츠 축) | 🟢 |
| CMS | FAQ | faq.html | FAQ 관리 | 🟢 |
| CMS | Gallery | gallery.html | 갤러리 관리 | 🟢 |
| CMS | Board | board.html | 게시판 관리 | 🟢 |
| CMS | Home Layout | layout.html | 홈 페이지 블록 편집 | 🟢 |
| CMS | Settings | settings.html | 사이트 설정 | 🟢 |
| 내부 도구 | ID Photo Review | idphoto-review.html | 증명사진 원본↔결과물 비교 리뷰 (06-19 신설) | 🟢 |
| 내부 도구 | VTON Studio | vton-studio.html | AI 가상착장 생성 (의상 커머스 비전 연결) | 🟢❓ |
| 내부 도구 | IMAGE PRO | (EXTERNAL→image.monkos.ai) | 이미지 편집 엔진 진입점 | 🟢 |
| 내부 도구 | Studio | (EXTERNAL→studio.monkos.ai) | AI 증명사진 내부 생성 | 🟢❓ |
| 내부 도구 | PT | (EXTERNAL→pt.monkos.ai) | 3D 프레젠테이션 엔진 | ❓ |
| 내부 도구 | Headshot | (→/headshot) | 헤드샷 생성 진입점 | 🟢 |
| 내부 도구 | 관상 리포트 | gwansang.html | 사주×관상 얼굴 지도 | ⏸️ INTERNAL |
| (메뉴 미노출) | Citadel | citadel.html | 메뉴에 없는 잔존 페이지 — 용도·존폐 확인 필요 | ❓ |
| (메뉴 미노출) | User | user.html | 유저 관리 — 메뉴 미노출 사유 확인 필요 | ❓ |

## 4. "증명사진"의 4가지 형태 — 같은 단어, 다른 맥락

| 형태 | 표면 | 게이트 | 생성 경로 | 목적 |
|---|---|---|---|---|
| specs 무료 | monkos.ai/specs/{type}/{cc} | free (캡 300/일) | 크롭+BiRefNet 매팅 (AI 생성 아님) | 글로벌 트래픽·DA (T0 전략) |
| KR 촬영앱 | idphoto-kr (camera→result) | 크레딧 10c/생성+70c/다운로드 | Gemini Live 코칭 + `gemini-3-pro-image` | 실물 사진관 연계 수익화 |
| JP 레거시 | idphoto-jp | 크레딧 (¥ 레몬 #290457) | KR과 동계열 | JP 시장 (재편 대기) |
| 내부 스튜디오 | studio.monkos.ai (어드민) | 내부 | 내부 생성 도구 | 운영·제작 지원 |

> 이 구분을 모르면 "증명사진 버그"라는 말에 네 표면을 전부 뒤지게 된다. 대화에서 어느 형태인지 먼저 특정할 것.
