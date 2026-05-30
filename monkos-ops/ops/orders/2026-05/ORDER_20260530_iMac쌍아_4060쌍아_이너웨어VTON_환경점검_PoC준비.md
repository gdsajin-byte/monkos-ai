---
type: order
date: 2026-05-30
from: iMac/쌍아
to: 4060/쌍아
portfolio: PF_FACTORY
subject: 이너웨어 AI 모델(VTON) 사업화 PoC — SSH 키 복구 + ComfyUI 환경 인벤토리 + IP-Adapter 착장 PoC
status: 발행
---

# ORDER — 이너웨어 VTON 환경 점검 + PoC 준비

## 배경

작가님이 **이너웨어(보정속옷) AI 모델 외주 견적**을 검토 중. 자체 4060 구축이 외주를 대체할 수 있는지 **실측으로 판단**해야 한다. iMac에서 4060 원격 SSH가 키 인증 거부로 막혀(아래 Phase 0), 4060/쌍아가 로컬에서 수행한다.

### 리서치 근거 (딥리서치 2026-05-30, 103 에이전트 교차검증)
- 8GB 단독 **기성 VTON 모델로는 답이 없음**: CatVTON(유일 8GB)은 ①CC BY-NC 비상업 라이선스(이커머스 불가) ②평면 텍스처(레이스/메시 부적합) ③mask 기반(합성 티). 고품질(IDM-VTON 16GB·FitDiT 19.5GB·LPH 22GB·CaP 40GB)은 전부 8GB 초과.
- **구조-텍스처 딜레마**(검증됨): 가벼운 모델=텍스처 평면화 / 텍스처 풍부=VRAM 큼. 8GB로 둘 다 못 잡음.
- **이너웨어는 어떤 모델·데이터셋도 미검증**(VITON-HD가 브라/팬티/란제리 명시 제외) → 모델 선택 무관, **PoC 실측이 유일한 길**.
- **8GB 현실 스택 결론**: SDXL 사실계(Juggernaut/RealVisXL) + **IP-Adapter**(제품 참조) + **ControlNet**(포즈) + (부족 시)**제품 LoRA**. Flux는 8GB 학습 불가라 제외.
- 작가님 자산: 이미 **Imagen 4 모델 컷 수백 장** 보유 → ControlNet 포즈 소스 + 모델 룩 레퍼런스로 활용.

---

## ⚠️ 준수 조항

- **헌법 3조**: 매 턴 `date`로 KST 타임스탬프. 세션 로그 `monkos-ops/ops/sessions/2026-05/2026-05-30_4060_쌍아.md` 즉시 어펜드. 완료 보고 `✅❌💡⏳📁🔀` 형식.
- **헌법 4조**: `rm -rf`/force 등 파괴적 명령 금지. **비밀번호·토큰 생성·추측 금지**(모르면 작가님께 질문). `.env`/sshd_config 등 수정 전 보고.
- **Phase 순서 엄수**: Phase 0(키 복구) → 즉시 iMac 보고(원격 검증) → Phase 1(인벤토리) 완료·보고 → Phase 2(PoC, 제품 샘플 입수 후).
- 제품 샘플 미입수 시 Phase 1까지 완료하고 **대기**(임의 진행 금지).

---

## Phase 0 — SSH 키 인증 복구 (iMac 원격 접근 회복)

원인: 4060 smuse73=관리자 → Windows OpenSSH가 `C:\ProgramData\ssh\administrators_authorized_keys`를 읽는데, 그 파일의 **소유자/ACL이 풀려 sshd가 키를 거부**. 등록된 키는 정확함(`...p+cXCd jeong-kyushin@monk.kr`, iMac 현재 키와 일치).

**관리자 PowerShell**:
```powershell
# 1) 키 존재 확인 (없으면 다음 줄 실행)
Get-Content C:\ProgramData\ssh\administrators_authorized_keys
# (없을 때만) Add-Content C:\ProgramData\ssh\administrators_authorized_keys "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr"

# 2) 핵심 — 소유자/권한 복구 (이게 풀려서 거부됨)
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:(F)" /grant "Administrators:(F)"

# 3) sshd 재시작
Restart-Service sshd
```

**검증**: 완료 후 iMac/쌍아에 보고 → iMac에서 `ssh 4060 'hostname'`(DESKTOP-70GOMAR 기대) 원격 확인.

> 참고: 2026-02-14 세션 로그에 동일 함정·복구 절차 기록됨.

---

## Phase 1 — ComfyUI 환경 전수 인벤토리

대상: `C:\AI_Factory\` ComfyUI. 다음을 전수 조사해 REPORT로 적립.

| 항목 | 확인 내용 |
|------|-----------|
| 체크포인트 | `models/checkpoints` — Juggernaut XL / RealVisXL / HelloWorldXL / 기타 (버전 포함) |
| LoRA | `models/loras` 전체 목록 |
| ControlNet | `models/controlnet` — OpenPose / Depth / Canny 등 SDXL용 유무 |
| IP-Adapter | `models/ipadapter` + CLIP-Vision(`models/clip_vision`, ViT-H 등) 유무 |
| 커스텀 노드 | `custom_nodes` — **ComfyUI_IPAdapter_plus**, **comfyui_controlnet_aux**, 기타 |
| 학습 도구 | **kohya_ss** 설치 위치/버전 (제품 LoRA 2단계용) |
| GPU | `nvidia-smi` 실측 — 가용 VRAM(유휴 시) |

**산출**: `REPORT_20260530_4060쌍아_ComfyUI환경인벤토리.md` (PF_FACTORY/reports 또는 ops/sessions). IP-Adapter·ControlNet 노드가 **없으면 설치**하고 그 사실을 보고.

---

## Phase 2 — IP-Adapter 제품 착장 PoC (제품 샘플 입수 후)

> 입력: 작가님 제공 **제품 이미지 1종** + **기존 Imagen 모델 컷 1장**(ControlNet 포즈 소스). 미입수 시 착수 보류.

- **스택**: Juggernaut XL(또는 RealVisXL) + IP-Adapter(제품 참조, CLIP-ViT-H) + ControlNet(OpenPose 또는 Depth, 포즈 고정)
- **파라미터 탐색**: IP-Adapter weight / denoise / ControlNet strength 격자 탐색
- **산출**: 착장 **10컷** + 자가 평가표
- **평가축**: (1) 제품 디테일 보존(레이스·메시·투명도·봉제선) (2) 피부-원단 경계 자연스러움(인페인팅 티 없음) (3) 포즈/구도 일치 (4) 컷당 생성 속도(4060 실측)
- **한계 판정**: IP-Adapter로 디테일이 부족하면 "제품 LoRA 필요" 결론을 명시(LoRA 학습은 **별도 지시서**, 이번 PoC 범위 외).

**산출물**: 10컷 이미지 + `COMPLETION_20260530_4060쌍아_이너웨어VTON_IPAdapter_PoC.md` + 세션 로그 어펜드.

---

## 보고 체계

- Phase 0 완료 → **즉시** iMac 보고 (원격 검증 트리거)
- Phase 1 완료 → 인벤토리 REPORT + 보고
- Phase 2 완료 → COMPLETION + 10컷 + 자가평가
- 막힘 3회 반복 시 에스컬레이션. 비밀정보 필요 시 작가님께 질문(추측 금지).
