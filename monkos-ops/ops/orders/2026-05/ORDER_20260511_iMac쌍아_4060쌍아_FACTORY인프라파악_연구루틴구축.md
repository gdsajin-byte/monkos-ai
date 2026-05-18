---
type: order
from: iMac/쌍아
to: 4060/쌍아
date: 2026-05-11
project: PF_FACTORY 인프라 파악 + 연구 루틴 구축
priority: 최우선
portfolio: PF_FACTORY
deadline: 가능한 빠르게 (Phase 0 → Phase 1 착수까지)
---

# 지시서: 4060 인프라 전수 파악 + 연구 데이터 루틴 구축

## 배경

- PF_FACTORY 발족 (2026-05-11) — 4060을 살아있는 AI 연구소로 가동
- 핵심 원칙: **GPU는 소모품, 연구 체계가 본체. 데이터가 쌓일수록 진화.**
- 현재 4060 상태: n8n(빈 껍데기) + 팩토리 봇(Firebase, 방치) — 실질 가동률 0%
- 이 지시서로 Phase 0(인프라 파악) → Phase 1(연구 루틴 착수)까지 일괄 진행

## PF_FACTORY 비전 (반드시 숙지)

`monkos-ops/ops/portfolios/PF_FACTORY.md` 를 먼저 읽을 것.

핵심: 매일 반복적인 모델 테스트 → 벤치마크 축적 → 스키마 정밀화 → 비교 테이블 완성 → PF_RND/PF_CHATBOT/PF_PHOTOPRO에 환류. PF_CHATBOT의 devlog 체계(RQ 레지스트리 + 서론 6단계)를 준용.

---

## 임무 1: 4060 인프라 전수 파악

### 1-1. 하드웨어 + OS

```
· GPU: 모델명, VRAM, CUDA 버전, 드라이버 버전
· CPU/RAM
· 스토리지: 전체/가용 용량
· OS: Windows 버전, WSL2 상태
· 네트워크: Tailscale IP, 외부 접근 경로
```

### 1-2. 소프트웨어 환경

```
· Python 버전 + 설치된 패키지 (pip list)
· CUDA toolkit 버전
· Docker 컨테이너 전수 (docker ps -a)
· n8n 상태 (워크플로우 0개 확인됨 — 활용 계획 수립)
· ComfyUI 설치 여부 + 버전 + 커스텀 노드 목록
· PyTorch 버전 + CUDA 바인딩 동작 확인
· Git 설정 (monk_project 클론 상태, remote, branch)
· HuggingFace CLI (huggingface-hub) 설치 여부
· 기타 AI 도구 (ollama, llama.cpp, vllm 등)
```

### 1-3. 기존 자산

```
· 로컬 모델 파일 (.safetensors, .gguf 등) 목록 + 용량
· ComfyUI 워크플로우 파일 (.json) 목록
· 학습 데이터셋 (있으면)
· scripts/ 또는 자동화 스크립트
· notify.ps1 동작 확인 (Firebase 엔드포인트 실측)
```

### 산출물

`REPORT_20260511_4060쌍아_인프라전수파악.md` → `monkos-ops/ops/reports/2026-05/`

---

## 임무 2: 연구 루틴 워크플로우 설계 + 구축

### 2-1. 오픈소스 모델 추적 파이프라인

**매일 자동 실행** — HuggingFace/Civitai 신규 모델 추적

```
[cron 또는 n8n 스케줄]
  → HuggingFace API: trending models + 신규 릴리즈 조회
     (text-generation, image-generation 카테고리)
  → Civitai API: 신규 체크포인트/LoRA 조회
  → 필터: 파라미터 크기, 라이선스, 한국어 지원, 순위
  → 결과 → 추적 테이블에 append (CSV 또는 마크다운)
  → 팩토리 봇 보고: "신규 모델 N건 감지"
```

**추적 테이블 스키마 (초안)**:

| 날짜 | 소스 | 모델명 | 파라미터 | 카테고리 | 라이선스 | HF 다운로드 | 비고 |
|------|------|--------|---------|---------|---------|------------|------|

n8n 활용: HuggingFace API 노드 + Civitai HTTP 노드 + 텔레그램 노드 연결. 또는 Python 스크립트 + cron. **n8n이 편하면 n8n으로, 스크립트가 낫다면 스크립트로 — 4060 현지 판단에 위임.**

### 2-2. 벤치마크 자동 실행

**주 2~3회** — 추적된 모델 중 후보를 자동 벤치마크

```
[트리거: 추적 테이블에 신규 후보 등록 시]
  → 모델 다운로드 (HF hub)
  → 벤치마크 실행:
     · 텍스트 모델: 응답 속도, 한국어 품질, VRAM 사용량
     · 이미지 모델: 생성 속도, 품질 (FID/CLIP score 또는 수동)
  → 결과 → 벤치마크 테이블에 append
  → 팩토리 봇 보고: "벤치마크 완료: {모델명} — {요약}"
```

**벤치마크 테이블 스키마 (초안)**:

| 날짜 | 모델명 | 파라미터 | 양자화 | VRAM(MB) | 속도(tok/s) | 한국어 점수 | 비고 |
|------|--------|---------|--------|---------|------------|-----------|------|

PF_CHATBOT devlog 체계 준용 — 벤치마크 결과가 곧 devlog 한 편.

### 2-3. ComfyUI 에셋 생산 파이프라인

**야간 배치** — 콘텐츠 에셋 대량 생산

```
[cron 야간 또는 수동 트리거]
  → ComfyUI API 호출 (워크플로우 JSON 로드)
  → 배치 프롬프트 실행
  → 산출물 → 지정 폴더에 저장
  → 팩토리 봇 보고: "배치 완료: N장 생성"
```

이건 ComfyUI가 설치되어 있고 워크플로우가 있을 때 착수. 없으면 Phase 1에서 설치.

### 2-4. n8n 활용 계획

현재 빈 껍데기 → 아래 워크플로우 구성:

| # | 워크플로우 | 트리거 | 내용 |
|---|-----------|--------|------|
| 1 | 모델 추적 | cron 매일 | HF API + Civitai → 추적 테이블 |
| 2 | 벤치마크 트리거 | 추적 테이블 갱신 시 | 후보 모델 자동 벤치 |
| 3 | 에셋 배치 | cron 야간 또는 수동 | ComfyUI API 호출 |
| 4 | 팩토리 봇 보고 | 각 워크플로우 완료 시 | Firebase /notifyWriter |

n8n 초기 셋업 필요: API 키 생성 + 텔레그램 크레덴셜 등록 + HuggingFace 토큰 등록

### 2-5. 데이터 적립 구조

```
monkos-ops/ops/portfolios/PF_FACTORY/
  ├── README.md (현재 PF 정본)
  ├── data/
  │   ├── model_tracking.csv       ← 오픈소스 추적 테이블
  │   ├── benchmarks.csv           ← 벤치마크 결과
  │   └── assets_log.csv           ← 에셋 생산 이력
  ├── devlog/
  │   ├── README.md                ← 서론 (RQ 레지스트리)
  │   ├── 001_첫_벤치마크.md       ← 첫 번째 연구 기록
  │   └── ...
  └── workflows/
      ├── n8n/                     ← n8n 워크플로우 JSON export
      └── comfyui/                 ← ComfyUI 워크플로우 JSON
```

---

## 임무 3: 팩토리 봇 복구 + 연동

### 3-1. Firebase Functions 동작 확인

```bash
# notify.ps1로 테스트 발신
. .\scripts\monkos\notify.ps1
Send-Monkos "info" "PF_FACTORY 가동 테스트"
```

동작하면 → 연구 루틴 보고를 이 경로로 연결.
실패하면 → 에러 내용 보고. Firebase 프로젝트 상태 확인.

### 3-2. SSH 키 등록 보완

이전 지시서에서 등록했으나 Windows OpenSSH 경로 이슈 가능성:

```powershell
# 관리자 PowerShell에서
$key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr"

# 일반 경로
Add-Content -Path "$env:USERPROFILE\.ssh\authorized_keys" -Value $key

# 관리자 계정 경로 (Windows OpenSSH 특수)
Add-Content -Path "C:\ProgramData\ssh\administrators_authorized_keys" -Value $key
icacls "C:\ProgramData\ssh\administrators_authorized_keys" /inheritance:r /grant "SYSTEM:F" /grant "Administrators:F"
```

등록 후 iMac에서 `ssh 4060 "echo ok"` 테스트 요청.

---

## ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 토큰을 보고서에 기재 금지. 변수명/위치만
- **PF_FACTORY 원칙**: 스키마와 데이터가 본체. 하드웨어 교체 시 계승 가능한 구조로
- **devlog 체계**: PF_CHATBOT 준용. RQ 등록 → 실험 → devlog 적립
- 데이터 파일(CSV 등)은 append-only 원칙. 기존 행 수정 금지
- n8n vs 스크립트 선택은 4060 현지 판단에 위임 — 단, 판단 근거를 보고서에 기록

## 산출물

1. `REPORT_20260511_4060쌍아_인프라전수파악.md`
2. 연구 루틴 워크플로우 (n8n JSON export 또는 스크립트)
3. PF_FACTORY 폴더 구조 생성 (data/, devlog/, workflows/)
4. 추적 테이블 + 벤치마크 테이블 스키마 확정 + 첫 데이터 1행
5. 팩토리 봇 동작 확인 (또는 실패 보고)

## 완료 기준

- [ ] 인프라 전수 파악 보고서
- [ ] 연구 루틴 1개 이상 자동 가동 (모델 추적 최소)
- [ ] 데이터 테이블 첫 1행 적립
- [ ] 팩토리 봇 테스트 발신 성공 (또는 실패 사유)
- [ ] SSH 키 보완 → iMac 접속 테스트 대기
- [ ] PF_FACTORY 히스토리 어펜드 + push
