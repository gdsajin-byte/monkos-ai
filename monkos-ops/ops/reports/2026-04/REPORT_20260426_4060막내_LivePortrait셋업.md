---
type: REPORT
date: 2026-04-26
from: 4060/막내1
to: 작가님
ref: ORDER_20260426_iMac쌍아_4060쌍아_LivePortrait셋업.md
status: 완료
---

# LivePortrait 셋업 완료 보고

**[2026-04-26 16:20 KST] 4060/막내1 → 작가님**

## ✅ 완료 항목

| 단계 | 내용 | 비고 |
|------|------|------|
| 1단계 | 환경 확인 | 4060은 **Windows** OS — 지시서(Linux 전제) 대비 전체 명령어 적응 |
| 2단계 | LivePortrait 설치 | Miniconda 신규 설치 → conda env `liveportrait` (Python 3.10.20) → PyTorch 2.5.1+cu121 → requirements.txt 전체 설치 |
| 3단계 | 체크포인트 다운로드 | HuggingFace에서 24파일 완료 (`pretrained_weights/`) |
| 4단계 | 테스트 추론 | 샘플 3건 성공 (s0+d0, s6+d0템플릿, **작가님 모델사진+d13**) |
| 5단계 | 결과물 전송 | `C:\Users\smuse73\Desktop\LivePortrait_results\`에 전송 완료 |

## ❌ 실패/미해결 항목

| 항목 | 원인 | 영향 |
|------|------|------|
| ffprobe 미작동 | imageio_ffmpeg 번들에 ffprobe 미포함 | 드라이빙 영상의 **오디오 트랙이 결과물에 미포함** (영상 자체는 정상) |
| onnxruntime CUDA provider | `onnxruntime_providers_cuda.dll` 로드 실패 (CUDA Toolkit 미설치) | 얼굴 검출이 CPU fallback으로 동작. **추론 결과에는 영향 없음** |
| 내장 pkl 모션 템플릿 | `talking.pkl` 등 구버전 포맷 — KeyError `c_d_eyes_lst` | 직접 생성한 pkl 템플릿은 정상 작동. 내장 프리셋만 호환 불가 |

## 📌 GPU/VRAM/디스크 상태

| 항목 | 값 |
|------|-----|
| GPU | NVIDIA GeForce RTX 4060 |
| VRAM | 8GB |
| 드라이버 | 591.86 (CUDA 13.1 지원) |
| PyTorch | 2.5.1+cu121, **CUDA: True** |
| 디스크 여유 | **~731GB** (설치 후에도 충분) |
| OS | Windows 10 (Build 26200) |
| Python | 3.10.20 (conda env, 시스템 3.14와 격리) |

## 💡 Audio-driven 지원 여부 + 대안

- **LivePortrait**: video-driven 전용. `inference.py`에 audio 옵션 없음.
- **현재 가능한 파이프라인**:
  - 사진 1장 + 드라이빙 영상(.mp4) → 영상 ✅
  - 사진 1장 + 모션 템플릿(.pkl) → 영상 ✅ (드라이빙 영상에서 1회 추출 후 재사용)
- **audio-driven 대안**:
  1. **SadTalker** — 사진+오디오 → 립싱크 직접 지원
  2. **드라이빙 영상 촬영** — 대본 읽는 영상 촬영 → LivePortrait로 얼굴 교체 (현재 즉시 가능)
- **추론 비용**: 0원 (로컬 오픈소스, MIT 라이선스)

## 📊 렌더링 성능 실측

| 테스트 | 프레임 | 렌더링 시간 | FPS |
|--------|--------|------------|-----|
| s0+d0 (78f) | 78 | ~12초 | ~6.5 |
| s6+d0 템플릿 (78f) | 78 | ~11초 | ~7.1 |
| 모델+d13 (352f) | 352 | ~49초 | ~7.2 |

## 📁 결과물/설치 경로

```
[4060 서버]
C:\Users\smuse73\ai-tools\LivePortrait\           # 리포
C:\Miniconda3\envs\liveportrait\                   # conda 환경
C:\Users\smuse73\ai-tools\LivePortrait\results\    # 결과물

[로컬 전송 완료]
C:\Users\smuse73\Desktop\LivePortrait_results\model--d13.mp4
C:\Users\smuse73\Desktop\LivePortrait_results\model--d13_concat.mp4
```

## 🔧 실행 명령 (재사용용)

```bash
cd C:\Users\smuse73\ai-tools\LivePortrait
set PATH=C:\Miniconda3\envs\liveportrait\Scripts;%PATH%
C:\Miniconda3\envs\liveportrait\python.exe inference.py -s [사진경로] -d [드라이빙영상] -o results/
```

## ⏳ 추가 필요 사항

1. **SadTalker 설치** — 오디오 → 립싱크 PoC 필요 시
2. **ffmpeg/ffprobe 정식 설치** — 결과 영상에 오디오 트랙 포함하려면
3. **CUDA Toolkit 설치** — onnxruntime GPU 가속 (현재 CPU fallback, 실사용 영향 미미)
4. **SSH 키 인증 정비** — 현재 SSH_ASKPASS 우회 방식
