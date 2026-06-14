---
type: order
id: ORDER_20260614_iMac쌍아_막내_SPECS_사이트맵재정리_Phase1
date: 2026-06-14 13:37 KST
from: iMac/쌍아
to: 막내
portfolio: PF_SPECS
priority: P1
status: 완료 (배포 대기)
---

# 사이트맵 재정리 Phase 1 — specs 매핑 감사 + 301 + canonical + 사이트맵 분할 + lastmod

> **[2026-06-14 13:37 KST] iMac/쌍아 → 막내**
> 귀속: PF_SPECS
> 근거: PROPOSAL_20260614_웹민아_사이트맵재정리_색인복구.md
> 작가님 결정: specs 정본 = monkos.ai, monk.kr/specs = 301

---

## 목표

monkos.ai 사이트맵·색인 신뢰성 복구. 색인율 19%(302/1,584) → 구조적 원인 해소.

---

## 작업 항목 (순서대로)

### 1. 매핑 감사 (단계0 — 최우선, 후속 전부의 전제)

monk.kr specs 442 URL과 monkos.ai specs URL의 1:1 대응표를 작성한다.

- monk.kr 계층: `/specs/korea/drivers-license`
- monkos.ai 평면: `/specs/korea-drivers-license`
- 매핑 방식: monk.kr의 `/{country}/{doc}` → monkos.ai의 `/{country}-{doc}` 변환 후 실존 확인
- **산출물**: `monkos-ops/tech/specs/SPECS_URL_MAPPING.md` — 테이블 (monk.kr 경로 | monkos.ai 경로 | 상태: 매칭/누락)
- ⚠️ **대응 없는 URL은 301 대상에서 제외**. 누락 목록만 보고.

### 2. 301 리다이렉트 (단계1)

매핑 테이블 기반으로 monk.kr/specs/* → monkos.ai/specs/* 301 설정.

- 구현 위치: `MONK_kr/` — Cloudflare Pages `_redirects` 파일 또는 `functions/`
- monk.kr `robots.txt`에서 `Sitemap: .../specs/sitemap.xml` 선언 제거
- **배포**: Cloudflare Pages (monk.kr)

### 3. canonical 보강 (단계1 병행)

monkos.ai specs 페이지에 자기참조 canonical `<link rel="canonical">` 확인·보강.

- 확인: monkos.ai specs 페이지의 `<head>`에 canonical 존재 여부
- 누락 시: `monkos_AI/portal/` 해당 템플릿에 `<link rel="canonical" href="https://monkos.ai/specs/{slug}">` 삽입
- **배포**: Cloud Run (monkos-portal) — `deploy.sh` 경유

### 4. 사이트맵 인덱스 분할 (단계2)

`monkos_AI/portal/lib/cms/render-sitemap.js` 리팩터.

- `/sitemap.xml` → sitemap index로 전환
- 하위맵: `sitemap-static.xml` / `sitemap-specs.xml` / `sitemap-blog.xml`
- `robots.txt`는 인덱스 1개만 선언
- 분할 후 URL 합계 = 기존 1,584와 동일 (누락 금지)

### 5. lastmod 실갱신일 (단계3, 단계2와 병행)

`render-sitemap.js:14`의 `today` 박제 제거.

- specs: SPECS_DATA에 갱신일 필드 있으면 사용, 없으면 콘텐츠 기준일/배포일
- static: 파일 최종 수정일 또는 고정 날짜
- blog: 기존 실 updatedAt 유지 (변경 없음)

---

## ⚠️ 준수 조항

- Cloud Run 배포는 **deploy.sh 경유** (ch5 2조)
- Cloudflare Pages 배포는 해당 배포 절차 따름
- render-sitemap.js 리팩터 시 **기존 URL 누락 금지** — 분할 전후 합계 검증
- specs 장르·국가 재분류 **범위 밖** — URL 구조만 다룸

## 💡 특별 권한

- **Workflow tool 사용 허가** (작가님 승인 2026-06-14). 매핑 감사(442건 URL 대조) 등 대량 병렬 처리가 필요한 단계에서 Workflow를 활용하여 효율적으로 처리할 것.

---

## 검증

1. **301**: monk.kr/specs/ 샘플 10건 `curl -I` → 301 → monkos.ai 200 (404·루프 0)
2. **canonical**: monkos.ai/specs/ 샘플 5건 `curl -s | grep canonical` → 자기참조 확인
3. **사이트맵**: 인덱스 + 하위맵 각각 200 응답. 하위맵 URL 합계 = 기존 1,584
4. **lastmod**: 동일 페이지 2일간 사이트맵에서 lastmod 불변 확인 (today 박제 해소)
5. **GSC**: 사이트맵 재제출

---

## 산출물

- `monkos-ops/tech/specs/SPECS_URL_MAPPING.md` — 매핑 테이블
- `MONK_kr/_redirects` (또는 functions/) — 301 설정
- `render-sitemap.js` 리팩터 — 인덱스 분할 + lastmod 수정
- canonical 보강 (해당 시)
- 배포 2건 (monk.kr CF + monkos.ai CR)
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_SPECS 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시
