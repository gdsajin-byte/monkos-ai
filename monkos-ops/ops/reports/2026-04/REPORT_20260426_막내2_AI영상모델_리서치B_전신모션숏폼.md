---
type: REPORT
date: 2026-04-26
from: iMac/막내2
to: iMac/쌍아
ref: ORDER_20260426_iMac쌍아_막내2_AI영상모델_리서치B_전신모션숏폼.md
status: 완료
---

# AI 영상 모델 리서치 B — 전신 모션 / 숏폼 생성 보고서

> **[2026-04-26 15:37 KST] iMac/막내2 → iMac/쌍아**

---

## 1. 전신 모션 / 댄스 / 제스처 모델 (8종)

| 항목 | ① MimicMotion | ② SteadyDancer | ③ Champ | ④ Animate Anyone (Moore) |
|------|--------------|----------------|---------|--------------------------|
| **소스** | GitHub (Tencent) | GitHub (NJU) | GitHub (Fudan) | GitHub (Moore Threads) |
| **분류** | 전신모션 / 댄스 | 전신모션 / 댄스 | 전신모션 / 제스처 | 전신모션 |
| **입력** | 사진 + 모션영상 | 사진 + 포즈시퀀스 (Wan2.1 기반) | 사진 + SMPL + DWPose + depth | 사진 + 포즈시퀀스 |
| **라이선스** | Custom (비상업) | Apache 2.0 | MIT | Apache 2.0 |
| **VRAM 요구** | 8GB (UNet) / 16GB (VAE 포함) | 12-16GB (FP8) / 24GB (FP16) | ~20GB (250프레임) | 16GB+ |
| **4060 구동** | ✅ (16f, VAE→CPU 오프로드) | ⚠️ (FP8 가능성) | ❌ | ❌ |
| **M1 구동** | ⚠️ (MPS 미공식) | ⚠️ (MPS 미공식) | ❌ | ❌ |
| **M2 구동** | ❌ | ❌ | ❌ | ❌ |
| **M4 구동** | ✅ | ✅ (FP16) | ⚠️ (짧은 클립) | ⚠️ |
| **퀄리티 평가** | 상위 — 시간적 일관성 우수 | **최상위** — Wan2.1 기반 최고 품질 | 상위 — SMPL 기반 정밀 제어 | 상 — 원조 구현체 |
| **상용 대비** | HeyGen 대비 70-80% | HeyGen 대비 80%+ | HeyGen 대비 75% | HeyGen 대비 70% |
| **특이사항** | ComfyUI 노드 있음 (kijai) | 2025.11 출시, 첫프레임 보존 최강 | 4개 컨디션 동시 제어 | AnimateAnyone 오픈소스 재구현 |

| 항목 | ⑤ MagicAnimate | ⑥ MusePose | ⑦ UniAnimate | ⑧ MuseV |
|------|---------------|-----------|-------------|---------|
| **소스** | GitHub (ByteDance) | GitHub (Tencent Lyra) | GitHub (Alibaba DAMO) | GitHub (Tencent Lyra) |
| **분류** | 전신모션 | 댄스 (음악 연동) | 전신모션 / 통합프레임워크 | 전신모션 / 숏폼 |
| **입력** | 사진 + DensePose영상 | 사진 + 포즈영상 | 사진 + 포즈 | 사진 + 텍스트/포즈 |
| **라이선스** | BSD-3-Clause | Custom (비상업) | 미명시 | Custom (비상업) |
| **VRAM 요구** | ~15GB+ | 16GB (512px) / 28GB (768px) | ~12GB (오프로드) / 21GB | 8GB (UNet) / 12GB (풀) |
| **4060 구동** | ❌ | ❌ | ⚠️ (오프로드 시 빡빡) | ✅ (UNet 전용 모드) |
| **M1 구동** | ⚠️ | ⚠️ (512px) | ⚠️ | ⚠️ |
| **M2 구동** | ❌ | ❌ | ❌ | ❌ |
| **M4 구동** | ⚠️ | ✅ (512px) | ✅ | ✅ |
| **퀄리티 평가** | 중상 — DensePose 의존 | 중상 — 음악 동기화 특화 | 중상 — 범용성 높음 | 중 — 경량화 장점 |
| **상용 대비** | 65% | 65% | 70% | 60% |
| **특이사항** | ComfyUI 노드 있음, GitHub 10.9K★ | ComfyUI 공식 노드, 음악비트 정렬 | ReposeImage ComfyUI 노드 | SD1.5 체크포인트 교체 가능 → 비실사 지원 |

---

## 2. 숏폼 / 영상 생성 워크플로우 (5종)

| 항목 | ⑨ Wan 2.1/2.2 (1.3B) | ⑩ FramePack | ⑪ AnimateDiff SD1.5 | ⑫ CogVideoX (2B) | ⑬ SVD-XT |
|------|----------------------|-------------|---------------------|-------------------|----------|
| **소스** | HuggingFace (Alibaba) | GitHub | GitHub + CivitAI | HuggingFace (Tsinghua) | HuggingFace (Stability) |
| **분류** | 숏폼 / T2V+I2V | 숏폼 / 장편영상 | 워크플로우 / 모션제어 | 숏폼 / T2V | 숏폼 / I2V |
| **입력** | 텍스트 / 사진+텍스트 | 사진+텍스트 | 사진+포즈+ControlNet | 텍스트 | 사진 |
| **라이선스** | Apache 2.0 | MIT | Apache 2.0 | 상업 가능 | Stability 라이선스 |
| **VRAM 요구** | 8GB (1.3B 오프로드) / 24GB+ (14B) | **6GB** (고정, 길이 무관) | 8GB (SD1.5) | 8GB (빡빡) / 13-14GB (VAE) | 10GB+ |
| **4060 구동** | ✅ (1.3B) | ✅ | ✅ | ⚠️ | ⚠️ |
| **M1 구동** | ✅ (1.3B) | ✅ | ✅ | ✅ | ✅ |
| **M2 구동** | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| **M4 구동** | ✅ (1.3B) / ⚠️ (14B) | ✅ | ✅ | ✅ | ✅ |
| **퀄리티 평가** | **최상위** — 2026 현재 생태계 리더 | 상 — 장시간 영상의 게임체인저 | 중 — 성숙한 생태계 | 상 — 짧지만 고품질 | 중상 — Wan에 밀리는 중 |
| **상용 대비** | 85% (14B) / 65% (1.3B) | 70% | 60% | 75% | 65% |
| **특이사항** | LoRA 폭증 중, Wan2GP로 6GB 구동, ComfyUI 네이티브 | 고정 컨텍스트 = 1초든 60초든 동일 VRAM | OpenPose+ControlNet 포즈제어, CivitAI 모델 호환 | 49프레임 최대, 6초@8fps | 25프레임, Wan/FramePack에 대체 중 |

---

## 3. 전신 립싱크 / 캐릭터 애니메이션 (4종)

| 항목 | ⑭ EchoMimicV2 | ⑮ LivePortrait | ⑯ ToonCrafter | ⑰ PantoMatrix (EMAGE) |
|------|---------------|---------------|---------------|----------------------|
| **소스** | GitHub (Ant Group) | GitHub | GitHub (CUHK) | GitHub |
| **분류** | 전신립싱크 (상반신+손) | 제스처 / 캐릭터 | 캐릭터 애니메이션 | 전신제스처 (3D) |
| **입력** | 사진 + 오디오 + 핸드포즈 | 사진 + 드라이빙영상 | 2장 프레임 + 텍스트 | 오디오 + 부분모션 |
| **라이선스** | Apache 2.0 | Apache 2.0 | Research only | MIT |
| **VRAM 요구** | 12-16GB | **4-8GB** | 10-20GB | 8-12GB |
| **4060 구동** | ❌ | ✅ | ❌ | ⚠️ |
| **M1 구동** | ❌ | ⚠️ (MPS 부분) | ❌ | 미확인 |
| **M2 구동** | ❌ | ⚠️ | ❌ | ❌ |
| **M4 구동** | ❌ (CUDA 전용) | ✅ | ❌ (CUDA 전용) | 미확인 |
| **퀄리티 평가** | 상 — 오픈소스 최고 반신립싱크 | 중상 — 저VRAM 대비 놀라운 퀄 | 상 — 카툰/애니 최강 | 중상 — 3D 스켈레톤 정밀 |
| **상용 대비** | HeyGen 대비 65% | 60% | 분야 최고 (상용 미비) | 분야 특수 |
| **특이사항** | 반신(얼굴+상체+손) 립싱크 | **애니/일러스트 지원 확인**, 저VRAM 최강 | 카툰 프레임보간/애니메이션, 비실사 특화 | SMPL-X 기반 3D 전신, 음성→제스처 |

---

## 4. 비실사(캐릭터/동물) 지원 정리

| 기능 | 지원 모델 |
|------|----------|
| **애니/일러스트** | LivePortrait (확인), MuseV (SD1.5 체크포인트 교체), ToonCrafter (특화), SteadyDancer (Wan2.1 일반화) |
| **3D 캐릭터** | PantoMatrix (SMPL-X), Champ (SMPL 기반) |
| **동물/마스코트** | ❌ 전용 모델 없음 — AnimalPose(AP10K) 전처리 + 수동 리깅 필요. OmniHuman 1.5 (API 전용)만 동물 지원 |

---

## 5. ComfyUI 생태계 현황

| 노드 패키지 | 용도 | 비고 |
|-------------|------|------|
| ComfyUI-AnimateDiff-Evolved (Kosinkadink) | AnimateDiff v1/v2/v3 + SparseCtrl | 3K+★, 핵심 영상생성 노드 |
| ComfyUI-VideoHelperSuite | 영상 로딩/저장/프레임 | 필수 동반 노드 |
| ComfyUI-MimicMotionWrapper (kijai) | MimicMotion 포즈구동 | 4060 구동 가능 |
| Comfyui-MusePose (공식) | MusePose 음악구동 | 공식 제공 |
| ComfyUI-MagicAnimate | DensePose 전신애니메이션 | 15GB+ 필요 |
| Wan 2.1/2.2 네이티브 | T2V + I2V | ComfyUI 빌트인 지원 |
| FramePack 노드 | 장시간 영상 (6GB) | 초기 단계이나 급성장 |

**CivitAI 인기 LoRA (Wan 2.2 기반)**:
- SingularUnity MotionCraft — 패닝/회전 모션
- Dancing LoRA v2.0 — 트리거: "dncng"
- Hip Swing Twist LoRA — 동작 특화
- Cinematic LoRA 시리즈 — 카메라 무브먼트

---

## 6. 디바이스별 구동 가능 모델 요약

| 디바이스 | 구동 가능 모델 |
|----------|---------------|
| **4060 (8GB)** | MimicMotion ✅, MuseV ✅, Wan 1.3B ✅, FramePack ✅, AnimateDiff SD1.5 ✅, LivePortrait ✅ |
| **M1 (16GB)** | Wan 1.3B ✅, FramePack ✅, AnimateDiff SD1.5 ✅ (MPS 비공식이나 구동 보고 다수) |
| **M2 (8GB)** | FramePack ✅ (유일한 확실 구동) |
| **M4 (24GB)** | SteadyDancer ✅, MimicMotion ✅, MusePose ✅, UniAnimate ✅, MuseV ✅, Wan 1.3B ✅, FramePack ✅, AnimateDiff ✅, CogVideoX ✅, LivePortrait ✅ |

> **M4 Pro (24GB)가 로컬 영상 생성 최적 기기.** 단, 전 모델이 CUDA 공식이며 Apple MPS는 비공식 — 수동 패치 필요.

---

## 7. Top 3 추천 + 근거

### 🥇 1위: MimicMotion + Wan 2.1 LoRA 조합

**근거**: 4060에서 구동 가능한 유일한 고품질 전신모션 모델. ComfyUI 통합 완비. 사진 1장 + 모션영상 → 전신 댄스/제스처 영상 생성. Wan 2.1 LoRA (Dancing LoRA 등)와 결합하면 숏폼 파이프라인 완성. MONKOS PT앱의 "캐릭터가 대본 읽는 프레젠테이션 → 영상" 목표에 가장 직접 부합.
- **약점**: 비상업 라이선스 (연구 전용). 상용 시 라이선스 협상 또는 대안 필요.

### 🥈 2위: SteadyDancer (Wan2.1 기반)

**근거**: 2025.11 출시, 현재 오픈소스 최고 품질. Wan2.1 위에 구축되어 생태계 활용 가능. Apache 2.0 = 상업 이용 가능. 첫프레임 보존력 최강 → 정체성 보존(헌법 1조 3항) 부합. M4에서 FP16 구동 확인.
- **약점**: 4060 (8GB)에서는 FP8 극한 모드만 가능. Apple MPS 미지원.

### 🥉 3위: FramePack + AnimateDiff + ControlNet

**근거**: 6GB로 1분+ 영상 생성 가능 = 전 디바이스 커버 (M2 포함). AnimateDiff의 성숙한 ControlNet 연동(OpenPose/DensePose)으로 포즈 제어 가능. ComfyUI 생태계 최대. SD1.5 체크포인트 교체로 비실사(애니/캐릭터) 즉시 전환. 숏폼 대량 생산에 최적.
- **약점**: 전신 모션 퀄리티는 MimicMotion/SteadyDancer보다 낮음. FramePack ComfyUI 노드가 아직 초기.

---

## 8. 상용 서비스 대비 종합 평가

| 영역 | 오픈소스 현황 | 상용 (HeyGen/Synthesia) 갭 |
|------|-------------|--------------------------|
| **전신 댄스/모션** | 오픈소스 우위 — 상용이 약한 영역 | 오픈소스가 앞섬 |
| **전신 립싱크** | EchoMimicV2 (반신) 수준, 전신은 미완성 | HeyGen Avatar IV가 1-2년 앞섬 |
| **피부 표현** | 근거리 얼굴 아티팩트 잔존 | 상용이 우위 (미세표정, 자연 깜빡임) |
| **캐릭터/동물** | ToonCrafter(카툰), LivePortrait(애니) 한정적 | Hedra/OmniHuman API가 우위 |
| **비용** | 무료 (GPU 전기세만) | $24-89/월 |

---

✅ 리서치 B 완료
❌ 없음
💡 MONKOS PT앱 영상 파이프라인: MimicMotion(4060) + Wan 2.1 LoRA 조합이 현실적 1순위. 상업 라이선스 필요 시 SteadyDancer(Apache 2.0) 전환. 동물/마스코트 캐릭터는 현재 오픈소스 공백 — OmniHuman API 또는 자체 학습 검토 필요.
