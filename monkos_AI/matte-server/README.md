# matte-server — 4060 BiRefNet 매팅 서버

> **정본은 이 디렉토리다.** 4060의 `C:\Users\smuse73\matte-server\server.py`는 실행 사본이다.
> 2026-07-25 편입 (그 전까지 4060 로컬에만 존재 — 디스크 장애 시 전량 소실 위험).

## 무엇인가

증명사진 배경제거(매팅) 엔진. 사무실 GPU 박스(4060)에서 상시 서빙하며, 포털의 매팅 체인 1순위다.

```
portal (Cloud Run) → ① matte.monkos.ai (4060, ₩0) → ② RunPod T4 flex (유료 폴백)
```

- 모델: `ZhengPeng7/BiRefNet` (HuggingFace, trust_remote_code)
- 프레임워크: FastAPI + uvicorn, 포트 8000
- 실행 환경: Windows + NSSM 서비스 `birefnet-matte` (Automatic)
- venv: `C:\Users\smuse73\developer\monk_project\.venv_factory` (torch 2.11+cu128)
- 외부 노출: Cloudflare Tunnel `matte.monkos.ai` → `4060-matte`

## API

| 경로 | 인증 | 응답 |
|---|---|---|
| `GET /health` | 없음 | 상태 + VRAM + **포화 신호** (아래) |
| `POST /api/matte` · `POST /matte` | `X-Matte-Secret` 헤더 | `{success, image(base64 JPEG), meta.elapsedSec}` |

요청 본문: `{image: base64, bgColor: "#RRGGBB"}`

### 상태 코드

| 코드 | 의미 | 클라이언트 동작 |
|---|---|---|
| 200 | 성공 | — |
| 400 | base64 디코딩 실패 | 다음 엔드포인트 |
| 403 | 시크릿 불일치 | — |
| **503** | **포화 (동시 상한 초과)** | **`Retry-After`만큼 기다렸다 재노크** (`lib/matte.js` 줄 서기) |
| 507 | GPU VRAM 부족 (OOM) | 다음 엔드포인트 |

## 동시성 가드 (2026-07-25, INCIDENT_20260725 대응)

**무제한 동시 진입이 VRAM 스래싱을 일으켜 16건이 14분 걸린 사건**의 구조적 차단.

- `MAX_CONCURRENT`(기본 **1**, env `MATTE_MAX_CONCURRENT`) 세마포어로 진입 제한
- 포화 시 **대기 없이 즉시 503** + `Retry-After: 1` — 느린 수락을 빠른 거절로
- **k=1 확정** (2026-07-25 작가님): 4060은 전용기가 아니라 VTON·게임과 공용이므로 가용 VRAM이 상황에 따라 변한다. 매팅 단독 기준 물리 상한이 2라도 겹치는 순간 성립하지 않는다.

실측: 잡당 VRAM **2,373MB**(입력 크기 무관 상수 — `transform`이 1024×1024로 리사이즈), 모델 상주 **991MiB**, 처리시간 **769~812ms**(1200×1600).

### `/health` 포화 신호

`status`·`gpu`·`model` 외에:

| 필드 | 용도 |
|---|---|
| `inflight` | 진행 중 잡 수 |
| `oldest_inflight_sec` | 최장 점유 경과 — **세마포어 영구 점유 탐지** |
| `recent_matte_ms` · `last_matte_ms` | 최근 처리시간 |
| `last_completed_age_sec` | 마지막 완료 후 경과 — "200인데 못 쓰는 상태" 탐지 |
| `rejected_503_total` | 포화 거절 누적 |
| `vram_reserved_mb` · `vram_peak_allocated_mb` | 잡당 VRAM 실측 기준값 |

> `references.md` 도구 3요건의 「실패 가시화 — 고장 시 무음 강등 금지」 이행 조항. 빼지 말 것.

## 배포

```bash
./deploy.sh          # 문법검사 → 원격 백업 → 전송 → nssm restart → 헬스 확인
./deploy.sh --check  # 배포 없이 원격 상태만
```

- **직접 수정 금지.** 4060에서 파일을 고치면 정본과 갈라진다. 레포에서 고치고 `deploy.sh`로 반영한다.
- 롤백: 배포 시 남는 `server.py.bak_YYYYMMDD_HHMM`을 복사 후 `nssm restart birefnet-matte`. 실패 시 `deploy.sh`가 롤백 명령을 출력한다.
- 재기동에 약 20초(모델 로딩). 그동안 포털은 RunPod로 폴백한다 — 무중단은 아니지만 무장애다.

## 시크릿

`MATTE_SECRET`은 **NSSM 서비스 환경변수**로 주입되며 SM(`MATTE_SECRET`)이 정본이다.

⚠️ **NSSM `AppEnvironmentExtra`를 편집하지 말 것.** 이 블록에 시크릿이 함께 들어 있어 갱신 과정에서 값을 건드리게 된다. `MATTE_MAX_CONCURRENT` 같은 설정을 바꿔야 하면 **`server.py`의 기본값을 고쳐 재배포**한다.

## 알려진 사각

- **1×1 등 초소형 입력에서 500** — `mask.squeeze()`가 0차원으로 붕괴해 `IndexError`. 포털은 실제 크롭만 보내므로 prod 미도달이며(1×1 예열 잡은 RunPod 전용), 500은 클라이언트에서 정상적으로 다음 엔드포인트로 흐른다. 2026-07-25 부하 시험 중 발견.
- **클라이언트 disconnect 시 잡이 취소되지 않는다** — 세마포어 1 + 포털 줄 서기로 증폭 구조는 소멸했으나 근본 미해결.

## 관련

- INCIDENT_20260725_monkos-portal_무료매팅_504
- `scripts/tools/matte_loadtest.py` — 부하 측정기
- `monkos_AI/portal/tools/matte-probe/` — 폴백 체인·줄 서기 실측
- `monkos_AI/portal/lib/matte.js` — 클라이언트(줄 서기 구현)
