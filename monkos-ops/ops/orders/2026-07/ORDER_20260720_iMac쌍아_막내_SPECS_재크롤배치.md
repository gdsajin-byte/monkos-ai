---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CITADEL
---

# 지시서: specs 헤드 슬러그 재크롤 배치 — lastmod 갱신 + Indexing API

> **[2026-07-20 18:52 KST]** iMac/쌍아 → 막내
> 작가님 지시: 2026-07-20 18:51 KST

## 배경

GSC 실측: /en/specs/visa/us 마지막 크롤 6/9 — V2 완성·유니크 콘텐츠·타이틀 개선이 41일간 색인 미반영. 재크롤 신호(lastmod)가 갱신되지 않아 구글이 재방문하지 않는 상태.

## Task 1 — sitemap lastmod 갱신

**파일**: `monkos_AI/portal/lib/cms/render-sitemap.js`

현재 sitemap의 `<lastmod>`가 고정값 또는 미갱신 상태인지 확인.
- 고정값이면: 현재 날짜(빌드 시점)를 lastmod로 반영하도록 수정
- 이미 동적이면: 최근 변경이 반영 안 된 원인 추적

## Task 2 — Indexing API 재크롤 요청

`scripts/` 내 기존 Indexing API 도구를 사용하여 헤드 슬러그 재크롤 요청.

대상 우선순위 (GSC 노출 상위 + 크롤 낡은 순):
1. `/en/specs/visa/us`
2. `/en/specs/passport/us`
3. `/specs/passport/kr` (구 슬러그 `/specs/korea-passport`에서 권위 이전 가속)
4. `/en/specs/visa/bosnia` (노출 15, 클릭 0)
5. `/en/specs/visa/azerbaijan` (노출 있음, 클릭 0)
6. `/en/specs/visa/denmark`
7. `/en/specs/visa/belgium`
8. `/en/specs/visa/belarus`

Indexing API 일일 쿼터 확인 후, 쿼터 내에서 최대한 요청.

## Task 3 — 배포

lastmod 수정 시 배포 필요: `./deploy.sh`

## ⚠️ 준수 조항

- sitemap URL 경로 무변경 — lastmod 값만
- Indexing API는 기존 scripts/ 도구 경유
- ROUTE_MAP·REDIRECT_MAP 무접촉

## 완료 기준

- [ ] lastmod 갱신 구조 확인/수정
- [ ] Indexing API 재요청 건수 보고
- [ ] 배포 완료 (해당 시)
- [ ] COMPLETION 보고서 + 세션 로그 + PF_CITADEL 어펜드 + 커밋 + 푸시
