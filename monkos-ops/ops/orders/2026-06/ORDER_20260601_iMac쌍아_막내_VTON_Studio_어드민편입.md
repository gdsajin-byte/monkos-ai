---
type: order
date: 2026-06-01
device: iMac
agent: 쌍아
from: iMac/쌍아
to: 막내
portfolio: PF_VTON
status: 발행
subject: VTON Studio monkos 어드민 편입 + RunPod 프록시 백엔드 (PF_VTON Phase 4, 1단계)
---

# 지시서: VTON Studio — monkos 어드민 편입 (1단계)

**[2026-06-01 18:33 KST] iMac/쌍아 → 막내**

---

## 1. 배경

2026-06-01 세션에서 RunPod Flux Fill 기반 이너웨어 VTON PoC를 완성했다.
- ComfyUI(RunPod 3090) + CatVTON-Flux + SAM2 자동마스크 파이프라인 검증
- **품질 핵심 = garment·person 포즈/각도 일치** (정면↔정면, 측면↔측면)
- 로컬 프로토타입 `MONK VTON Studio`(단일 HTML, ComfyUI API 래퍼) 제작 — ComfyUI 노드를 숨기고 입력/마스크프리셋/출력만 다루는 전용 UI

작가님 방향(2026-06-01): **"필요가 도구를 낳는다. PF가 진화하는 로드맵."**
로컬 프로토타입 → **monkos 어드민 편입** → 노드 디스플레이 확장 → MONK OS 통합 콘솔 → 자체앱. 본 지시서는 그 **1단계**다.

> 상세 맥락: PF_VTON README, 세션로그 `2026-06-01_iMac_쌍아.md`

## 2. 목표 (1단계 범위)

monkos 어드민에서 **버튼 하나로 RunPod을 깨우고, 모델·의상을 올려 VTON 생성, 결과 확인**까지. RunPod 키는 백엔드에만 가둔다.

## 3. 기존 자산 (베이스)

| 자산 | 경로 | 용도 |
|------|------|------|
| Studio 프로토타입 | `monkos-ops/ops/portfolios/PF_VTON/studio/vton_studio_prototype.html` | 프론트 이식 베이스 (UI/업로드/생성/결과 로직 완비) |
| 워크플로우 템플릿 | `…/studio/catvton_workflow_template.json` | ComfyUI API 포맷 (22노드, 모델/좌표 검증됨) |
| UI→API 변환기 | `…/studio/wf_convert.py` | 참조용 (ComfyUI UI JSON → API 변환 로직) |

**RunPod 인프라 (구축 완료, 재사용)**
- pod `nkw5t0uvfn0ub1` (RTX3090, EXITED 상태) / 볼륨 `e0sdw1kxku` (100GB, ComfyUI·Flux Fill·CatVTON·노드 전부 영속)
- ComfyUI 기동: pod start 후 `/opt/venv/bin/python /workspace/ComfyUI/main.py --listen --enable-cors-header` (venv 필수 — 시스템 python 아님)
- RunPod REST: `https://rest.runpod.io/v1/pods/{id}/start|stop`, 상태 조회 `GET /v1/pods/{id}`
- ComfyUI 포트 8188(http), 22(tcp). 포트매핑은 pod 부팅 후 GraphQL `pod.runtime.ports`로 조회

## 4. 작업 범위

### 4-1. 현황 파악 (착수 전 필수)
- `monkos_AI/portal/` 구조: `server.js`(Express, 426줄) 라우트 패턴, 인증 미들웨어, `public/admin/` 페이지 구조(layout.html·index.html·css/js)
- 어드민 네비게이션에 새 탭(VTON Studio) 추가 방식 파악

### 4-2. 백엔드 — RunPod 프록시 (server.js)
RunPod 키·pod IP를 백엔드에 가두고, 어드민 프론트는 프록시만 호출한다.
- `POST /admin/api/vton/pod/start` → RunPod start. 부팅·ComfyUI 기동 대기 후 준비완료 응답
- `GET  /admin/api/vton/pod/status` → pod 상태 + ComfyUI 헬스(8188) + 접속 포트
- `POST /admin/api/vton/pod/stop` → RunPod stop (과금 정지)
- `ALL  /admin/api/vton/comfy/*` → ComfyUI API 중계(`/prompt`·`/upload/image`·`/view`·`/history`·`/object_info`). pod IP는 서버가 status에서 확보해 주입
- 키: `process.env.RUNPOD_API_KEY` (GitHub secret 기존 등록됨). HF 토큰 필요시 동일 패턴

### 4-3. 프론트 — 어드민 VTON Studio (public/admin/vton-studio.html)
- 프로토타입 HTML을 어드민 레이아웃/인증 안에 이식
- **API 베이스를 프록시(`/admin/api/vton/comfy/...`)로 교체** (프로토타입은 localhost:8188 직접 호출 — 이 부분만 바꾸면 됨)
- **RunPod 스타트/스톱 버튼 + pod 상태 인디케이터** 추가 (start→"깨우는 중"→"준비됨")
- 마스크 프리셋(상의만/세트)은 프로토타입 그대로. person/garment 업로드·생성·결과 갤러리 유지

### 4-4. 배포 + 보고
- `monkos_AI/portal/deploy.sh` 경유 배포
- COMPLETION 보고서 → `monkos-ops/ops/reports/2026-06/`, PF_VTON 히스토리 1행 어펜드

## 5. ⚠️ 준수 조항

- **헌법 4조 1·2항 (비밀정보)**: RunPod API 키·HF 토큰은 **백엔드 환경변수에만**. 프론트/HTML/JS·git에 **절대 노출 금지**. 브라우저가 RunPod을 직접 호출하게 만들지 말 것(반드시 프록시 경유). `.env`·`deploy.sh` 수정 전 **작가님 승인**.
- **법률 ch5 (배포)**: Cloud Run 배포는 **`deploy.sh` 경유 필수**. `gcloud run deploy` 직접 실행 금지.
- **법률 ch6 (브랜치)**: main 단일 브랜치.
- **범위 한정**: 본 지시서는 **1단계**(어드민 편입 + 프록시 + start버튼)까지. 노드 디스플레이·파라미터 동적세팅창(2단계)은 범위 외 — 별도 지시. 범위 밖 작업 필요 시 보고 후 대기.
- **막힘 시**: ComfyUI 재기동은 venv(`/opt/venv/bin/python`) 필수(시스템 python이면 torch/PIL 누락으로 크래시 — 세션로그 12:43 교훈). pod start 시 GPU 가용성 Low로 실패할 수 있음 → 재시도 폴링.

## 6. 산출물
- `monkos_AI/portal/server.js` (RunPod 프록시 라우트 추가)
- `monkos_AI/portal/public/admin/vton-studio.html` (+ 네비 편입)
- deploy.sh 경유 배포 완료
- COMPLETION 보고서 + PF 히스토리 갱신

---

✅❌💡⏳📁🔀
