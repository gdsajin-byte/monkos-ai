---
type: completion
date: 2026-07-21
device: M1
agent: 막내3
portfolio: PF_INFRA
status: 완료(PSI 수동측정 잔여)
---

# COMPLETION — specs SSG PoC: kr-passport 정적 HTML을 monk.kr에서 서빙

**[2026-07-21 15:36 KST]** M1/막내3 → 작가님

---

## 결과 요약

| 항목 | 상태 |
|------|------|
| `scripts/build-specs-poc.js` 래퍼 작성 | ✅ 완료 (25줄, render-specs.js 무변경) |
| kr-passport HTML 정적 생성 | ✅ 501줄, 40.1KB |
| monk.kr 배포 + 접속 확인 | ✅ `https://monk.kr/specs-test/kr-passport/` 200 OK |
| SSR vs SSG diff | ✅ 아래 상세 |
| PSI 측정 | ⏳ API 쿼터 초과 — 수동 측정 필요 |
| PF_INFRA 히스토리 | ✅ 1행 어펜드 |

---

## SSR vs SSG 비교

### 일치 항목

| 항목 | 결과 |
|------|------|
| HTML 구조 (태그, 클래스, 콘텐츠) | ✅ 일치 |
| SEO title | ✅ `대한민국 여권 사진 규격·규정 2026 — 3.5×4.5cm·배경·복장 \| MONKOS` |
| SEO description | ✅ 일치 |
| JSON-LD (BreadcrumbList + Article + FAQPage) | ✅ 3개 동일 |
| OG meta | ✅ 일치 |
| canonical URL | ✅ `https://monkos.ai/specs/passport/kr` |
| hreflang 6개 언어 | ✅ 일치 |
| 규격 데이터 (사이즈·배경·머리높이 등) | ✅ 일치 |
| 이미지 (도해) | ✅ GCS/CDN 절대 URL — monk.kr에서도 정상 로딩 |
| CSS/JS 로딩 | ✅ monk.kr에서 전 자산 200 응답 |

### 예상된 차이 (정상)

| 항목 | SSG (monk.kr) | SSR (monkos.ai) | 비고 |
|------|---------------|-----------------|------|
| 캐시 버스트 | `?v=dev` | `?v=monkos-portal-00524-dnq` | K_REVISION 환경변수 차이 |
| T1 리터칭 카드 | "곧 열려요—준비중" (disabled) | "AI 보정으로 업그레이드" (active) | PILOT_T1_RETOUCH 환경변수 미설정 |
| `__SPECS_CFG__.t1` | `false` | `true` | 동일 원인 |
| CF challenge 스크립트 | 없음 | 있음 (CF 프록시 주입) | 인프라 차이 |
| HTML 크기 | 57,089 bytes | 56,283 bytes | T1 상태 문자열 + CF 스크립트 차이 |

### 결론

**SSG 전환 기술적으로 가능.** 핵심 콘텐츠·SEO 메타·구조화 데이터 100% 일치. 차이는 모두 환경변수(T1 리터칭 게이트)와 런타임 인프라(CF challenge, K_REVISION)에서 발생 — 빌드 시 환경변수를 주입하면 해소 가능.

---

## PSI 측정

PSI API 쿼터 초과 (`quota_limit_value: 0`)로 자동 측정 불가.

- **SSR 기준점** (지시서 명시): 모바일 55점 / 데스크톱 84점
- **SSG 측정**: `https://pagespeed.web.dev/analysis?url=https://monk.kr/specs-test/kr-passport/` 에서 수동 확인 필요

💡 SSG는 TTFB에서 유리 (CF CDN 정적 서빙 vs CR 동적 렌더) — 모바일 점수 상승 기대.

---

## 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/build-specs-poc.js` | 신규 — SSG 빌드 래퍼 |
| `MONK_kr/specs-test/kr-passport/index.html` | 신규 — 빌드 출력 |

---

## 배포

- CF Pages: `https://monk.kr/specs-test/kr-passport/`
- 배포 rev: `ebc5fe1a`
