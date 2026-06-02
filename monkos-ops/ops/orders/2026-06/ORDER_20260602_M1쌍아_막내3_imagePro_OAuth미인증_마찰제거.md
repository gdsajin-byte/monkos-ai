---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내3 (image_pro 소관 / 풀권한 막내 배정)
portfolio: PF_SECURITY (연관) · image_pro
status: 발행
order_class: 광역오더(Mission Order) #3 — 인프라 마찰 제거
---

# ORDER — image_pro "MONKOS IMAGE pro" OAuth 미인증 경고 근원 제거

**[2026-06-02 11:31 KST] M1/쌍아 → 막내3**

> 작가님 보고: M1에서 막내 가동/작업 시 "Google에서 확인하지 않은 앱(MONKOS IMAGE pro)" 동의 화면이 **반복** 발생(오늘 너댓번). 이 마찰을 근원 제거한다.

---

## 1. 쌍아 1차 진단 (확정/배제 사항 — 중복 작업 금지)

- ❌ **ADC/gcloud 아님** — M1 ADC는 Google SDK 기본 client(`764086051850`), 정상. 막내 부팅도 `gcloud auth` 직접 호출 안 함. **여기 파지 말 것.**
- ✅ **원인 = `MONK_kr/ai_lab/image_pro`("MONKOS IMAGE pro", 스태프 전용 이미지 PWA)의 OAuth 앱이 미인증.** `auth.json`은 자체 스태프 명단(관리자/심사용/직원)이고, Google 로그인 레이어가 미검증.
- ⭐ **유력 근원 가설**: OAuth 동의 화면이 **"테스트(Testing)" 게시 상태 → refresh token 7일 만료 → 주기적 재동의 강제.** "막내 가동마다/너댓번"이 이 토큰 끊김 증상과 정합. M1 한정 = image_pro 스태프 로그인을 M1 크롬에서만 사용.

---

## 2. 목표 (Why)

image_pro OAuth 반복 동의 경고를 **근원 제거** → 막내 가동/작업 흐름의 토큰 끊김 마찰 종식.

---

## 3. 단계

### 3-1. 진단 (gcloud/콘솔 조회 — 읽기 전용)
- image_pro OAuth client가 속한 **GCP 프로젝트** 식별(monkos 추정).
- OAuth 동의 화면 **게시 상태**(Testing vs In production).
- 요청 **scope 목록** — sensitive/restricted scope가 실제 기능에 필요한지.
- **테스트 유저** 등록 현황 / refresh token 만료 주기.
- **발생 트리거 규명**: 동의 화면이 막내 가동 직후 자동으로 뜨는지, image_pro 직접 로그인 시 뜨는지 (작가님 미확정 — 코드/로그로 규명).

### 3-2. 근원 제거 권고안 작성 (실행 전 작가님 승인)
진단 결과로 다음을 묶어 권고안 제시:
- 게시 상태 Testing이면 → **In production 게시** 권고 (refresh token 영속화).
- scope 과다면 → **최소 scope 축소안** (코드 + 콘솔 변경 범위 명시).

### 3-3. 실행 + 검증 (작가님 승인 후)
- 승인된 처방 적용 → **재로그인 시 경고/재동의 사라지는지 실측**.

---

## 4. 범위 경계 (보안 민감 — 헌법 4조)

| 한다 ✅ | 안 한다 🚫 |
|--------|-----------|
| OAuth 동의 화면·scope·게시상태 **진단**(읽기) | OAuth client secret·토큰 **생성/노출/추측** |
| 근원 제거 **권고안** 제시 | **게시 상태/scope 변경을 승인 없이 실행** |
| 작가님 승인 후 처방 실행·검증 | `.env`·`secrets/` 무단 수정 |

> 진단·권고안까지가 막내 자율 범위. **변경 실행은 작가님 승인이 게이트.**

## 5. 자율 재량
- 진단 수단(gcloud, Cloud Console API, 코드 추적) 막내 판단.

## 6. 가드레일
- 비밀값 생성/추측/노출 금지(헌법 4조 1항). 파괴적 명령 금지. 매 턴 `date` KST.

## 7. 체크포인트 (non-blocking)
1. **진단 결과** 보고 (프로젝트·게시상태·scope·트리거).
2. **근원 제거 권고안** → 작가님 승인 대기.
3. 승인 후 **실행 + 검증** → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## 8. PF 갱신
- 완료 시 `PF_SECURITY/README.md`(또는 image_pro 적정 PF) 히스토리 1행 어펜드.

---

**끝. 1차 진단(§1)은 쌍아가 배제·확정해뒀다. 게시상태·scope부터 떠보고, 변경은 반드시 작가님 승인 게이트를 통과시켜라.**
