---
type: order
date: 2026-06-05
device: iMac
agent: 쌍아
to: 막내3
status: 발행
portfolio: PF_IDPHOTO
priority: P1 (중요 — 키 복구와 독립, 병행 가능)
---

# ORDER — [INCIDENT] image_pro OAuth Testing→Production 재가동

**발신**: iMac/쌍아 → **수신**: 막내3
**우선순위**: 🟡 **P1** — 키 장애(막내2 P0)와 **독립**. 병행 진행 가능.

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내3 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내3 → 작가님` 형식

---

## 배경

06-02에 발행됐으나 멈춰 있는 OAuth 수리 건을 재가동한다. image_pro 스태프 로그인 시 "Google에서 확인하지 않은 앱" 경고가 반복되고, refresh token이 7일마다 만료돼 주기적 재동의가 강제된다.

**원인**: OAuth 동의화면이 **"Testing" 상태**. 처방은 **"In production" 게시**.

> 이 건은 막내2의 Gemini 키 작업과 **무관·독립**이다. 같은 GCP 프로젝트지만 OAuth 동의화면 설정과 API 키는 별개다. 병행해도 충돌 없음.

## 1단계 — 파악 (자료 정독)

- `monkos-ops/ops/orders/2026-06/ORDER_20260602_M1쌍아_막내3_imagePro_OAuth미인증_마찰제거.md` (원 진단)
- OAuth 클라이언트 위치: `MONK_kr/ai_lab/image_pro/index.html` (Google 로그인 게이트)

## 2단계 — 진단

1. GCP Console에서 OAuth 동의화면 **게시 상태** 확인 (Testing vs In production).
2. 요청 **scope 목록** 검토 — 과도한 scope 있으면 최소화 권고.
3. Testing 상태면 refresh token 7일 만료가 마찰 원인임을 확정.

## 3단계 — 진단 보고 → 승인 대기 (게이트)

- ⚠️ **헌법 4조**: OAuth 게시 상태 변경은 작가님 승인 후 실행. 진단까지는 자유.

## 4단계 — 복구 (승인 후)

1. 동의화면 **Testing → In production 게시** (scope 최소화 반영).
2. M1에서 image_pro 재로그인 → **경고·재동의 사라짐 확인**.
3. refresh token 만료 마찰 해소 검증.

## ⚠️ 준수 조항

- **헌법 4조**: 비밀정보 생성·추측·노출 금지. OAuth client secret 노출 금지. 변경은 작가님 승인 후.
- 헌법 1조 1항: 매 턴 `date` 타임스탬프.
- 막힘 시 가설 전 자료 선참조 (ch7 6조).
- 게시 전후 실측 — 추정 금지.

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | 진단 보고 + 승인 대기 → 게시 후 검증 |
| 산출물 | `monkos-ops/ops/reports/2026-06/REPORT_20260605_막내3_OAuth게시.md` |
| 문서 유형 | INCIDENT → REPORT |
| 세션 로그 | `2026-06-05_{디바이스}_막내3.md` 어펜드 + PF_IDPHOTO 히스토리 1행 |

## 검증 (완료 기준)
- [ ] 동의화면 게시 상태 진단 (Testing/Production)
- [ ] scope 검토 + 최소화 권고
- [ ] 진단 보고 → 작가님 승인
- [ ] (승인 후) Production 게시 + 재로그인 경고 소멸 확인
