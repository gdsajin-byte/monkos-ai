---
type: order
date: 2026-07-23
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_INFRA
status: 대기
---

# 지시서: 4060 자체 서빙 인프라 세팅

**[2026-07-23 10:47 KST]** iMac/쌍아 → 막내

## 목적

4060 GPU 서버를 BiRefNet 매팅 자체 서빙 노드로 운용하기 위한 인프라 세팅.
CF Tunnel로 외부 노출 + BiRefNet HTTP 서버 + 서비스화 + CR 연동 + 모니터링.

## 선행 조건 (A 세팅 — 완료)

- [x] Wi-Fi 절전 비활성 (PnPCapabilities=24)
- [x] 전원 계획 고성능
- [x] 자동 로그인 (netplwiz)
- [x] Tailscale + sshd 자동 시작 확인

## ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿 값 생성/추측 금지. CF 터널 credentials은 `secret` 커맨드 경유.
- ch5 2조: `gcloud run deploy` 직접 실행 금지 → `deploy.sh` 경유.
- ch7 3조: 지시서 범위 밖 작업 금지. 추가 필요 시 보고 후 대기.

## 접속 정보

```
Host: 4060 (SSH config)
IP: 100.118.31.62 (Tailscale)
User: smuse73
OS: Windows 11 Pro
Python: 3.14.2
GPU: RTX 4060 (8GB VRAM)
BiRefNet 모델: HF 캐시에 다운로드 완료 (~/.cache/huggingface/hub/models--ZhengPeng7--BiRefNet)
```

---

## Phase 1: CF Tunnel 설치 + 서비스 등록

### 1-1. cloudflared 설치

```powershell
# 4060에서 실행 (SSH 경유)
winget install Cloudflare.cloudflared
# 또는 직접 다운로드: https://github.com/cloudflare/cloudflared/releases/latest
# cloudflared.exe를 PATH에 추가
```

설치 확인: `cloudflared --version`

### 1-2. CF 터널 생성

```bash
# 4060에서 실행
cloudflared tunnel login
# → 브라우저 인증 필요 — 작가님 액션 또는 Chrome 원격 데스크톱 경유
cloudflared tunnel create 4060-matte
```

생성된 credentials JSON → 작가님에게 `secret` 등록 요청:
```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: CF_TUNNEL_4060_CREDENTIALS
발급처: cloudflared tunnel create 출력
```

### 1-3. 터널 설정 파일

`C:\Users\smuse73\.cloudflared\config.yml` 작성:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\smuse73\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: matte.monkos.ai
    service: http://localhost:8000
  - service: http_status:404
```

### 1-4. DNS 연결

CF MCP로 DNS CNAME 등록 (쌍아가 처리 가능):
- `matte.monkos.ai` → `<TUNNEL_ID>.cfargotunnel.com`

### 1-5. Windows 서비스 등록

```powershell
cloudflared service install
# 자동으로 Windows 서비스에 등록, 재부팅 후 자동 시작
```

확인: `Get-Service cloudflared | Select-Object Name, Status, StartType`

### Phase 1 완료 기준

- [ ] `cloudflared --version` 출력
- [ ] `cloudflared tunnel list`에 4060-matte 표시
- [ ] Windows 서비스 cloudflared Running + Automatic
- [ ] `curl https://matte.monkos.ai` 응답 (502 OK — 백엔드 미가동이라 502 정상)

---

## Phase 2: BiRefNet 매팅 서버 구축 + 서비스화

### 2-1. 매팅 HTTP 서버 작성

`C:\Users\smuse73\matte-server\server.py`:

FastAPI 기반, 엔드포인트:
- `GET /health` — `{"status": "ok", "gpu": "...", "vram_used": "...", "model": "loaded|unloaded"}`
- `POST /matte` — 입력: base64 이미지 → 출력: base64 매팅 결과
- BiRefNet 모델 로딩은 서버 시작 시 1회 (웜 상태 유지)
- GPU VRAM 부족 시 명시 에러 반환 (무음 강등 금지)

참고: 7/21 실측 — 콜드 추론 1,752ms, 웜 추론 982ms, VRAM 881MB

### 2-2. Python 의존성

```powershell
pip install fastapi uvicorn torch torchvision transformers pillow
```

### 2-3. NSSM 서비스 등록

```powershell
# NSSM 설치
winget install NSSM.NSSM
# 또는: https://nssm.cc/download

# 서비스 등록
nssm install birefnet-matte "C:\Users\smuse73\AppData\Local\Programs\Python\Python314\python.exe" "C:\Users\smuse73\matte-server\server.py"
nssm set birefnet-matte AppDirectory "C:\Users\smuse73\matte-server"
nssm set birefnet-matte Start SERVICE_AUTO_START
nssm set birefnet-matte AppStdout "C:\Users\smuse73\matte-server\logs\stdout.log"
nssm set birefnet-matte AppStderr "C:\Users\smuse73\matte-server\logs\stderr.log"
nssm start birefnet-matte
```

### Phase 2 완료 기준

- [ ] `curl http://localhost:8000/health` → `{"status": "ok", ...}`
- [ ] `curl -X POST http://localhost:8000/matte -d '{"image": "<base64>"}'` → 매팅 결과
- [ ] NSSM 서비스 birefnet-matte Running + AUTO_START
- [ ] 재부팅 후 자동 시작 확인

---

## Phase 3: E2E 검증

### 3-1. CF Tunnel 경유 매팅

```bash
# iMac에서 실행
curl https://matte.monkos.ai/health
curl -X POST https://matte.monkos.ai/matte -d '{"image": "<테스트_base64>"}'
```

### 3-2. 레이턴시 실측

- CF Tunnel 왕복 (iMac→CF→4060→CF→iMac) 레이턴시
- 매팅 처리 시간 (서버 로그)
- 합산 E2E 시간

### Phase 3 완료 기준

- [ ] `https://matte.monkos.ai/health` 200 응답
- [ ] 매팅 E2E 응답 < 5초
- [ ] 레이턴시 실측 기록

---

## Phase 4: CR→4060 연동 (별도 지시서 또는 Phase 3 확인 후)

> Phase 3 완료 보고 후 쌍아가 판단하여 진행 여부 결정.

- portal의 matte 호출을 `matte.monkos.ai` 경유로 전환
- 폴백 체인: 4060(타임아웃 5s) → RunPod → 현행 유지
- 선제 강등: /health 실패 2연속 → RunPod 전환, 복귀 3연속 통과

---

## Phase 5: 모니터링 (Phase 4와 병행)

- GitHub Actions 또는 소넷이 크론: 30분 간격 `/health` 체크
- GPU util 50%+ 지속 10분 → 게임 감지 → 강등 신호
- 텔레그램 알림: 오프라인 전환 / 복귀 / 에러

---

## 보고

- Phase별 완료 보고 (헌법 3조 2항)
- Phase 1·2 완료 후 중간 보고 → Phase 3 진행 승인
- PF_INFRA 히스토리 갱신

## 참고 문서

- 아키텍처 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md`
- 4060 스킬: `.claude/commands/4060.md`
- 4060 디바이스 프로필: `memory/device_4060.md`
- 민아 교차검증: `monkos-ops/ops/reports/2026-07/REVIEW_20260721_M1민아_아키텍처3분리_교차검증.md`
