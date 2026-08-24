---
type: completion
date: 2026-08-24
device: iMac
agent: 민아
subject: "specs CF 엣지 정적화 + monkos.ai 컷오버 (Phase 0+1 통합 실행)"
status: 완료
portfolio: PF_SPECS, PF_PORTAL
---

# COMPLETION — specs CF 엣지 정적화 + monkos.ai 컷오버

**[2026-08-24 15:20 KST]** iMac/민아 → 작가님

> 근거: 작가님 직접 지시 "직접 진행해" (경로③, 쌍아 사후 추인 대상)
> 스코프 정본: [REPORT_20260824_iMac민아_포털CF이관_정적화_스코프.md](REPORT_20260824_iMac민아_포털CF이관_정적화_스코프.md)

## ✅ 결과 요약

monkos.ai 전 트래픽이 CF Worker(`monkos-portal-edge`) 경유로 전환됨.
- **specs 2,574p + 리스트 6 + 사이트맵 7** = 엣지 정적 서빙 (오리진 무접촉)
- **그 외 전부**(API·auth·admin·blog·home·구슬러그 301·404) = 오리진(run.app) 폴백 — 무수정 동작
- 롤백 = CF 대시보드에서 apex 8레코드 프록시 토글 OFF (레코드·도메인 매핑 무손실 유지 중)

## 📁 변경 파일

| 파일 | 내용 |
|---|---|
| `portal/tools/specs-ssg/build.mjs·build.sh` | SSG 빌드 신설 — render-specs.js 정본을 res 목킹 캡처 (렌더 로직 포크 0). PILOT_T1_RETOUCH prod 미러. 에러 무음 금지(1건이라도 exit 1) |
| `portal/edge/worker.mjs·wrangler.toml·deploy.sh` | 엣지 워커 신설 — 정적 우선 + 오리진 폴백 + `__REGION__` 국가별 재작성 + page_view 중계(waitUntil) |
| `portal/lib/shared/edge-trust.js` | 신설 — CF 공표 대역 신뢰 프록시 패턴 (스푸핑 무효: 피어 CF 대역 검증 시에만 X-Monkos-* 헤더 신뢰) |
| `portal/server.js` | 3곳: detectPaymentRegion(지역)·checkRateLimit(실IP 버킷)·/api/track(신뢰 엣지 한정 page_view 허용) |
| `portal/lib/auth.js` | effectiveHost 13곳 — OAuth redirect_uri가 run.app으로 새는 결함 차단 (컷오버 전 발견·해결) |

## 🔀 배포

| 대상 | 리비전/버전 |
|---|---|
| monkos-portal (Cloud Run prod) | **00547-klq** (edge-trust 패치. 직행 경로 무회귀 실측) |
| monkos-portal-edge (CF Worker) | 4a3e54da + 자산 3,969파일. 존 라우트 `monkos.ai/*` |
| DNS | apex A×4·AAAA×4 프록시 ON (작가님 대시보드 실행 15:06) |

## ✅ 검증 (컷오버 후 전수)

1. 6언어 상세 전부 200 (정적) / 지역 재작성 KR→'kr' 실측
2. 구슬러그 301 → 정본 (오리진 폴백)
3. SSR 표면 6종(/·blog·pricing·faq·guide·headshot) 200
4. OAuth redirect_uri = `https://monkos.ai/...` (신뢰 XFH 경유)
5. API: credits 403(정상 게이트)·track 204
6. 사이트맵 specs-ko 429·blog 223(오리진)·robots·llms 200
7. admin 가드 401 유지
8. canonical + hreflang 7종(6언어+x-default) 정합
9. page_view 중계 착지 실측 (Cloud Run 로그 204 확인)
10. 웹훅 안전: security_level low·bot fight off·browser check off

## 💡 정직 보고 — 트레이드오프·잔여

- **KR TTFB +0.2s** (0.26→0.45s): CF 무료플랜이 KR 트래픽을 미국 콜로(SJC)로 라우팅. specs 주 타깃=글로벌(T0 전략)이라 수용 판단. 글로벌 리전은 개선 방향
- **⏳ specs 갱신 시 엣지 재배포 필수**: specs-data.json·렌더러 변경 → `portal/edge/deploy.sh` 실행 (미실행 시 오리진 폴백이 흡수하나 구본 잔존). 포털 deploy.sh 연동은 4조 1항(deploy.sh 수정 승인) 대상이라 미실행 — 후속 제안
- **⏳ Phase 3 (포털 웜 해제)**: 오리진 히트 감소 실측 후 별도 승인 건
- **⏳ Phase 2 (blog·home CMS 정적화)**: 스코프 분리 유지 (발행 훅 구조 필요)
- **⏳ GSC 색인 7일 모니터링**: 사이트맵·색인 상태 관찰 필요
- **기존 이슈 (본 건 무관)**: portal jest 9스위트 ESM 로드 실패 — 내 변경 전부터 동일 (stash 대조 실측)
- **잔여 인수 상태**: idphoto-kr deploy.sh 웜 해제(08-23 오더) 미커밋 유지 — 해당 오더 소관

## 사후 추인 요청

경로③ 실행분 — 쌍아 사후 추인 대상:
1. server.js·auth.js 프로덕션 패치 (신뢰 엣지)
2. CF Worker 신설 + 존 라우트 (신규 배포 표면 — 도구 맵 등재 필요)
3. deploy.sh 경유 원칙의 엣지 확장 (edge/deploy.sh 신설로 준수)
