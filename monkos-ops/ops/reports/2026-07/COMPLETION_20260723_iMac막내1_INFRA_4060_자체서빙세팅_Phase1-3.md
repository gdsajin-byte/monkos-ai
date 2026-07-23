---
type: completion
date: 2026-07-23
device: iMac
agent: 막내1
portfolio: PF_INFRA
status: 완료
---

# 완료 보고: 4060 자체 서빙 인프라 세팅 (Phase 1–3)

**[2026-07-23 11:08 KST]** iMac/막내1 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260723_iMac쌍아_막내_INFRA_4060_자체서빙세팅.md`

---

## Phase 1: CF Tunnel — ✅ 완료

| 항목 | 결과 |
|------|------|
| cloudflared 설치 | v2026.7.2 (GitHub releases 직접 다운로드) |
| 터널 생성 | `4060-matte` / ID: `6ae888e2-fb59-4162-9d4c-791237e7bbe0` |
| DNS CNAME | `matte.monkos.ai` → tunnel CNAME 등록 완료 |
| config.yml | `C:\Users\smuse73\.cloudflared\config.yml` |
| Windows 서비스 | NSSM `cloudflared-tunnel` — Running + Automatic |

### 참고

- `cloudflared service install` 기본 방식은 SYSTEM 프로필 경로 문제로 동작 불가 → NSSM으로 사용자 프로필 config 경로 명시하여 해결.

---

## Phase 2: BiRefNet 매팅 서버 — ✅ 완료

| 항목 | 결과 |
|------|------|
| 서버 코드 | `C:\Users\smuse73\matte-server\server.py` (FastAPI + uvicorn) |
| Python venv | `.venv_factory` (torch 2.11+cu128, fastapi, uvicorn 추가 설치) |
| 엔드포인트 | `GET /health`, `POST /matte` |
| VRAM 사용 | 861MB / 8,188MB |
| Windows 서비스 | NSSM `birefnet-matte` — Running + Automatic |

### 수정 사항

- `torch.cuda.get_device_properties(0).total_mem` → `.total_memory` (PyTorch 2.11 API 변경)
- `model.float()` 추가 — BiRefNet 가중치 fp16/fp32 불일치 해결

---

## Phase 3: E2E 검증 — ✅ 완료

### 레이턴시 실측 (600x800 이미지, 3회)

| Run | 서버 처리 | E2E (iMac→CF→4060→CF→iMac) |
|-----|----------|---------------------------|
| 1 (콜드) | 678ms | 1,765ms |
| 2 (웜) | 285ms | 1,356ms |
| 3 (웜) | 282ms | 1,029ms |

**평균 E2E: ~1.3초** (목표 5초 이내 — 충족)

### 서비스 현황

| 서비스 | Status | StartType |
|--------|--------|-----------|
| Tailscale | Running | Automatic |
| cloudflared-tunnel | Running | Automatic |
| birefnet-matte | Running | Automatic |

---

## Phase 4–5: ⏳ 쌍아 판단 대기

- Phase 4 (CR→4060 연동): 별도 지시서 또는 Phase 3 승인 후 진행
- Phase 5 (모니터링): Phase 4와 병행

---

## 변경 파일

| 위치 | 파일 | 내용 |
|------|------|------|
| 4060 | `C:\Users\smuse73\matte-server\server.py` | BiRefNet FastAPI 매팅 서버 |
| 4060 | `C:\Users\smuse73\.cloudflared\config.yml` | CF Tunnel 설정 |
| 4060 | NSSM 서비스 2건 | `birefnet-matte`, `cloudflared-tunnel` |
| CF DNS | `matte.monkos.ai` | CNAME → tunnel |
