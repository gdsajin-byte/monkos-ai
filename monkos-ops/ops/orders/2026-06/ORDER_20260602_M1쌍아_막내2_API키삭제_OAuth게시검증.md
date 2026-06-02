---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내2
portfolio: PF_SECURITY
status: 발행
order_class: 광역오더(Mission Order) #3·#4 실행단계(CP3) — 작가님 승인 완료
---

# ORDER — API 키 3개 삭제 + OAuth 동의화면 게시 검증

**[2026-06-02 13:17 KST] M1/쌍아 → 막내2**

> 오더 #3(OAuth) + #4(API 키) **진단·권고 완료, 작가님 승인 완료.** 본 지시서는 **실행 단계(CP3)**다. 쌍아 정합 검토 통과(키 3개 코드 사용처 0 + monkosimagepro 유출 프로빙 확인, 생성코어 무관).

---

## A. API 키 3개 삭제 (한 키씩 + 검증 — 일괄 금지)

**순서대로**, 각 삭제 후 **idphoto-kr/jp 생성코어 200 정상 유지 실측** 통과해야 다음 키로:

1. **① `monkosimagepro` 삭제** — 🔥 **유출 최우선** (대만 ListModels 프로빙). 삭제 후 idphoto 생성 영향 0 재확인.
2. **② `monkos_key` 삭제** — 30일 무트래픽, yong-a SA 바인딩 영향 없음 확인.
3. **③ `monk-aistudio-consol` 삭제** — 30일 무트래픽.

- 문제 발생 시: **`gcloud api-keys undelete`(30일 복원)** + 즉시 보고. 강행 금지.
- **`MONKOS NEW API Key`는 유지** — API restriction 그대로, 변경 없음 (생성코어 gemini-3 유일 활성 키).

## B. OAuth 동의화면 게시 검증 (#3 CP3)

- 작가님 콘솔 게시(Testing → In production) 완료 후, **MONKOS 서비스(portal·idphoto) 재로그인 시 "확인하지 않은 앱" 경고/반복 재동의가 사라지는지 실측.**
- 게시 직후 기존 동의 1회 갱신은 정상 — 그 이후 영속 확인.

## C. 범위 경계 (보안 민감 — 헌법 4조)
- 키 **값 조회/출력/생성 금지.** OAuth client(mcp-google-docs/MONKOS AI) **손대지 말 것.**
- `.env`·`deploy.sh` 무단 수정 금지. 파괴적 명령(키 외) 금지. 매 턴 `date`.
- **유출 경로 근원 추적은 본 오더 범위 밖** (revoke로 위험 제거가 우선, 추적은 추후 별건).

## D. 완료
- `PF_SECURITY/README.md` 히스토리 어펜드 + Phase 현황 갱신.
- **COMPLETION** 작성 (오더 #3·#4 통합 종결) → 커밋·푸시.
- 에러 3회 → `/에스컬레이션`.

---

**끝. monkosimagepro(유출)부터, 한 키씩 삭제하고 매번 생성코어 정상을 실측 확인하라. MONKOS NEW는 건드리지 마라.**
