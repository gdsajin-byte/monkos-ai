---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: iMac/쌍아
portfolio: PF_AUTOPILOT
status: 발행
order_class: 광역오더(Mission Order) #8 — 키 동기화 표준 확정
---

# ORDER — .env 동기화 하이브리드 표준 적용 + 정리

**[2026-06-02 15:36 KST] M1/쌍아 → iMac/쌍아**

> 작가님 승인: **하이브리드 표준 확정.** 오더 #7의 미결 3건을 이 표준으로 정리한다.

---

## 1. 확정된 표준 (분리 기준)

| 성격 | 위치 | 비고 |
|------|------|------|
| **런타임 시크릿·토큰** (API 키, OAuth token) | **GCP Secret Manager** | 디바이스 무인증 복원 (gdocs로 입증) |
| **비밀 아닌 설정값** (PROJECT_ID·LOCATION·GCS_BUCKET·리다이렉트 URI 등) | **.env / git** | 단순 배포 |
| **정본 카탈로그 + Actions** | **GitHub Secrets** | write-only, 백업·이력 |

> 원칙: **"시크릿은 GCP 런타임, 설정은 정본 배포, GitHub은 카탈로그."**

## 2. 작업

### 2-1. M1 .env 갭(-20) 분류·정리
- iMac 정본 `monkos_AI/.env`(34개) 기준, M1 누락분을 **§1 표준으로 분류**:
  - 시크릿 → GCP Secret Manager 등록 + 복원(gdocs 패턴 재사용)
  - 설정값 → .env 동기화
- **분류표 먼저 작성** → 보고(체크포인트1). **.env 직접 수정은 분류 확정·항목 확인 후.**

### 2-2. CF_WORKERS_AI_TOKEN 중복 라인 정리
- iMac `.env` 2행 중복 → 1행으로. **`.env` 수정이라 분류표 보고 시 함께 확인** 후 적용.

### 2-3. N8N_API_KEY 위치 확정
- 4060 Docker 전용인지 확인 → 위치를 인벤토리에 명기.

### 2-4. 동기화 메커니즘
- 시크릿: GCP 복원 스크립트(gdocs_mcp.sh 패턴).
- 설정: .env 정본 배포 방식(Tailscale scp 등) 확정.

### 2-5. SECRET_INVENTORY 표준 명문화
- §1 표준(분리 기준)을 인벤토리 상단에 정책으로 기재.

## 3. 경계 (보안 민감 — 헌법 4조)
- 시크릿 값 노출/로그/커밋 금지. `.env` 수정은 **분류 확정 + 항목 확인 후** (1회 일괄 강행 금지).
- 파괴적 명령 금지. 매 턴 `date`.

## 4. 체크포인트 (non-blocking)
1. **.env 갭 분류표** (시크릿/설정 구분) + 중복·N8N 확인 → 보고.
2. 적용(GCP 등록 + .env 동기화 + 인벤토리 명문화).
3. **M1 .env 정합 검증** → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## 5. PF 갱신
- `PF_AUTOPILOT/README.md` 히스토리 + `SECRET_INVENTORY.md` 표준 명문화.

---

**끝. 하이브리드 표준으로 일관 적용한다. .env 직접 수정은 분류표 확정 후 — 강행 금지.**
