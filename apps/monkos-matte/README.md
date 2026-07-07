# monkos-matte — BiRefNet 배경제거 서빙 정본

> ORDER_20260707_M1쌍아_민아 Task A-1 산출물. benchmark/birefnet_server.py 규격화 승계.
> 모델: BiRefNet-portrait (MIT). 실측 근거: 쌍아 06/14 (4060 0.83s) + 민아 07/07 (Apple Vision 대등).

## API

| 엔드포인트 | 입력 | 출력 |
|-----------|------|------|
| `GET /health` | — | `{status, backend, device, model}` |
| `POST /api/matte` | `{image: base64, bgColor: "#RRGGBB"}` | `{success, image: base64 PNG, meta:{elapsedSec, device}}` |

- 마스크는 **소프트 알파 그대로 합성** (이진화 금지 — 헤어 경계 보존, poc-20260707 판정 조건)
- 원본 픽셀 보존: 인물 영역은 무변형, 배경만 교체 (정체성 보존 제1원칙)

## 기동

### 4060 (프로덕션, GPU)
```bash
# HF 캐시 06/14 기존재 (ZhengPeng7/BiRefNet). portrait는 최초 1회 다운로드
cd apps/monkos-matte
MATTE_BACKEND=torch python matte_server.py        # :5100
```
점검 순서: `tailscale status` 온라인 → `nvidia-smi` → HF 캐시 → 기동 → `/health`

### M1/iMac (개발·CPU, ONNX)
```bash
# poc-20260707 venv + ONNX 재사용 (M1 로컬 기존재, 972MB — git 커밋 금지)
cd apps/monkos-matte
MATTE_BACKEND=onnx \
MATTE_ONNX_PATH=../crop-app/benchmark/poc-20260707/BiRefNet-portrait.onnx \
../crop-app/benchmark/poc-20260707/venv/bin/python matte_server.py
```
CPU 추론 ~19s/장 (구형 iMac 실측) — 개발 검증용.

## 포털 연동

- portal `.env`: `MATTE_API_URL=http://<4060 tailscale IP>:5100` (비밀 아닌 설정값)
- **미설정 시 포털은 현행 Gemini 경로 그대로** — 안전 스위치
- 장애 시 L3 폴백: portal이 자동으로 Gemini 경로 강등 + 텔레그램 경보

## 환경변수

| 변수 | 기본 | 설명 |
|------|------|------|
| `MATTE_BACKEND` | `torch` | `torch`(GPU) / `onnx`(CPU) |
| `MATTE_PORT` | `5100` | 서빙 포트 |
| `MATTE_HF_MODEL` | `ZhengPeng7/BiRefNet-portrait` | torch 백엔드 모델 |
| `MATTE_ONNX_PATH` | — | onnx 백엔드 모델 파일 경로 |
