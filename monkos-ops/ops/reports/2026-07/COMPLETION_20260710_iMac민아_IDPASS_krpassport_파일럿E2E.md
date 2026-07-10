---
type: completion
date: 2026-07-10
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# COMPLETION — IDPASS kr-passport 파일럿 E2E (T0 무료 퍼널 + 땡큐 위계 + 버그 스윕)

**[2026-07-10 13:45 KST]** iMac/민아 → 작가님, iMac/쌍아(사후 추인)

> 경로③ 작가님 직접 지시(12:23) — "이건은 너가 e2e로 달려라". 워크플로우 2회(정찰 23 + 리뷰 10 에이전트, 3.3M tk) 동원.
> 근거 설계: [PROPOSAL_20260710_민아_IDPASS통합설계](../../proposals/PROPOSAL_20260710_민아_IDPASS통합설계.md) §2·§3·§9

## 배포 상태

| 항목 | 값 |
|------|-----|
| 커밋 | `b697aaff`(본체) + `2713485e`(리뷰 라운드2) |
| dev 배포 | monkos-portal-dev rev **00082** → **00083**(라운드2) — https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/kr-passport |
| prod | **미배포** (작가님 실기기 체감 게이트 대기) |

## 구현 내역

### T0 무료 퍼널 (server.js)
- `/api/idphoto/generate` 게이트 3분기: token / credits / **free** — kr-passport 한정, fit 확정 프레임 필수
- **매팅 전용 — Gemini 폴백 차단** = 무료 원가 상한 보장. 매팅 실패 시 503 + 쿼터 반환
- 쿼터 정본 = **Firestore 원자 트랜잭션** (선차감·실패 시 refund): 개인 3회/일(sid+IP 해시, KST) + **전역 300회/일 하드캡**(최악 원가 ~₩6,000/일). 서명 쿠키는 표시용 힌트
- `checkRateLimit` XFF **최우측** 교정(스푸핑 차단, 전 버킷 공통 수혜) + 서버측 `api_generate` 계측 신설(BQ)

### kr-passport 페이지 (render-specs.js, `isPilot` 스코프)
- **S1**: 수치 뱃지 제거(문제 칩만), 판정 1줄("규격에 맞아요…"), [무료로 만들기] primary + 발급보장 직행 링크
- **S3 땡큐**: 완성물 → 무조건 다운로드+다른사진(잔여 표기) → T1 카드 → **T2 잉크 카드** → 10c 이벤트 슬롯
- 가독성 토큰: 보조회색 #888(3.5:1)→#5D5A6B(6.7:1), 카드 틴트+그림자, 버튼 52px, keep-all
- GA 이벤트: free_generate_click/done, free_limit_hit, free_download, t1/t2_upsell_click, credit_slot_click

### 버그 수정 (정찰·리뷰 워크플로우 적대검증 확정분)
| # | 내용 | 상태 |
|---|------|------|
| K1 | 발급보장 각주 2회 중복 렌더 (2171+2206 무조건 삽입) | ✅ 수정 (ko 파일럿 0 / ja·en 1회) |
| K2 | 눈 45% 그린밴드 경계 플리커 → 0.42~0.46 확장 (실측 42.2~45.6 근거, blocked 40~48 불변) | ✅ 수정 — 라이브 실증: eyeRatio 0.4496 → pass |
| R2-1 | 무료 쿼터 쿠키+XFF 우회 (HIGH) | ✅ Firestore 정본+XFF 교정 |
| R2-2 | 무료 실패 3경로 에러 무음 (#v2-error가 숨은 페이즈 내부) | ✅ 페이즈 밖 공통 위치로 이동 (기존 결제 무음까지 해소) |
| R2-3 | 10c 슬롯 충전 복귀 404 (`/specs-free`) | ✅ 정본 패턴(credits=return) 동적 세팅 |
| R2-4 | T1 카드가 미동작 리터칭 판매 (플래그 off = 무료와 동일물) | ✅ 카드-플래그 결합: off 시 "곧 열려요" 비활성 |
| R2-5 | "24h 자동 삭제" 문구 무근거 (버킷 lifecycle 부재 실측) | ✅ 문구 제거 — 인프라 결정 대기(아래) |
| low | 리터칭 후 meta 미갱신 / 포즈 뱃지 접미문 비파일럿 누수 / 무료 CTA 토큰 우선 가드 | ✅ 3건 반영 |

### 리뷰 기각(적대검증 real=false) — 기록용
- HMAC 빈 시크릿 fail-open: config.js 기동 게이트(exit 1)가 선차단 — 발화 불가
- 유료 재생성 토큰 우회: 1결제 1생성(07-05 폐지)이라 피해 집단 부재 (방어 가드는 반영)

## 라이브 실증 (dev)

- **T0 실주행 2회 성공**: 콜드 58.8s / 웜 **6.2s**, track=birefnet, 33.0mm·눈 45.1%·흰배경, 서명 쿠키 발급, 매팅 실비 ~₩40 지출
- 게이트 전 케이스: FREE_REQUIRES_FIT(400) / FREE_NOT_AVAILABLE(403) / FREE_UNAVAILABLE(503) / 잔여 표기 동기
- 비파일럿 무영향: ja/en pilot=false, us-passport 301 정상, 허브 200. SEO 블록(H1·상세규정·반려사유·FAQ·구조화) 불변
- jest 50/50 통과 (GA 스위트 실패는 HEAD 기존 결함 — mock에 TEAM_CHAT_ID 부재, 본 작업 무관 확인)

## 작가님 결정 대기 ⏳

1. **실기기 체감 확인** → 통과 시 확산 게이트 3건 중 1 충족: https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/specs/kr-passport
2. **T1 리터칭 활성화**: `PILOT_T1_RETOUCH=1` env 주입 필요 — **deploy.sh 수정 = 헌법 4조 승인 대상**. 코드·재크롭·meta 갱신은 탑재 완료(잠금 상태). 활성 후 정체성·품질 실사 검증 1라운드 권장
3. **GCS lifecycle**: 비로그인 파일 24h 삭제 규칙(`idphoto/specs-visitor/` prefix) — 버킷 정책 = 인프라 결정. 유료 비로그인과 prefix 공유 이슈 포함 (리뷰 검증분 참조). 규칙 생성 전까지 삭제 약속 문구 미노출 유지
4. **prod 승격 시점**

## 이관/후속 (쌍아)

- **B5 resolvePlacement 단일화 + R1 크롭쉼(spec 폐기)**: crop-engine 실재 확정 — kr-passport 무영향이나 타 슬러그 Gemini 폴백 전체가 2규격 강제 상태. 별도 지시서 권장
- POST 핸들러 req.sessionId/paymentRegion 유실(BQ 세션 연결) / generate outer-catch 환불 공백 / matte 출고 가드창(33~58) vs 정본(40~48) 불일치 — 정찰 확정분, 우선순위 배정 필요
- fit 확정 경로가 facemesh로 폴백된 1건 관찰(산출물은 가드 통과·무해) — 원인 로그 추적 항목
- GA 테스트 스위트 수리(config mock TEAM_CHAT_ID)

## 산출물

📁 커밋 2건(b697aaff·2713485e) · 본 보고서 · 세션 로그 · PF_SPECS 1행 · 디자인 시안 아티팩트(https://claude.ai/code/artifact/5ee0ab3e-3db4-4bbf-a0b1-0b2ff7b91a78) · 워크플로우 저널 2건
