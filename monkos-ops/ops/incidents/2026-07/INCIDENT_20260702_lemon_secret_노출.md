---
type: incident
date: 2026-07-02
device: 웹
agent: 민아
service: portal (Lemon Squeezy 결제)
severity: high
status: open
---

**[2026-07-02 15:37 KST]** 웹/민아 → 작가님, 쌍아

# INCIDENT — Lemon Squeezy API 키·웹훅 시크릿 채팅 노출

## 무슨 일이
- 15:36 iMac/쌍아 세션에서 `grep -ri "LEMON" monkos_AI/.env*` 실행 결과가 채팅에 출력되며 **LEMONSQUEEZY_API_KEY(JWT 전문)와 LEMONSQUEEZY_WEBHOOK_SECRET 실값이 노출**됨.
- 해당 출력이 작가님에 의해 웹/민아 세션으로 복붙되어 **2개 세션 컨텍스트에 전파**됨.
- 본 문서에는 값을 기록하지 않음. 노출 범위: Claude 세션 컨텍스트 2곳(+ 잠재적 로그·클립보드).

## 왜 문제인가 (헌법 4조 1항 · 광역오더 #8)
- API 키는 라이브 스토어 결제·주문 API 권한. 웹훅 시크릿은 **크레딧 지급 웹훅의 HMAC 서명 키** — 유출 시 위조 웹훅으로 무단 크레딧 적립 가능.
- .env에 라이브 시크릿 평문 보관 자체가 광역오더 #8 위반 상태(시크릿 정본 = GCP Secret Manager, .env는 비밀 아닌 설정값만).

## 조치 (권고 순서)
1. **[즉시·작가님]** Lemon 대시보드 → Settings→API → 해당 API 키 **폐기·재발급**. Webhook 서명 시크릿 2종(글로벌/JP) **재생성**.
2. **[즉시·작가님]** `secret` 커맨드로 신값 등록 (터미널: `secret add LEMONSQUEEZY_API_KEY` 등 — 에이전트 값 미접촉 원칙).
3. **[쌍아]** deploy.sh `--set-secrets` 경유 재배포로 Cloud Run 주입 교체 → 웹훅 E2E 1회 검증(테스트 주문).
4. **[쌍아]** `.env`에서 라이브 시크릿 제거, Secret Manager 참조로 전환. SECRET_INVENTORY.md 메타 갱신(재발급일 기재).
5. **[재발 방지]** 에이전트 행동 규칙에 명문화: `.env·secrets/ 대상 grep/cat 출력 금지` — 존재 확인은 `secret check <NAME>` 또는 `grep -c`(건수만)로. → ch7/ch4 경미 개정 + `.claude/rules/data-access.md` 1줄 추가.

## 타임라인
- 15:36 노출 발생 (iMac/쌍아 grep)
- 15:37 웹/민아 인지·본 인시던트 기안
- 15:40 작가님 "테스트키 추정" 의견 → 검증 절차 추가 (아래)
- ⏳ 판정 완료 시 severity 조정 또는 로테이션 후 closed

## 15:40 추가 — 테스트키 여부 판정 절차 (값 미접촉)

작가님 추정대로 로컬 .env가 테스트 모드 자격증명일 가능성 있음. 단 **위험 기준은 키의 라벨(test/live)이 아니라 "프로덕션이 그 값을 신뢰하는가"**:
- 웹훅 핸들러(payments.js:82-83)는 GLOBAL·레거시 시크릿 2종에 대해 HMAC 대조 — 노출값이 프로덕션 주입값과 **동일하면** test 라벨이어도 위조 웹훅 서명 가능.
- 노출값이 프로덕션 주입값과 **다르면**(로컬 dev 전용) 실위험 없음 → severity: low 강등, .env 정리만.

판정 3단계:
1. **[작가님]** Lemon 대시보드 Settings→API — 노출 키는 **2026-03-11경 발급분**(JWT iat 기준). 해당 키에 Test mode 배지 여부 확인.
2. **[쌍아]** Cloud Run 프로덕션의 시크릿 소스 확인 — deploy.sh `--set-secrets` 매핑이 Secret Manager 참조인지, .env 값과 동일 계열인지 (값 열람 없이 버전·해시로 대조).
3. 판정 후: 동일 계열이면 로테이션 실행(조치 1~4), 상이하면 .env에서 라이브성 시크릿 제거 + 본 인시던트 low로 종결.

## 15:44 판정 — 라이브키 확정 (severity: high 유지)

- 작가님 레몬 대시보드 스크린샷 실측: 노출 JWT의 iat(2026-03-11)·exp(2026-09-11)이 **라이브 키 `IDphoto_JP`(Created 11 Mar / Expires 11 Sep 2026)와 정확히 일치**. 화면 Test mode 토글 OFF(라이브 뷰) 상태의 키 목록.
- JP·글로벌 스토어가 본 키를 공유 사용 중(작가님 확인).
- **무중단 로테이션 순서**: ① 새 키 생성(+) → ② `secret add LEMONSQUEEZY_API_KEY` → ③ deploy.sh 재배포+체크아웃 실측 → ④ 구키 IDphoto_JP 삭제. `monkos JP key`(3/9)도 용도 확인 후 정리.
- **웹훅 시크릿 동시 로테이션**: Settings→Webhooks에서 JP·글로벌 Signing secret 재생성 → `secret add` 2종 → 같은 재배포에 편승 → 테스트 주문 1건으로 크레딧 적립 E2E + variant 라이브 대사(REPORT_20260623 리스크2) 동시 검증.
- ⏳ 로테이션·E2E 완료 보고 시 closed.

## 19:32 체크아웃 실측 (웹/민아, rev 00375-g45 대상)

- ✅ **새 API 키 정상**: `POST /api/checkout` variantId 1382367(JP ¥990) → 레몬 체크아웃 URL 생성 성공. 새 키의 라이브 API 인증 관통 확인. → **구키 2개(IDphoto_JP·monkos JP key) 삭제 GO**.
- 🔴 **신규 발견 — 글로벌 USD 결제 라이브 불능**: variantId 1825706($6.90) → `체크아웃 생성 실패`. 원인 = shared/config.js:112 주석 그대로 "store#415328 **test mode** variant ID" 잔존(1825695~1825713, 6/23 리스크2 현실화). 프론트 `portal/public/js/credits.js`도 동일 test ID 참조. **레몬이 라이브인 지금, 글로벌 구매 시도는 전부 500** + 설령 결제돼도 웹훅 VARIANT_CREDITS 미스매치로 크레딧 미지급 구조.
- 조치: [작가님/쌍아] 레몬 대시보드(라이브 모드) Products → 글로벌 스토어 variant 5종의 **라이브 ID** 확인 → shared/config.js VARIANT_CREDITS + public/js/credits.js 교체 → 재배포 → 글로벌 체크아웃 재실측.
