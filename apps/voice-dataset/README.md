# voice-dataset — 작가님 목소리 데이터셋 (PF_PRESENTATION)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내2_PRESENTATION_목소리데이터셋_미사한울TV.md`
> 결과: `monkos-ops/ops/reports/2026-11/COMPLETION_20261106_iMac쌍아-막내2_PRESENTATION_목소리데이터셋_미사한울TV.md`
> 레포에는 스크립트만 둔다. 음성·대본·데이터셋은 레포 밖 `~/.monkos/voice/`에 둔다. 외부 업로드나 복제 실행은 이 폴더 범위 밖이다.

```bash
bash apps/voice-dataset/setup_venv.sh            # 홈 격리 venv(torch 2.2.2·demucs 4.0.1) — Intel Mac은 python3.12 필요
python3 apps/voice-dataset/fetch_audio.py        # 미사한울TV 대상 편 음성(무로그인)
bash apps/voice-dataset/separate.sh              # demucs 보컬 분리(nice 19, VS_THREADS=3)
bash apps/voice-dataset/transcribe_follow.sh     # whisper 받아쓰기(분리와 병행 가능)
python3 apps/voice-dataset/build_dataset.py build   # 조각·선별 → ~/.monkos/voice/misa/dataset_v0
```
