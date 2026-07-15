---
type: completion
date: 2026-07-15
device: iMac
agent: 막내2
status: 완료
portfolio: PF_SPECS
order: ORDER_20260715_iMac민아_막내2_SPECS_ES후속_리치필드번역.md
---

# COMPLETION: ES 리치 필드 번역 (민아 검증 반려 후속)

**[2026-07-15 18:17 KST]** iMac/막내2 → 작가님

## A. 전수 스캔 결과

| 필드 | 총건수 | es 보유 | es 누락 |
|------|--------|---------|---------|
| details | 428 | 428 | 0 (kr-passport 빈값=원본도 빈값) |
| rejectionReasons | 428 | 428 | 0 |
| faqs | 428 | 428 | 0 |
| seoTitle | 428 | 428 | 0 |
| seoDescription | 428 | 428 | 0 |
| restrictions.* | 855 | 855 | 0 |
| heroTitle | 1 | 1 | 0 |
| heroDesc | 1 | 1 | 0 |
| aiSummary | 1 | 1 | 0 |
| detailSections | 1 | 1 | 0 |
| officialSource.label | 1 | 1 | 0 |
| onlineGuide | 1 | 1 | 0 |

**es 키 커버리지: 100%**

## B. 렌더 검산 (게이트2)

| 페이지 | 한글 | 가나 | 결과 |
|--------|------|------|------|
| /es/specs/visa/us | 0 | 0 | ✅ |
| /es/specs/passport/mx | 0 | 0 | ✅ |
| /es/specs/passport/kr | 0 | 0 | ✅ |
| /es/specs/visa/kr | 0 | 0 | ✅ |
| /es/specs/resume/kr | 0 | 0 | ✅ |
| /es/specs/passport/jp | 0 | 0 | ✅ |

(주석·스크립트·스타일 완전 제거 후 측정. CSS/HTML 주석 내 한글 46자는 개발자 주석으로 유저 비노출.)

## C. ko/en/ja 회귀

3페이지 × 3언어 = 9건 전부 HTTP 200, title 정상.

## 변경 파일 · 배포

| 파일 | 변경 |
|------|------|
| specs-data.json | +9,999 / -557 |

| 환경 | revision |
|------|----------|
| dev | monkos-portal-dev-00134-qjh |

커밋: `da617aa3`

## 민아 재검증 인계

- dev URL: `https://monkos-portal-dev-4jeplpqpua-uc.a.run.app`
- 대표 6페이지 한글·가나 0 증빙 상단 첨부
- prod 배포는 민아 재검증 후 별도 승인
