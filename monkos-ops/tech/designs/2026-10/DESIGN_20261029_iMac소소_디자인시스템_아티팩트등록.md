---
type: design
date: 2026-10-29
device: iMac
agent: 소소
status: 등록 완료 — 캡처·기본값 지정은 작가님 로그인 대기
portfolio: PF_DESIGNLAB
subject: "디자인 시스템 아티팩트 등록 1단계 — MONKOS AI(포털 토큰 3곳) · 몽크사진관(꾸 팔레트), 현행 그대로"
---

# 디자인 시스템 아티팩트 등록 — 1단계 (현행 그대로)

**[2026-10-29 15:24 KST]** iMac/소소 → 작가님 · iMac/민아 · iMac/쌍아(참고)

> 출처: ORDER_20261029_iMac민아_소소_DESIGNLAB_디자인시스템_아티팩트등록 §2 (작가님 10-29 15:09 "소소에게 맡기자"). 정본은 코드다 — 이 문서와 아티팩트는 파생이며 값이 다르면 코드가 이긴다. 통합·정리 결정 아님.

## 0. 결론 1줄

Design System 아티팩트 **2벌 등록 완료**(비공개), Design 캔버스 1장에 MONKOS AI 토큰 **설치 확인**(파일 sha256 일치). **화면 캡처와 "기본값" 지정 2건은 작가님 클릭이 필요**해 대기 중이다.

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
- **화면 캡처: 미완.** 앱 내 브라우저 페인이 claude.ai **미로그인**("이 페이지를 보려면 로그인하세요", 15:20·15:23 2회 확인). 자격 증명 입력은 에이전트 금지 영역, 9222·9223 미접속(브리프 §0), Claude in Chrome 전환은 작가님 동의 전 안 함. 작가님이 페인(tab-3, 캔버스 URL 대기 중)에서 로그인하면 즉시 캡처한다.

## 5. 산출 파일

- 이 문서 · 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-29_iMac_소소.md` · PF_DESIGNLAB 히스토리 1행.
- 아티팩트 원본 파일은 레포 밖 스크래치(`ds-monkos/`·`ds-monk/`·`ds-canvas/`)에 있고 아티팩트가 정본 사본을 가진다. 레포에는 넣지 않았다(코드가 정본, 아티팩트는 파생).
- 서비스 코드 수정 0 · 배포 0 · monk.kr 값 변경 0 · 토큰 통합 0.

## 6. 미해결 · 결정 요청 (닫힌 질문)

1. **시안 기본 접두** — monkos.ai 시안을 낼 때 기본으로 쓸 정의처: ① `portal-`(portal.css, 앱 셸) ② `shell-`(render-shell, CMS 페이지) ③ 표면별로 매번 지정(현행 README 문구 유지). 통합 결정과 맞닿아 있어 소소가 정하지 않았다.
2. **기본값(default) 지정** — 도구로는 못 건다(사용자/조직이 페이지에서 지정). 작가님이 MONKOS AI 페이지에서 기본값으로 지정하면 이후 Design 캔버스가 묻지 않고 자동 적용한다. 메뉴 위치는 로그인 후 확인.
3. **T4·T5 등록 여부** — 정적 HTML 14파일·home.css 토큰을 2단계에 넣을지.
4. 기존 `monkos-ops/tech/guides/DESIGN_SYSTEM.md`(03-14, 스테일)는 손대지 않았다. 아티팩트 README와의 관계(리다이렉트 노트 여부)는 쌍아 판단.

## 7. 소요

- 세션 컨텍스트 315k / 1M(32%, 15:23 `get_usage`). 5시간 창 37%, 주간 Fable 14%.
- 서브에이전트 0(팀 없이 완료 — 브리프 §0 "이 과제는 팀 없이도 된다").
