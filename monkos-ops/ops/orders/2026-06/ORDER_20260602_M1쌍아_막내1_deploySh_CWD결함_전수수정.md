---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내1
portfolio: PF_AUTOPILOT
status: 발행
order_class: 광역오더(Mission Order) #5 — 재발방지(작가님 승인 완료)
---

# ORDER — deploy.sh CWD 미고정 결함 전수 수정

**[2026-06-02 14:38 KST] M1/쌍아 → 막내1**

> 오늘 idphoto-jp 사고(kr 코드가 jp에 배포, 36분 장애)의 **근본 원인 = deploy.sh가 빌드 전 작업 디렉토리를 고정하지 않아 실행 위치의 소스를 빌드.** 같은 결함이 다른 서비스 deploy.sh에도 있으면 동일 사고 재발. **deploy.sh 수정은 헌법 4조 — 작가님 승인 완료.**

---

## 1. 목표
모든 서비스 `deploy.sh`가 **자기 디렉토리 소스를 빌드하도록 고정** → 실행 위치(CWD) 무관하게 안전. 오늘 사고 재발 차단.

## 2. 단계

### 2-1. idphoto jp+kr 먼저 (사고 당사자)
- `monkos_AI/idphoto-jp/deploy.sh`, `monkos_AI/idphoto-kr/deploy.sh`: `gcloud builds submit` **직전에 `cd "$SCRIPT_DIR"` 추가** (SCRIPT_DIR은 이미 46줄에 정의됨).
- jp `Dockerfile` 1–2줄 kr 주석 잔재도 jp로 정정(혼란 방지).

### 2-2. 전수 점검 (같은 결함 여부)
다음 deploy.sh를 점검 — `SCRIPT_DIR` 정의는 있으나 빌드 전 `cd` 누락인지:
- `monkos_AI/portal/deploy.sh`
- `monkos_AI/studio/deploy.sh`
- `apps/monk_imagen4/backend/deploy.sh`
- (그 외 발견되는 deploy.sh 전부)
→ 결함 있으면 동일하게 `cd "$SCRIPT_DIR"` 추가.

### 2-3. 검증
- 각 deploy.sh가 빌드 전 SCRIPT_DIR로 cd하는지 확인.
- **실제 재배포는 하지 말 것** (이번 오더는 스크립트 수정 전용). 단 다음 배포부터 정상 동작 보장.
- 가능하면: deploy.sh를 **다른 디렉토리에서 호출해도** 올바른 소스가 잡히는지 안전하게 확인(빌드 직전 `pwd` 에코 등).

## 3. 범위 경계
- **`cd "$SCRIPT_DIR"` 추가 + jp Dockerfile 주석 정정만.**
- REGION·이미지 태그·서비스명·다른 배포 로직 **건드리지 말 것.**
- 불필요한 재배포 금지 (수정만).

## 4. 가드레일
- deploy.sh 수정 = 본 오더로 승인됨. 그 외 `.env`·`secrets/` 금지. 파괴적 명령 금지. 매 턴 `date`.

## 5. 체크포인트
1. **점검 결과** 보고 — 어느 deploy.sh가 결함이었나(목록).
2. **수정 적용 + 검증** → COMPLETION + 커밋·푸시.
3. 에러 3회 → `/에스컬레이션`.

## 6. PF 갱신
- 완료 시 `PF_AUTOPILOT/README.md` 히스토리 어펜드 (배포 인프라 결함 수정).

---

**끝. 오늘 사고가 한 곳만의 우연인지, 모든 deploy.sh의 공통 지뢰인지 전수로 확인하고 막아라. 수정은 cd 추가 한 줄, 그러나 점검은 빠짐없이.**
