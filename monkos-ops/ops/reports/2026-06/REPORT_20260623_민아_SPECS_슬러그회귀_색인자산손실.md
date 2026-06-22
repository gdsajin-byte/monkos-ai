---
type: report
date: 2026-06-23
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# REPORT: SPECS 슬러그 회귀 — 색인 자산 손실 사고 + 복구

> **[2026-06-23 KST]** iMac/민아 → 작가님
> 연결: 재발방지 → [PROTOCOL_url_slug_safety](../../portfolios/PF_CITADEL/PROTOCOL_url_slug_safety.md) · 도메인 전략 → [STRATEGY_맥락침투_권위본진](../../../marketing/strategy/STRATEGY_20260622_맥락침투_권위본진.md)

## 1. 발견 경위
작가님이 모바일에서 `monkos.ai/specs/korea-drivers-license`(운전면허 사진규격, 구글 검색 상위) 접속 시 **`korea.txt(9바이트)` 다운로드 + "Not Found"** 발견. 404 본문 "Not Found"(9byte)가 text/plain이라 모바일 Safari가 파일 다운로드로 오인한 것.

## 2. 타임라인 (확정)
| 시점 | 사건 |
|------|------|
| 3/26 `8361d66c` | 한국 중심 **7규격 수작업** 생성 — 국가명 슬러그(`korea-passport`·`korea-drivers-license`) |
| ~5월 | 26규격으로 점증 (레거시 국가명 슬러그) |
| **5/25 `23eee3f8`** | **IDPASS 글로벌화** — `convert-specs-data.js`로 202개국 **445건 자동생성(ISO 슬러그)**. ⚠️ 기존 국가명 레거시 미정리 → **중복 발생**(korea-passport + kr-passport 공존) |
| 6/9 `140837dc` 등 | 사이트맵 등록·색인 작업 → **색인 1,580 증폭**(445×3언어) |
| **6/19 `fe0a38f3`** | M2/쌍아+꾸가 주요국 데이터 보강 중 중복 발견 → **국가명 24슬러그 삭제(korea-4·japan-5·기타15)**. ⚠️ **301 리다이렉트 누락** → 색인된 옛 URL 404 |
| 6/23 | 작가님 발견 → 민아 진단·복구 |

## 3. 영향 규모 (prod 실측)
- **죽은 URL: 120개** (24규격 × 단일형+2단형 × 3언어). 콘텐츠 자산 기준 24규격.
- 노출 큰 자산: `korea-passport` 448노출 · `korea-drivers-license` 418노출(8.7위) · `resident/korea` 166 등. **합산 월 1,000+ 노출.**
- 하필 3월부터 쌓인 **최고권위 레거시**(오래 색인됨)라 손실이 큼. 잠시 1위 노출도 기록.

## 4. 근본 원인 (2단 구조)
1. **5/25**: 자동변환이 기존 슬러그와 **중복 충돌 검사 없이** ISO를 얹음 → 한 달간 중복 색인.
2. **6/19**: 중복 정리(옳은 방향)하며 슬러그 삭제 시 **301 누락** → 자산 폐기. "이사는 갔는데 전입신고 안 함."
- 공통: **"URL 변경 = 301 필수"가 워크플로우에 없던 구조 결함.** (버그 아닌 프로세스 공백)

## 5. 복구 (적용 완료)
- `render-specs.js` `renderSpecsDetail`에 정규화 fallback: 매칭 실패 → `canonicalCountry`(국가명→ISO) + `TYPE_ALIASES`(drivers-license→license·resident→id·mynumber→id·zairyu→residence) → **301**. 404는 HTML(noindex)로 전환(모바일 다운로드 차단).
- **102/120 즉시 복구**(운전면허·여권·이력서 등 노출 큰 것 전부). 나머지 18(halfcard 12·china-resume 6)은 신규 데이터에 정본 부재 → 404 유지, **추후 데이터 보강 시 자동 복구**.
- 사이트맵·데이터는 이미 정본 통합 완료(손 안 댐). 코드 301만 보강.

## 6. 진단 과정 교훈 (자기감사)
민아가 진단 중 2회 빗나감: ① 엉뚱한 URL(`passport/korea` 2단)을 테스트 ② "어제 아님/dev 작동"을 코드회귀로 오판(실제는 dev가 배포 실패로 6/18 옛버전이라 작동한 착시). **작가님의 GSC 노출 실측이 매번 교정.** → 코더는 자기 가정에 시야 갇힌다([[feedback_audit_is_mina_role]]). 실측 데이터 우선.

## 7. 재발 방지
[PROTOCOL_url_slug_safety](../../portfolios/PF_CITADEL/PROTOCOL_url_slug_safety.md) 정본화 — ① 자동변환 중복검사 ② 슬러그 삭제 시 301+sitemap+GSC 완료조건 ③ 중복 상시 감지 ④ 배포 후 실측. **PF_SPECS 작업(데이터 확장·규격 보강 다수 예정) 시 필수 준수.**
