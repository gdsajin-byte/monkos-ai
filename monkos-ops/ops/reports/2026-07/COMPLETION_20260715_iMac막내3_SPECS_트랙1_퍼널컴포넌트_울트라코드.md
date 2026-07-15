---
type: completion
date: 2026-07-15
device: iMac
agent: 막내3
status: 완료 (dev 배포 — prod는 민아·쌍아 교차 검증 후 별도 승인)
portfolio: PF_SPECS
order: ORDER_20260715_iMac민아_막내_SPECS_트랙1_퍼널컴포넌트_울트라코드.md
---

**[2026-07-15 17:17 KST]** iMac/막내3 → 작가님

# COMPLETION: SPECS 트랙1 퍼널 컴포넌트 통합 리팩토링 (울트라코드)

## 지시서

- 원본: `monkos-ops/ops/orders/2026-07/ORDER_20260715_iMac민아_막내_SPECS_트랙1_퍼널컴포넌트_울트라코드.md`
- 후속: `monkos-ops/ops/orders/2026-07/ORDER_20260715_iMac민아_막내3_SPECS_트랙1_커밋7_퍼널문자열_3언어완결.md`

## 커밋 이력 (7건, 순서 고정)

| # | SHA | 메시지 | 유형 |
|---|-----|--------|------|
| 1 | `ca0212e8` | specs-i18n 모듈 분리 — SPECS_I18N·COMMON_RULES·V2 폴백·RESTR_LABELS 추출 | refactor |
| 2 | `d213d8ef` | 1층 SSR 섹션 컴포넌트 분해 — specHero·specDiagram·specCard·docsAccepting·faqSection·relatedServices | refactor |
| 3 | `c168d47e` | SpecsFunnel 위젯 추출 — SSR 마크업 분리 + mount(el, opts) 패턴 | refactor |
| 4 | `68d4ef5d` | isPilot 폐지 + T0 무료 퍼널 전 언어 개방 + 구형 유료 직행 분기 삭제 | feat |
| 5 | `64b2a842` | attire-picker 편입 + specs-pilot.css 흡수 + D6 게이트 재정의 | feat |
| 6 | `7952895a` | 카피 교체 + 서버 에러 code 매핑 + rejection reasons 3언어화 | fix |
| 7 | `31ce5c45` | 퍼널 유저 대면 문자열 43건 3언어 완결 + typeName·통화 분기 (민아 반려 후속) | fix |

## 변경 파일 목록

### 신설
| 파일 | 행 수 | 설명 |
|------|-------|------|
| `lib/cms/specs-i18n.js` | ~700 | SPECS 전체 i18n 사전 (3언어) |
| `lib/cms/components/spec-hero.js` | 22 | SSR 헤더 컴포넌트 |
| `lib/cms/components/spec-diagram.js` | 9 | SSR 규격 이미지 컴포넌트 |
| `lib/cms/components/spec-card.js` | 26 | SSR 규격 테이블+탭 컴포넌트 |
| `lib/cms/components/spec-funnel-markup.js` | ~200 | SSR 퍼널 마크업 컴포넌트 |
| `lib/cms/components/docs-accepting.js` | 15 | SSR 동일규격 서류 컴포넌트 |
| `lib/cms/components/faq-section.js` | 10 | SSR FAQ 컴포넌트 |
| `lib/cms/components/related-services.js` | 20 | SSR 크로스셀 컴포넌트 |
| `public/components/specs-funnel/tokens.css` | 25 | L0 디자인 토큰 |

### 수정
| 파일 | 변경 | 설명 |
|------|------|------|
| `lib/cms/render-specs.js` | 1809→~1100행 | i18n·컴포넌트·퍼널 마크업 추출, isPilot·V2_DIRECT_SLUGS 폐지 |
| `public/js/specs-funnel.js` | 1232→~1050행 | SpecsFunnel.mount 패턴, isPilot/CFG.pilot 폐지, 구형 인라인 의상 UI 삭제, 전 문자열 i18n |
| `public/css/specs-funnel.css` | +62행 | specs-pilot.css 흡수 |

### 미접촉 (관할 준수)
- `specs-data.json` — P0 관할 (막내 A 완료)
- `server.js` — 막내1 작업 중

## 설계 결정 이행 현황

| D# | 내용 | 상태 |
|----|------|------|
| D1 | isPilot 언어 분기 폐지 → 전 언어 T0 무료 퍼널 | ✅ isPilot/CFG.pilot grep 0 |
| D2 | 2계층 컴포넌트 (1층 SSR 7개 + 2층 SpecsFunnel mount) | ✅ + L0 토큰 |
| D3 | 문자열 3층 사전화 (SSR·위젯·서버 code) | ✅ 유저대면 한글 0 (en/ja) |
| D4 | 카피 개정 ('찍힌 분'→'사진 속 인물' 등) | ✅ |
| D5 | attire-picker 정식 편입 | ✅ mount 지점 + 스크립트 로드 |
| D6 | 게이트 재정의 (variant=결제 플래그, V2_DIRECT_SLUGS 폐지) | ✅ |
| D7 | 쿼터 3종 로케일 문구 | ✅ quotaExhaustedMsg·freeLimitHit·freeRetry 3언어 |

## 증빙

- **커밋2 diff 0**: 6슬러그(kr-passport·jp-passport·mu-visa·kr-visa·au-passport·us-visa)×3언어=18페이지 전수 비교 통과
- **isPilot grep 0**: 주석 2건 존치 (코드 참조 0)
- **en 유저대면 한글 0**: HTML 주석 제거 후 visible text 한글 매칭 0
- **Bug A**: 392행 '여권'→CFG.format (비자 페이지 '비자 규격 크롭' 정상)
- **Bug B**: 통화 하드코딩→CFG.market 분기 (kr=₩, global/jp=$)

## 배포

- **dev 리비전**: `monkos-portal-dev-00131-wj4`
- **dev URL**: `https://monkos-portal-dev-4jeplpqpua-uc.a.run.app`
- **prod**: 미배포 — 민아·쌍아 교차 검증 통과 후 별도 승인 대기

## 민아 검증 인계

- en: `{dev}/en/specs/visa/mu` 업로드→무료생성 → 한국어 문자열 노출 0 확인
- ja: `{dev}/ja/specs/passport/jp` 업로드→무료생성 → 한국어 문자열 노출 0 확인
- ko: `{dev}/specs/passport/kr` 업로드→무료생성 → 기존 동작 보존 확인
- 쿼터 소진 시나리오: 3회 소진 후 유료 개방 문구 로케일 일치 확인
- 결제: dev 환경에서 토스(kr)/레몬(en·ja) 통화 표기 확인
- kr-passport 1-segment URL: `{dev}/specs/kr-passport` → 301 → `/specs/passport/kr` 확인

## 미완료·후속

- ⏳ **스모크 스크린샷**: 브라우저 수동 확인 필요 (막내 CLI 환경 한계)
- ⏳ **prod 배포**: 민아 E2E + 쌍아 코드리뷰 통과 후
- 💡 **P4 SEO 후속**: kr-passport 301 반영 후 GSC 재색인 요청 (1~2주 후 스니펫 확인)
