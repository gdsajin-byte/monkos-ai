# go_train — 소형 바둑 망 학습 파일럿 (4060)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261103_iMac쌍아_4060쌍아_GO_소형망학습_파일럿.md` · PF_GO
> 코드·설정만 이 폴더에 둔다. 데이터·체크포인트·엔진 바이너리는 레포 밖 `C:\Users\smuse73\go_train\` (커밋 금지).

> 평가 대국 기보: `match.py`는 모든 대국을 SGF로 저장한다 — `--out` JSONL과 같은 폴더의 `{jsonl stem}_sgf/game{NNN}.sgf` (JSONL 행의 `sgf` 필드, 실패 시 `sgf_error`).

## 환경 (실측 2026-11-03 17:53 KST, 4060)

| 항목 | 값 |
|---|---|
| GPU | RTX 4060 8GB, 드라이버 621.01, compute 8.9 |
| 가상환경 | `C:\Users\smuse73\venvs\go-train` (Python 3.12.10, 4.4G) |
| PyTorch | 2.11.0+cu128 (`--index-url https://download.pytorch.org/whl/cu128`), `torch.cuda.is_available()` True |
| 추가 패키지 | numpy · packaging · psutil |
| KataGo 엔진 | v1.18.2 `katago-v1.18.2-cuda12.8-cudnn9.8.0-windows-x64.zip` → `go_train\engine\` (1.8G) |
| 측정 상대 망 | `kata1-b18c384nbt-s9996604416-d4316597426.bin.gz` → `go_train\nets\b18.bin.gz` (94M) — **26,326,985 파라미터** (엔진 로그) |
| 학습 코드 | `github.com/lightvector/KataGo` d91ea85 (2026-09-27) `python/` → `go_train\KataGo\` |

## 설치 함정 (Windows)

1. **CUDA·cuDNN DLL은 시스템 설치 없이** torch 휠의 `torch\lib`에서 엔진 폴더로 복사: `cublas64_12` · `cublasLt64_12` · `cudart64_12` · `cudnn*64_9` · `nvrtc64_120_0` · `nvrtc-builtins64_128`. `nvrtc64_120_0` 누락 시 exit `-1073741515`(0xC0000135, DLL 없음).
2. **katago.exe는 Git Bash에서 직접 실행 불가**(`api-ms-win-crt-*` 로더 오류) → `powershell.exe -Command` 경유. PowerShell `*>` 리다이렉트 로그는 UTF-16LE(`iconv -f UTF-16LE`).
3. **torch.compile은 Triton 필요**(Windows 기본 없음) → KataGo 스크립트에 `-no-compile` 또는 `TORCHDYNAMO_DISABLE=1`. 속도가 필요하면 `triton-windows` 별도 검토.

## 벤치 (실측)

엔진 `benchmark` (b18, FP16·NHWC, visits 200): 스레드 8 → 849 visits/s · 16 → 1,023 · 24 → ~1,090.

학습 1스텝 (`benchmark_fresh_model.py -mode trainloop -batch-size 256`, SGD, compile 끔, 번들 testdata):

| 망 | 파라미터 | 1스텝 | 처리량 | 최대 VRAM |
|---|---|---|---|---|
| b6c96 | 1,004,333 | 122.5 ms | 2,089 샘플/s | 0.87 GiB |
| b10c128 | 2,962,049 | 255.1 ms | 1,004 샘플/s | 1.70 GiB |

## 재현

```bash
python3 -m venv /c/Users/smuse73/venvs/go-train
/c/Users/smuse73/venvs/go-train/Scripts/python.exe -m pip install torch --index-url https://download.pytorch.org/whl/cu128
/c/Users/smuse73/venvs/go-train/Scripts/python.exe -m pip install numpy packaging psutil
# 엔진 zip 해제 후 위 DLL 복사, 확인:
powershell.exe -NoProfile -Command "Set-Location C:\Users\smuse73\go_train\engine; .\katago.exe version"
```
