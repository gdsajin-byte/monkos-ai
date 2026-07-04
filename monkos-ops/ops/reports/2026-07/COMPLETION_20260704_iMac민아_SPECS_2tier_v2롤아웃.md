---
type: completion
date: 2026-07-04
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# COMPLETION — SPECS 2-티어 가격 체계 + v2 ko 전면 롤아웃 (Workflow 막내 대체 실행)

**[2026-07-04 18:24 KST]** iMac/민아 → 작가님

## 실행 체계
- 근거: [ORDER (경로③ 변형)](../../orders/2026-07/ORDER_20260704_작가님_iMac민아_SPECS_2tier_워크플로우실행.md) · [설계서](../../../tech/designs/2026-07/DESIGN_20260704_specs_2tier_가격체계.md)
- Workflow runId: `wf_90dbfdb8-532` (에이전트 10기, 92만 토큰, 57분) — 정찰3 병렬 → 구현2 → 감사 2렌즈(작성자≠감사자) → P0 보수 루프 → 재감사 → 스모크+STATUS 갱신
- 민아 독립 검증: diff 전문 리뷰 + 자체 스모크 6케이스 + dev 라이브 curl 5축 — 전부 통과

## 결과
- ✅ **v2 ko 롤아웃**: 428슬러그 중 **360건 v2** (₩2,000 주 CTA + 발급보장 ₩9,900 업셀). 68건은 엔진 호환성 게이트(정방형·비백색 배경 = 3:4 흰배경 엔진과 규격 불일치)로 v1 유지 — 감사 P0 → 보수 루프 산출물
- ✅ **오정보 하드코딩 제거**: 파일규격(500KB/JPEG)·반려사유(32-36mm)·"여권사진" 문구를 정본 데이터(fileSpec/rejectionReasons/typeName) 기반으로 교체. generate format도 typeSlug 전송
- ✅ **색인 안전**: 렌더 게이트(isV2Spec)와 1-segment 직접서빙 게이트(V2_DIRECT_SLUGS=kr-passport) 분리 — 비파일럿 427건 301 유지 실측 (PROTOCOL_url_slug_safety 준수)
- ✅ **dev 배포**: monkos-portal-dev (헬스 200). en 누출 없음·호환게이트 제외·301 전부 라이브 확인
- ✅ **STATUS_pricing 갱신**: 2-티어 확정 반영, §5 스위치 체크리스트 재편 ("티어 문맥 없는 ₩9,900 단독 간판만 버그" 판정 기준 신설)
- 📁 **발급보장 규정 초안**: [PROPOSAL](../../proposals/PROPOSAL_20260704_민아_발급보장규정초안.md) — 보상 A안(환불) vs B안(재작업+환불, 권고), 결정 요청 6항 → **작가님 승인 대기**
- 💡 **중대 발견 (정찰 실측)**: 파일럿 "₩2,000 즉시결제"는 PG 미호출 — 생성 API 무인증·무과금·무레이트리밋 직호출. 비로그인 결제 백엔드(toss/direct)는 존재하나 프런트 미연결 데드코드 + 금액 검증 부재 + 토큰 인메모리(다중 인스턴스 유실 위험)
- 💡 **부수 정리**: dev 서비스에 잔존하던 7/2 인시던트 구키(평문 LEMONSQUEEZY 2종) 제거 → Secret Manager 경유로 통일 (첫 dev 배포가 타입 충돌로 적발)

## ⏳ prod 배포 게이트 (미완, 선행 필수)
1. 토스 direct 프런트 연동 + 서버측 ₩2,000 금액 고정 + 토큰 Firestore 전환
2. 발급보장 카피 규정 작가님 승인
3. 실결제 E2E (레몬 + 토스)

## 변경 파일
- monkos_AI/portal/lib/cms/render-specs.js (+96/−32)
- monkos-ops/ops/status/STATUS_pricing.md
- 신규: DESIGN·ORDER·PROPOSAL·세션로그(민아)
- 배포: monkos-portal-dev (deploy.sh dev 경유, Secret Manager 주입 확인)
