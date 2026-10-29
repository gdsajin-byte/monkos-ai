---
type: design
date: 2026-10-29
device: iMac
agent: 소소
status: 등록 완료 — 캡처 5장 확보(16:22~16:26), 기본값 지정 메뉴는 현 UI 5곳에서 미발견
portfolio: PF_DESIGNLAB
subject: "디자인 시스템 아티팩트 등록 1단계 — MONKOS AI(포털 토큰 3곳) · 몽크사진관(꾸 팔레트), 현행 그대로"
---

# 디자인 시스템 아티팩트 등록 — 1단계 (현행 그대로)

**[2026-10-29 15:24 KST]** iMac/소소 → 작가님 · iMac/민아 · iMac/쌍아(참고)

> 출처: ORDER_20261029_iMac민아_소소_DESIGNLAB_디자인시스템_아티팩트등록 §2 (작가님 10-29 15:09 "소소에게 맡기자"). 정본은 코드다 — 이 문서와 아티팩트는 파생이며 값이 다르면 코드가 이긴다. 통합·정리 결정 아님.

## 0. 결론 1줄

Design System 아티팩트 **2벌 등록 완료**(비공개), Design 캔버스 1장에 MONKOS AI 토큰이 **자동 적용됨을 화면으로 실증**(색 피커 Theme 탭이 아트보드의 hex를 `portal-accent`·`portal-ink` 등 토큰 이름으로 인식, 캡처 §4) + 파일 sha256 일치. **"기본값" 지정 메뉴는 현 UI 5곳을 뒤져도 없다**(§6-2) — 캔버스마다 MONKOS AI를 명시 설치하는 현행 방식으로 운용 가능.

> **[2026-10-29 16:27 KST]** 갱신: 작가님 16:21 "이제 로그인 되었어"(민아 페인 로그인 → 소소 페인에 공유 확인) 이후 캡처·메뉴 확인 완료. 15:24 초판의 "로그인 대기" 문구는 §4·§6에서 교체.

## 1. 아티팩트 URL

| 벌 | URL | 판 | 내용 |
|---|---|---|---|
| **MONKOS AI** (monkos.ai 계열) | https://claude.ai/artifact/MDy3QGJXNBQ7kf1unXAMu7 | v2 `1793254861-84d3` | 색 48 · 글꼴 패밀리 3 · 글자 크기 3 · 모서리 3 · 그림자 3 · 로고 1 · README · 커버 |
| **몽크사진관** (monk.kr) | https://claude.ai/artifact/R1CTuYuj5u3QDt6k42edV2 | v2 `1793254866-002b` | 색 13 · Pretendard 단일 · 크기 6 · 모서리 2 · 로고 1 · README · 커버 |
| 실증 캔버스 (Design) | https://claude.ai/artifact/ExZjdFNaXXN9WZfqBv8Fqp | v2 `1793254990-7fe5` | 허브 CTA 카드 1장(480×320) + `project/ds/monkos-ai/tokens.json` 설치 |

- 등록 방법: `/design-sync` 스킬은 이 세션에 없음(DesignSync 도구만 존재, "스킬이 시작할 때만" 조건 + 독립판 12-14 폐쇄) → 브리프 §2-2 대안 **Artifact Design System 타입**(`5M7UeXXcx16TP3vzVFNDzd`). 등록 전 계정 내 Design System 아티팩트 0건 실측.
- 표기: ch8 4조 표기표 — 아티팩트명 "MONKOS AI" / "몽크사진관". 각 README에 다른 도메인 표기 반입 금지 명시.
- 공유 링크 미발행(비공개 기본값). 외부는 열 수 없다.

## 2. 추출 원천 (10-29 15:13 재실측 — 10-02 지도와 행 번호 동일)

| 접두/벌 | 정의처 | 행 | 옮긴 것 |
|---|---|---|---|
| `portal-` | `monkos_AI/portal/public/css/portal.css` `:root` | 9~47 | 색 25(잉크 5단·주색 4단·초록·deep·Cr 코인 금색 8), 글꼴 3(27~29), `--cr-shadow-sm`(45). `--cr-coin-gradient`(conic)는 토큰 문법 밖이라 제외 |
| `shell-` | `monkos_AI/portal/lib/cms/render-shell.js` `:root` | 106~119 | 색 12. 웹폰트 `<link>` 101~102, body 글꼴 123은 README에 기록(Pretendard variable **버전 미고정** 로드) |
| `specs-` | `monkos_AI/portal/public/components/specs-funnel/tokens.css` | 4~25 | 색 12·모서리 3·그림자 2·글자 크기 3. 소비 0건 사실을 usage에 명기 |
| 몽크사진관 | `MONK_kr/monk_studio/id_photo/id_photo.html` `:root` | 59~65 | 꾸 지정 TEAL/GRAY 5값(`family/family.html` 88~94·`profile/profile.html` 85~91 동일값) + `muted #78909C`(82) |
| 몽크사진관 | `id_photo/{deluxe,standard,premium}.html` `tailwind.config` | 23~36 | `monk #FBBF24`·`tiffany #0ABAB5`·`gray.900 #111827`·sans Pretendard — 구 팔레트, **값 그대로**(tw- 접두) |
| 몽크사진관 | `monk_studio.html` | 86~95·127~128 | 홈 잔존 클래스 팔레트(`#089a96`·`#1A437C`) |
| 로고 | `monkos_AI/portal/public/monkos-icon.svg` / `MONK_kr/images/monk-logo.png` 844×244 | — | 원본 그대로 업로드(blob `eb57c9cf…` / `f8b0fce4…`) |

제외(브리프 범위 밖, README 미해결에 기재): T4 정적 HTML 인라인 `:root` 14파일(credits.html 다크 등), T5 home.css(`--teal #00D4AA`), monk.kr 파비콘.

## 3. 같은 역할, 다른 값 — 통합하지 않고 표로 (MONKOS AI README §"같은 역할, 다른 값"과 동일)

| 역할 | `portal-` (T1) | `shell-` (T3) | `specs-` (T2) | 몽크사진관 (T6) |
|---|---|---|---|---|
| 주색 | #4a3aba (`-l` #6c5ce7) | #6c4fff | #6c4fff | 포인트 #80cbc4(최소) · 버튼 **#000** |
| 주색 2단 | — | #5a3de6 | #5a3de6 | — |
| 페이지 배경 | #fafaf8 | #f6f7fb | #fff / #f7f7fb | #eceff1 |
| 본문 글자 | #1a1a18 | #13152a | #1a1a1a | #263238 |
| 보조 글자 | #73726c | #4a4f6e | #555 / #888 | #455a64 / #78909c |
| 테두리 | #e8e6e1 | #e4e6f0 | #e8e8ef | #cfd8dc |
| 성공 | #1a7a5c | #34d399 | #16a34a | — |
| 오류/경고 | — | — | #dc2626 / #d97706 | — |
| 모서리 | 토큰 없음 | 없음 | 8/12/16px | 버튼 12px(rounded-xl) / 이미지 0 |
| 글꼴 | Pretendard+Noto Sans JP, serif·mono 선언(로드 미확인) | 동일 | (토큰 없음) | Pretendard 단일 v1.3.9 |

처리 원칙: 세 정의처를 접두로 전부 싣고, README에 "시안은 대상 표면의 접두 하나만"으로 적었다. **어느 접두를 전체 기본으로 둘지는 정하지 않았다**(§6 결정 요청 1).

대비 미달 값은 고치지 않고 usage에 "현행 그대로" 표기: `portal-ink-l`·`portal-ink-xl`·`shell-success`(1.9:1)·`specs-text-muted/faint`·`specs-success/warning`·몽크 `muted`(3.4:1)·`accent`(글자 불가).

## 4. 실증 — Design 캔버스

- 캔버스 생성 시 `quickstart`가 "기본값 없음 → 어느 시스템인지 물어라"를 냈다. 브리프 §2-3(기본값 = MONKOS AI)에 따라 **MONKOS AI를 명시 설치**: `project/ds/monkos-ai/tokens.json`(서버 복사) + `canvas.json` `designSystems` 레코드(artifact `MDy3QGJXNBQ7kf1unXAMu7`, version `1793254861-84d3`).
- **설치 확인(파일 대조)**: 캔버스에서 `project/ds/monkos-ai/tokens.json`을 읽어 sha256 `1bc3b77e…fcb55c4` = 소소가 올린 원본 tokens.json과 **일치**(9,505 bytes). 캔버스 색상 피커·텍스트 스타일 메뉴는 이 파일을 읽는다(타입 문서 기준).
- 시안 1장: 허브 서비스 카드 실카피(`portal/public/index.html:308` — "LIVE / AI 증명사진 / 여권·이력서 — 사진관 품질 AI 리터칭. ICAO 국제 규격. / 촬영 시작 →")를 `portal-*` 값으로 조판. 트윅 1개 `accent` 스와치 = #4a3aba·#6c4fff·#6c5ce7(같은 역할 다른 값을 한 자리에서 비교).
- **화면 캡처 5장** (`captures/`, 앱 내 브라우저 페인, 16:22~16:26 — 15:20·15:23·15:55 세 차례는 페인 미로그인으로 불가, 작가님 16:21 로그인 후 공유 확인):
  1. [실증 캔버스 — 허브 CTA 카드 161% 핏](captures/CAPTURE_20261029_소소_실증캔버스_허브CTA카드_161pct.jpg) — 아트보드 "허브 CTA 카드 — portal-* 토큰" 렌더(Pretendard·portal-bg·카드·LIVE 배지·#4a3aba 버튼)
  2. [색 피커 — MONKOS AI 토큰명 인식](captures/CAPTURE_20261029_소소_실증캔버스_색피커_MONKOS_AI토큰명.jpg) — **"작동한다"의 증거.** 요소 선택 → 색 피커 **Theme** 탭 "In this artboard"에 `portal-ink`·`portal-accent`·`portal-accent-l`·`portal-green`·`portal-ink-m`·`portal-ink-l`·`portal-white`가 **이름으로** 나열되고 아래 "MONKOS AI" 섹션이 이어짐. 인라인 hex를 설치된 tokens.json과 대조해 토큰으로 묶은 것
  3. [DS MONKOS AI 개요·커버](captures/CAPTURE_20261029_소소_DS_MONKOS_AI_개요_커버.jpg) — 커버(3컬럼 타일+점 격자) + README 상단. 커버는 첫 로드에 비어 있다가 스크롤·재진입 후 렌더(지연 로드)
  4. [DS 몽크사진관 개요·커버](captures/CAPTURE_20261029_소소_DS_몽크사진관_개요_커버.jpg) — 커버(3:4 프레임 격자) + README 상단. 같은 지연 로드(10초 대기만으로는 빈 칸, 스크롤 후 렌더)
  5. [설정 › 디자인 시스템 목록](captures/CAPTURE_20261029_소소_설정_디자인시스템_목록5.jpg) — 5개 중 2개가 이번 등록분(§6-2)
- 콘솔: 405 리소스 오류 3건(아티팩트 페이지 공통, 렌더 영향 없음 — 원인 미추적).

## 5. 산출 파일

- 이 문서 · 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-29_iMac_소소.md` · PF_DESIGNLAB 히스토리 1행.
- 아티팩트 원본 파일은 레포 밖 스크래치(`ds-monkos/`·`ds-monk/`·`ds-canvas/`)에 있고 아티팩트가 정본 사본을 가진다. 레포에는 넣지 않았다(코드가 정본, 아티팩트는 파생).
- 서비스 코드 수정 0 · 배포 0 · monk.kr 값 변경 0 · 토큰 통합 0.

## 6. 미해결 · 결정 요청 (닫힌 질문)

1. **시안 기본 접두** — monkos.ai 시안을 낼 때 기본으로 쓸 정의처: ① `portal-`(portal.css, 앱 셸) ② `shell-`(render-shell, CMS 페이지) ③ 표면별로 매번 지정(현행 README 문구 유지). 통합 결정과 맞닿아 있어 소소가 정하지 않았다.
2. **기본값(default) 지정 — 현 UI에서 메뉴 미발견.** 도구 쪽은 "사용자 또는 조직이 지정한 기본값이 있으면 묻지 않고 적용"이라 하나, 다음 5곳에 지정 항목이 없다(16:23~16:26 실측): ① 아티팩트 페이지 제목 메뉴(이름 변경·복제·공유·새로고침·고정·저장 공간·신고·삭제) ② 갤러리 `claude.ai/code/artifacts` 카드 메뉴(고정·이름 변경·복제·링크 복사·삭제) ③ **설정 › 디자인 시스템**(목록은 있음) 행 메뉴(새 탭에서 열기·공유·이름 변경·삭제) ④ 설정 › 일반 ⑤ 사용자 지정(Skills·커넥터·플러그인). 설정 목록의 "사용 가능 대상" 열이 두 벌 모두 **본인만**이라 조직 기본값은 공유 범위와 묶여 있을 가능성(미확인). **당분간 운용 = 캔버스마다 MONKOS AI 명시 설치**(이번 실증과 동일, 소소가 처리). 작가님 클릭이 필요한 항목은 현재 없다.
   - 부수 발견: 설정 › 디자인 시스템 목록에 **독립 실행형(옛 claude.ai/design) 3건**이 더 있다 — "Industry"(2026-09-09), "Design System"(2026-04-29), "MONKOS Design System"(게시일 없음). Artifact 도구의 Design System 목록에는 안 잡히는 별도 계열이며, 독립판은 12-14 폐쇄 예정. **결정 요청**: 셋의 내용 확인 후 아티팩트로 이관할지·버릴지(소소가 내용 조사 가능, 삭제는 작가님).
3. **T4·T5 등록 여부** — 정적 HTML 14파일·home.css 토큰을 2단계에 넣을지.
4. 기존 `monkos-ops/tech/guides/DESIGN_SYSTEM.md`(03-14, 스테일)는 손대지 않았다. 아티팩트 README와의 관계(리다이렉트 노트 여부)는 쌍아 판단.

## 7. 소요

- 세션 컨텍스트 315k / 1M(32%, 15:23 `get_usage`). 5시간 창 37%, 주간 Fable 14%.
- 서브에이전트 0(팀 없이 완료 — 브리프 §0 "이 과제는 팀 없이도 된다").

## 8. 독립 실행형(옛 claude.ai/design) 디자인 시스템 3건 조사 — 이관 판단 자료

**[2026-10-29 17:04 KST]** iMac/소소 → 작가님 (출처: 작가님 17:01 "조사해"). 방법: DesignSync 도구는 인증 필요로 불가 → 앱 내 브라우저 페인에서 설정 › 디자인 시스템의 링크로 각 프로젝트 열람(읽기만, "Check"는 이동 가능 여부 점검 버튼으로 변경 없음). 독립판은 **12-14 폐쇄**("You can keep using this version until December 14").

| # | 이름 | 생성 | 내용 | 이동 점검(Check) | 판정 |
|---|---|---|---|---|---|
| 1 | **Industry** (`/design/p/e9399313…`) | 2026-09-09 게시, "Published", org default 버튼 있음 | 내장 템플릿 파생 — 스틸블루 #5980a6·Barlow Condensed/Barlow·청사진 와이어프레임(모서리 + 마크). MONK 브랜드와 무관 | **이동 불가** — "Design systems that started from a built-in one can't move." 다운로드만 가능 | **버림**(내장 템플릿이라 보존 가치 0). 삭제는 작가님 |
| 2 | **Design System** (`/design/p/019dd785…`) | 2026-04-29 13:35 KST(UUIDv7) | **빈 프로젝트** — "Set up your design system" 설정 마법사 첫 화면에서 멈춤, 생성물 없음 | 해당 없음 | **버림**. 삭제는 작가님 |
| 3 | **MONKOS Design System** (`/design/p/019dd7d5…`) | 2026-04-29 15:03 KST(UUIDv7), **미게시** | 철창이 자료(`철창이/` 폴더: MONKOS_Pricing_v2.jsx·크롭앱 프로토 jsx·REALIGN_20260419 설계서·에코시스템 SVG·OG 카드·스크린샷)로 생성한 실질 시스템. README(콘텐츠 원칙·시각 기초·아이콘)·colors_and_type.css·카드 15장·UI 키트 2(idphoto 모바일·monkos.ai 마케팅 데스크톱)·마크 SVG 3(**재구성본** — 원본 아이콘 미수신) | **이동 가능** — "Nothing found in the way" | **이관 보존 권고**(아래) |

### 8-1. MONKOS Design System(04-29 철창이안) — 현행 코드 정본과의 관계

- 팔레트가 **다크 제품 + 라이트 마케팅 2계열**: 보라 #6C5CE7(주)·#5C4EBA(OG 워드마크), 다크 사다리 #06080D→#0A0E17→#0E1219→#151B25→#1A2235, 텍스트 #F1F5F9/#94A3B8/#64748B, 시맨틱 #10B981·#F59E0B·#EF4444·#3B82F6, 에코시스템 4색(#85B7EB·#5DCAA5·#F0997B·#AFA9EC). 글꼴 Pretendard/Noto Sans JP/Inter/JetBrains Mono(전부 대체 로드), Lucide, 4pt 그리드, 앱 아이콘 rx 22.
- 현행 코드(§3)와 겹치는 값: #6C5CE7 = `portal-accent-l`(portal.css:21), #0A0E17 = `portal-deep`(portal.css:26). **다른 값**: 현행 기본은 **라이트**(`portal-bg` #fafaf8, 주색 #4a3aba / #6c4fff)인데 이 안은 **다크 제품 UI**를 전제. 즉 04-29 시점 프로토·설계서 기반 **구상안**이지 현행 정본 반영이 아니다. 그 세션의 자가 고지도 "live 사이트 HTML 없이 OG 카드·크롭앱 코드로 재구성" "아이콘 미수신·마크는 재구성" "폰트 대체".
- 그래서 **기본값·시안 근거로 쓰지 않는다**(정본은 코드, 1단계 원칙). 가치는 ① 철창이의 콘텐츠 원칙(보이스·캐싱·숫자 표기·금지 패턴) ② 에코시스템 4색 ③ UI 키트 2장 — **참고 자료**로서.

### 8-2. 닫힌 선택 (작가님)

1. **MONKOS Design System** — ① **이관 보존**(권고: 작가님이 해당 페이지 "Check → Move" 1클릭 → 아티팩트로 이동, 이름 뒤에 "(04-29 철창이안·참고)" 붙여 기본값·시안 근거에서 제외) ② 버림(12-14 자동 소멸, 삭제 불필요) ③ 콘텐츠 원칙·4색만 MONKOS AI README에 발췌 후 버림(소소 작업 1건)
2. **Industry·Design System** — ① 삭제(작가님, 설정 › 디자인 시스템 행 메뉴 "삭제") ② 방치(12-14 소멸)
3. 부수: 독립판에만 **"Set as org default"** 버튼이 있다. 아티팩트형 디자인 시스템의 기본값 지정 UI는 아직 없음(§6-2) — 엔스 측 이행 중으로 보임.

캡처: [Industry 이동 불가](captures/CAPTURE_20261029_소소_독립판_Industry_이동불가.jpg) · [Design System 빈 마법사](captures/CAPTURE_20261029_소소_독립판_DesignSystem_빈마법사.jpg) · [MONKOS DS 이동 가능](captures/CAPTURE_20261029_소소_독립판_MONKOS_DS_이동가능.jpg)
