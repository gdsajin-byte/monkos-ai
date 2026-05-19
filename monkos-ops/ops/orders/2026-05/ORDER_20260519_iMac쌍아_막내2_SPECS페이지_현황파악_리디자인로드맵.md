---
type: order
date: 2026-05-19
from: iMac/쌍아
to: iMac/막내2
status: 대기
portfolio: PF_CROP
---

# 지시서: SPECS 페이지 현황 파악 + 리디자인 로드맵 기획

> **[2026-05-19 14:42 KST] iMac/쌍아 → iMac/막내2**

## 배경

IDPASS 앱에서 국가별 규정 카드의 "상세 보기" 링크가 monkos.ai/specs/{slug}로 연결된다. 현재 specs 페이지는 실사 이미지 없이 플레이스홀더 상태라 퀄리티가 부족하다. visafoto.com 같은 경쟁 사이트가 "러시아 여권사진 규격" 등 검색에서 상위를 차지하고 있으며, 우리 specs 페이지가 이 포지션을 가져와야 한다.

**이 지시서의 목표**: 현황을 정밀 파악하고, 리디자인 로드맵을 기획하여 보고하는 것. **코딩은 하지 않는다.**

## 사전 컨텍스트 파악 (착수 전 필수)

1. **PF_CROP 히스토리**: `monkos-ops/ops/portfolios/PF_CROP/README.md` — Phase 1(SEO+특허) + Phase 2(앱스토어) 현황
2. **PF_CITADEL** (존재하면): CITADEL Phase 관련 SEO 작업 이력

## 작업 1: 현황 파악

### 1-A. 렌더링 엔진 분석

파일: `monkos_AI/portal/lib/cms/render-specs.js` (666줄)

파악 항목:
- 허브 페이지(/specs) 구조: 어떤 국가가 나열되는지, 카드 형태, 링크 구조
- 상세 페이지(/specs/{slug}) 구조: 어떤 섹션이 있는지 (hero, 스펙 테이블, FAQ, 탈락사유 등)
- i18n 처리 방식 (ko/ja/en)
- JSON-LD 마크업 (Article, FAQPage, HowTo) 현황
- CSS 스타일링: 인라인인지 외부인지, 디자인 수준 평가

### 1-B. 데이터 분석

파일: `monkos_AI/portal/lib/cms/specs-data.json` (1,362줄)

파악 항목:
- 현재 등록된 국가/문서 수
- 각 항목의 필드 구조 (slug, country, type, size, px, dpi, background, head, validity, details, rejection, faq 등)
- 이미지/실사 필드 유무 — 플레이스홀더 상태인지 확인
- 2차 검수 리포트(A+B 114건)와의 갭 분석: specs-data.json에는 있는데 리포트에는 없는 것, 또는 반대

### 1-C. 크롭앱 데이터와의 관계

파일: `apps/crop-app/data/specs-data-v2.json` (476줄) + `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` (202국)

파악 항목:
- 웹 specs-data.json vs 크롭앱 specs-data-v2.json vs iOS countries.jsonl — 3개 데이터 소스의 필드 차이, 중복, 불일치
- 단일 정본 통합 가능성 평가

### 1-D. 프로토타입 확인

파일: `monkos_AI/portal/_proto/specs-passport-proto.html` (705줄)

- 브라우저에서 열어 시각 확인 (CDP 또는 로컬)
- 현재 디자인 수준 평가
- IDPASS 앱 디자인 톤(다크 HUD, #05080E/#00D4AA)과의 괴리도

### 1-E. 경쟁사 벤치마크

아래 3개 사이트의 "한국 여권사진 규격" 페이지를 확인:
- visafoto.com (ko.visafoto.com/kr-passport-photo)
- ivisaphoto.com
- passport-photo.online

파악 항목:
- 페이지 구조 (어떤 섹션이 있는지)
- SEO 전략 (title, meta, H1, 구조화 데이터)
- 이미지 활용 (Before/After, 규격 다이어그램, 탈락 예시 등)
- CTA 전략 (유료 서비스 유도 방식)
- 우리 차별점이 될 수 있는 것

## 작업 2: 리디자인 로드맵 기획

현황 파악 결과를 바탕으로 아래를 기획:

### 2-A. 페이지 구조 제안

- 허브 페이지(/specs): 국가 카드 그리드 구조, 검색/필터, 대륙별 분류
- 상세 페이지(/specs/{slug}): 섹션 구성 (hero + 스펙 카드 + 촬영 가이드 + 탈락사유 + FAQ + 공식 링크 + CTA)
- IDPASS 앱과의 디자인 톤 통일 방안

### 2-B. 데이터 통합 전략

- 3개 데이터 소스(specs-data.json / specs-data-v2.json / countries.jsonl) 통합 방안
- 2차 검수 리포트의 공식 URL/특이사항 반영 방안
- 단일 정본 원칙(헌법 3조 4항) 준수 구조

### 2-C. 콘텐츠 확보 계획

- 실사 이미지 필요 목록 (Before/After, 규격 다이어그램, 탈락 예시)
- i18n 우선순위 (ko → en → ja)
- 국가 우선순위 (트래픽/검색량 기반 추천)

### 2-D. Phase 제안

- Phase별 작업 범위, 소요 추정, 우선순위 제안
- CITADEL SEO 작업과의 연계점

## 완료 기준

- [ ] 현황 파악 5개 항목(1A~1E) 전수 보고
- [ ] 리디자인 로드맵 4개 항목(2A~2D) 기획안 제시
- [ ] 경쟁사 3곳 벤치마크 표 (구조/SEO/이미지/CTA 비교)
- [ ] 데이터 통합 전략 (3소스 갭 분석 테이블 포함)

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- ch7 6조: 막힘 시 PF 선행 참조
- **코딩 금지** — 이 지시서는 조사+기획만. 코딩은 후속 지시서에서 진행
- 헌법 4조 4항: 되는 것만 응답. 추정 데이터 금지

## 참조 파일

| 파일 | 위치 | 용도 |
|------|------|------|
| 렌더링 엔진 | `monkos_AI/portal/lib/cms/render-specs.js` | 현재 specs SSR |
| 데이터 정본 (웹) | `monkos_AI/portal/lib/cms/specs-data.json` | 웹 규격 데이터 |
| 데이터 (크롭앱) | `apps/crop-app/data/specs-data-v2.json` | 크롭앱 규격 데이터 |
| 데이터 (iOS) | `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` | iOS 202국 데이터 |
| 프로토 | `monkos_AI/portal/_proto/specs-passport-proto.html` | 디자인 프로토 |
| 2차 검수 리포트 | `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내*_2차검수_*.md` | 공식 URL+특이점 |
| PF_CROP | `monkos-ops/ops/portfolios/PF_CROP/README.md` | 컨텍스트 |

## 산출물

- `monkos-ops/ops/reports/2026-05/REPORT_20260519_막내2_SPECS페이지_현황파악_리디자인로드맵.md`

## 보고

완료 후 `✅❌💡⏳📁🔀` 형식으로 보고.
