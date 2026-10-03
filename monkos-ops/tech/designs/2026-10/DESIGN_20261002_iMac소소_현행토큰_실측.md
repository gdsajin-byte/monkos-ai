---
type: design
date: 2026-10-02
device: iMac
agent: 소소
status: 실측 완료 — 정리안 아님 (토큰 통합 여부는 별도 결정)
portfolio: PF_DESIGNLAB
subject: "현행 디자인 토큰·표면 지도 실측 — 포털 :root·specs tokens·표면 CSS·SSR 셸·monk.kr 팔레트, 같은 역할 다른 값"
---

# 현행 토큰·표면 지도 — 실측

**[2026-10-02 14:53 KST]** iMac/소소 → 작가님 · iMac/민아 · iMac/쌍아(참고)

> 출처: ORDER_20261002_iMac민아_iMac소소 §B3. 수집 = 팀원 `scout-b3-tokens`(dsn-scout, Sonnet 5.5, 14:49~14:50). 대조·보강 = 소소(14:52~14:53, `sed`·`grep` 실측).
> **정본은 코드다.** 이 문서는 파생이며, 값이 바뀌면 코드가 이긴다. `monkos-ops/tech/guides/DESIGN_SYSTEM.md`(03-14)는 수정하지 않고 차이만 §5에 적는다.
> 행 번호는 2026-10-02 14:53 워킹트리 기준(민아 미커밋 변경은 이 경로들에 없음).

## 0. 한 줄 요약 (사실)

monkos.ai 쪽 토큰 정의처는 **최소 4곳**(`portal.css :root`, `specs-funnel/tokens.css`, SSR 셸 `lib/cms/render-shell.js :root`, 정적 HTML 14개의 인라인 `:root`)이고, **주색만 해도 #4A3ABA · #6c4fff · #a78bfa · #00D4AA 네 값**이 공존한다. monk.kr은 Tailwind CDN + 페이지별 인라인이며 주색이 #FBBF24(monk) · #0ABAB5(tiffany) · #80CBC4(꾸 지정 TEAL, 09-26) 세 값이다.

## 1. 정의처 지도

| # | 정의처 | 행 수 | 성격 | 소비처(확인된 것) |
|---|---|---|---|---|
| T1 | `monkos_AI/portal/public/css/portal.css` `:root` 9~47 | 739 | 3-Column Light Theme 토큰(배경·잉크 5단·주색 4단·초록·글꼴 3·Cr 코인 금색) | portal.css 자체(var 사용 127행) |
| T2 | `monkos_AI/portal/public/components/specs-funnel/tokens.css` 5~24 | 25 | `--specs-*` 접두 토큰(07-15 D2 §L0). 색·상태 3색·모서리 3·그림자 2·글자 크기 3 | **미확인** — `specs-base.css`·`specs-funnel.css`·`specs-pilot.css`의 `var(--` 사용 **0건**(아래 §2) |
| T3 | `monkos_AI/portal/lib/cms/render-shell.js` `:root` 106~119 | — | SSR 공통 셸. `--bg #f6f7fb`, `--accent #6c4fff`, `--text-bright #13152a` 등 12개 + 웹폰트 `<link>` 2(Noto Sans JP·Pretendard variable, 101~102) | CMS 렌더 표면 전반. `headshot.css`가 쓰는 미정의 변수(`--text-bright`·`--text-dim`·`--surface2`·`--card-bg`·`--success`·`--border-hover`)의 출처 — **팀원은 범위 밖이라 "정의처 미확인"으로 반환, 소소가 찾음** |
| T4 | 정적 HTML 인라인 `:root` — 14파일(`pricing.html`·`thankyou.html`·`credits.html`·`admin/*.html` 10·`backup/v3/index.html`). 같은 변수명을 CSS 2파일(`tg/tg-style.css`·`admin/css/admin-common.css`)도 정의 | — | 페이지마다 복제. 예: `pricing.html:25~34`는 T3과 같은 값(라이트), `credits.html:24~28`은 **다크**(`--bg #0a0a1a`, `--accent #a78bfa`, `--text-bright #f8fafc`) | 각 페이지 |
| T5 | `monkos_AI/portal/public/css/home.css` 6~19 | 216 | 홈 전용 그래파이트·아크릴 토큰 14개(`--teal #00D4AA` 등) | 홈 |
| T6 | `MONK_kr/monk_studio/` 14 HTML | — | Tailwind CDN(`cdn.tailwindcss.com`) 14/14. 인라인 `tailwind.config`는 `id_photo/premium·deluxe·standard` 3파일(23~36). `:root` 5값(꾸 지정 TEAL/GRAY)은 `id_photo.html:59~65`·`family.html:89~93`·`profile.html:86~90` 3파일 복제 | monk.kr |

포털 쪽 CSS 파일 전수(11, `find public lib -name '*.css'`): portal 739 · specs-base 608 · admin/blog-editor 577 · specs-funnel 559 · headshot 470 · tg/tg-style 225 · home 216 · attire-picker 161 · specs-pilot 64 · admin/admin-common 64 · specs-funnel/tokens 25. (헌장 §4 "표면 CSS 11파일 산재"와 개수 일치.) 이번 실측의 값 표는 `css/` 6개 + tokens + T3·T4 표본까지이고, admin 2·tg·attire-picker 4파일은 **미측정**.

## 2. 파일별 하드코딩 상위값 (소소 정밀 집계 — `grep -oiE '#hex' | sort | uniq -c`, 소문자 정규화)

| 파일 | 행 | 자체 변수 | `var(--` 사용 | 하드코딩 hex 상위 5 (회수) | 글꼴 하드코딩 |
|---|---|---|---|---|---|
| portal.css | 739 | `:root` 9~47 | 127행 | #fff 14 · #fceabb 5 · #fee500 4 · #f7d06b 4 · #06c755 4 | `--serif`·`--sans`·`--mono`(27~29) |
| specs-base.css | 608 | 없음 | **0** | **#6c4fff 24** · #ffffff 18 · #1a1a1a 13 · #888 8 · #666 4 | `'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif !important`(3) |
| specs-funnel.css | 559 | 없음 | **0** | **#6c4fff 45** · #fff 29 · #1a1a1a 17 · #888 16 · #555 9 | 같은 값(4) |
| specs-pilot.css | 64 | 없음 | **0** | #fff 9 · #5d5a6b 7 · #17151f 6 · #5a3de6 4 · #dcd8e8 3 | monospace |
| headshot.css | 470 | 없음(T3 의존) | 44행 | #fff 7 · #6c4fff 3 · #8a8a9e 2 · #fbeef0 1 · #eceafb 1 | 없음 |
| home.css | 216 | 6~19 | 37행 | #fff 11 · #9aa3b2 5 · #8a93a1 3 · #6b7280 3 · #26282d 3 | `'DM Sans','Noto Sans KR',sans-serif`(23) |

> 팀원 반환 정정: 팀원은 specs-funnel `#6c4fff`를 "약 52회(근사)"로 냈다. 정밀 집계는 **45회**. 나머지 값 표·행 번호 표본 8건(portal.css:20·27·28, tokens.css:5·14~16, home.css:15~19·23, headshot.css:408·441·455)은 `sed -n` 대조 **일치**.

**사실 1 — specs 토큰 파일은 정의만 있고 소비가 없다.** T2는 `--specs-accent: #6c4fff`를 정의하지만, specs CSS 3파일은 `var(--`를 한 번도 쓰지 않고 같은 값 `#6c4fff`를 69회(base 24 + funnel 45) 직접 적었다. T2를 바꿔도 화면은 바뀌지 않는다(소비처 0 — 미확인 단서: JS·HTML 인라인 소비는 이번에 검색하지 않음).

## 3. 같은 역할, 다른 값 — 불일치 표

| 역할 | T1 portal.css | T2 specs tokens | T3 SSR 셸 | T4 credits.html(다크) | T5 home.css | headshot.css 하드코딩 | T6 monk.kr |
|---|---|---|---|---|---|---|---|
| 주색 | `--accent #4A3ABA`(20), `--accent-l #6C5CE7`(21) | `#6c4fff`(5), hover `#5a3de6`(6) | `#6c4fff`(110), `--accent2 #5a3de6` | `#a78bfa`(25) | `--teal #00D4AA`(15) | `#6c4fff`(408) | monk `#FBBF24`·tiffany `#0ABAB5`(premium.html:27~28), `--accent #80CBC4`(id_photo.html:62) |
| 배경 | `#FAFAF8`(10) | `#fff`/`#f7f7fb`(11~12) | `#f6f7fb`(107) | `#0a0a1a`(24) | `--board-grad #E4E5E8→#D7D8DC`(6) | — | `#ECEFF1`(id_photo.html:64) |
| 본문 글자 | `--ink #1A1A18`(15) | `#1a1a1a`(7) | `--text #13152a` | `--text #e2e8f0` | `--text-strong #23272e`(16), `--text-body #566070`(17) | — | `--ink #263238`(id_photo.html:60) |
| 보조 글자 | `--ink-s #3D3D3A`·`--ink-m #73726C`(16~17) | `#555`·`#888`(8~9) | `--text-dim #4a4f6e`(113) | `#8892a8`(26) | `#6B7280`(18) | `#8A8A9E`(444) | `--ink-2 #455A64`(61) |
| 테두리 | `#E8E6E1`(13) | `#e8e8ef`(13) | `#e4e6f0`(115) | `rgba(167,139,250,.12)`(27) | `rgba(255,255,255,.70)`(8) | `#E8E8EE`(428) | `--line #CFD8DC`(63) |
| 성공 | `--green #1A7A5C`(24) | `#16a34a`(14) | `#34d399`(118) | `#34d399`(28) | — | `#0E7A4A`(441) | — |
| 오류 | 변수 없음 | `#dc2626`(15), 경고 `#d97706`(16) | — | — | — | `#a32538`/`#fbeef0`(455) | — |
| 본문 글꼴 | Pretendard + Noto Sans JP(28) | (글꼴 토큰 없음) / specs CSS Pretendard(3·4) | Pretendard + Noto Sans JP(123) + `<link>` 로드(101~102) | — | **DM Sans + Noto Sans KR**(23) | — | Pretendard(14/14) |
| 장식 글꼴 | Cormorant Garamond(27), DM Mono(29) | monospace | — | — | — | — | `.font-serif`를 Pretendard로 덮음(9파일) |
| 모서리 | 변수 없음, px 하드코딩 38행 | 8/12/16px(17~19) | — | — | 하드코딩 30행 | 하드코딩 16행 | Tailwind 클래스 |
| 그림자 | 변수 없음 | card·heavy 2(20~21) | — | — | — | 미측정 | 미측정 |

보라 계열만 따로 세면 포털에 #4A3ABA · #6C5CE7 · #6c4fff · #5a3de6 · #a78bfa · #7c6cf0 · #9f7afe · #3f2e99(뒤 셋은 specs-funnel.css) **8값**.

## 4. 글꼴

| 글꼴 | 쓰는 곳 | 로드 |
|---|---|---|
| Pretendard | portal.css:28, specs-base:3, specs-funnel:4, render-shell.js:123, monk_studio 14/14 | SSR 셸 `<link>` pretendardvariable(102) / monk.kr `<link>`·`@import` pretendard@v1.3.9(6파일 @import) |
| Noto Sans JP | portal.css:28, render-shell.js:123 | 셸 Google Fonts `<link>`(101) |
| DM Sans · Noto Sans KR | home.css:23 | css 안 로드 구문 0건 — 홈 HTML `<link>` **미확인** |
| Cormorant Garamond · DM Mono | portal.css:27·29·46 | css 안 로드 구문 0건 — **미확인**(로드 안 되면 Georgia·monospace 폴백) |

`css/` 6파일 안 `@font-face`·`@import`·Google Fonts 구문 0건(양성 대조: 같은 패턴이 monk_studio `@import`에서 잡힘).

## 5. DESIGN_SYSTEM.md(03-14) 대비 차이 — 문서는 고치지 않음

| 문서 값(행) | 현행 코드 |
|---|---|
| ai `#60A5FA` 메인 AI 블루(7) | 현행 대응값 없음. 주색은 §3 표 |
| local `#10B981` 그린(8) | 현행 성공색 `#1A7A5C`/`#16a34a`/`#34d399` |
| monk `#FBBF24` 골드(9) | **일치** — monk.kr premium.html:27 등. 포털 금색은 `--cr-gold-primary #f7d06b`(portal.css:32) |
| gray.950 `#05070A` 배경(11) / gray.900 `#0B0F1A` 카드(12) | 대응값 없음(가장 가까운 것 home `--footer-bg #05080E`, monk.kr gray.900 `#111827`) |
| 다크 모드 기본(67), 헤더 `bg-gray-950/90`(27), 입력 `bg-gray-950`(42~43) | 현행은 라이트 기본(portal.css:3 "Light Theme", specs 흰 배경, monk.kr `rgba(255,255,255,.95)` 헤더). 다크는 `credits.html` 등 일부 정적 페이지에만 |
| 그라데이션 blue→purple→pink(68) | 현행 코드 미확인 |
| 글꼴 항목 없음 / tiffany 항목 없음 | 현행 Pretendard 전반 / tiffany `#0ABAB5` 존재 |

## 6. 미확인

1. T2 `--specs-*`의 JS·HTML 인라인 소비 여부(CSS 소비 0건만 확인).
2. admin 2·tg·attire-picker CSS 4파일의 값.
3. T4 14파일 중 `pricing`·`credits` 외 12파일의 실제 값(정의 존재만 확인).
4. 홈·헤드샷 HTML의 웹폰트 `<link>` — DM Sans·Cormorant·DM Mono가 실제 로드되는지(라이브 캡처로 판정해야 함).
5. monk.kr `monk_studio/` 밖 페이지(`index.html` 등).
6. 어느 표면이 어느 정의처를 실제로 먹는지의 라이브 대조(계산된 스타일) — 시각 QA 단계에서 Playwright `getComputedStyle`로 잴 것.
