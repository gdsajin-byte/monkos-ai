---
type: completion
date: 2026-07-19
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: usa-headshot CTA 전환 + cn-resume 레코드 분리

**[2026-07-19 13:00 KST]** iMac/막내2 → 작가님

## 결과 요약

| 항목 | 상태 |
|------|------|
| usa-headshot 퍼널 제거 + CTA | ✅ 완료 |
| cn-resume 1寸/2寸 분리 | ✅ 완료 |
| jest 녹색 | ✅ 105/105 |
| 배포 | ✅ monkos-portal-00513-g9l |
| 라이브 검증 | ✅ 4개 URL 정상 |

## 변경 파일

- `monkos_AI/portal/lib/cms/render-specs.js` — funnel disabled 분기 + TYPE_SLUG_PATTERNS + ROUTE_MAP 호환
- `monkos_AI/portal/lib/cms/specs-data.json` — usa-headshot funnel:false, cn-resume 삭제/분리
- `apps/idpass-android/app/src/main/assets/countries.jsonl` — cn-resume-1cun/2cun 추가
- `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 동상

## 라이브 URL 검증

| URL | 상태 | 확인 |
|-----|------|------|
| /specs/headshot/usa | 200 | 퍼널 없음, /headshot CTA 표시 |
| /specs/resume-1cun/cn | 200 | V2 퍼널, 25×35mm, 흰색 배경 |
| /specs/resume-2cun/cn | 200 | V2 퍼널, 35×49mm, 파란색 배경 |
| /specs/resume/cn (구 URL) | 200 | 1寸 기본값 서빙 (SEO 유지) |
| /specs/passport/kr | 200 | 무영향 확인 |

## 배포 rev

`monkos-portal-00513-g9l` (prod 100%)

## 커밋

`218c858d` — `[feat] usa-headshot CTA 전환 + cn-resume 1寸/2寸 레코드 분리 — 퍼널 정합`

## 후속

- 민아 검증 게이트 인계 대상
