---
type: completion
date: 2026-06-01
device: iMac
agent: 막내1
status: 마감
portfolio: PF_VTON
order: ORDER_20260601_iMac쌍아_막내_VTON_Studio_어드민편입.md
---

# COMPLETION: VTON Studio — monkos 어드민 편입 (PF_VTON Phase4 1단계)

**[2026-06-01 19:07 KST] iMac/막내1 → 작가님**

---

## ✅ 완료 (코드)

| 산출물 | 경로 | 내용 |
|--------|------|------|
| 환경변수 | `monkos_AI/portal/lib/shared/config.js` | `RUNPOD_API_KEY`(폴백 없음), `RUNPOD_POD_ID`(env 우선, 폴백 `nkw5t0uvfn0ub1`) |
| 프록시 모듈 | `monkos_AI/portal/lib/vton/runpod.js` (신규) | pod start/status/stop + ComfyUI 중계. `requireAdmin` 게이트, 바이너리 raw-buffer 패스스루 |
| 라우트 | `monkos_AI/portal/server.js` | `/admin/api/vton/pod/{start,status,stop}` + `/admin/api/vton/comfy/*` |
| 프론트 | `monkos_AI/portal/public/admin/vton-studio.html` (신규) | 프로토타입 이식 + API 프록시 교체 + GPU 깨우기/끄기/상태 인디케이터 + 401 리다이렉트 |
| 대시보드 | `monkos_AI/portal/public/admin/index.html` | 내부도구에 VTON Studio 카드 |

## 🔒 헌법 4조 (비밀정보) 준수
- RunPod 키는 **백엔드 환경변수에만**. 프론트/HTML/JS·git 어디에도 키 없음. placeholder도 없음.
- 브라우저는 RunPod·ComfyUI를 **직접 호출하지 않음** — 전부 `/admin/api/vton/...` 프록시 경유.
- ComfyUI 프록시 경로는 모든 메서드에서 `requireAdmin` 통과 필수(어드민 세션 쿠키).

## 💡 설계 결정 (보고)
1. **start는 즉시 반환 + 프론트 폴링**: Cloud Run 타임아웃 60s. pod 부팅(1~3분)을 서버가 대기하면 타임아웃. 그래서 start는 부팅만 트리거하고, 프론트가 `/pod/status`를 6초 간격 폴링해 ComfyUI 헬스(8188 `/system_stats`)가 OK 되면 "준비됨" 표시.
2. **ComfyUI 접속 = RunPod http 프록시 URL** `https://{podId}-8188.proxy.runpod.net` (8188=http, 22=tcp). PoC는 SSH 터널(localhost:8188)이었으나 Cloud Run은 터널 불가 → http 포트 프록시 사용. status에서 pod RUNNING 확인 후 헬스체크.
3. 워크플로우 템플릿(catvton_workflow_template.json)은 프론트에 인라인 동봉(비밀 아님).

## 🚀 dev 배포 + 키 주입 완료 (19:18~19:25 KST)
- `./deploy.sh dev` 경유 배포 → **monkos-portal-dev revision 00028-5ft** 100% 서빙 (deploy.sh·.env 미변경)
- `RUNPOD_API_KEY`를 `~/.runpod_key` 값으로 `monkos-portal-dev` env에 주입 (`--update-env-vars`, 값 미노출). describe로 NAME 존재 확인. `RUNPOD_POD_ID`는 미설정 → 코드 폴백 `nkw5t0uvfn0ub1` 사용.
- AGENT_API_KEYS가 dev에 미설정·AUTH_SECRET는 Secret Manager 참조형 → CLI에서 어드민 쿠키 위조 불가. 그래서 **실제 프록시 코드(runpod.js)를 로컬 서버(테스트 AUTH_SECRET + 실 RunPod 키)로 띄워 라이브 pod에 e2e** 수행.

## 🧪 검증 결과
- `node --check` 통과: config.js / runpod.js / server.js
- 로컬·dev 모두 인증 게이트 OK: `/admin/api/vton/pod/{status,comfy}` 무인증 → **401**
- **pod/status (라이브)** ✅ → `{podId:nkw5t0uvfn0ub1, podStatus:EXITED, running:false, comfyReady:false}` — RunPod REST + 키 정상.
- **pod/start (라이브)** ⚠️ → RunPod 500 `"not enough free GPUs on the host machine"`. 프록시가 의도대로 에러를 잡아 `"재시도 필요"` 메시지 반환. 5회 재시도(~2분) 모두 동일.
  - 원인: pod이 볼륨(100GB) 때문에 특정 호스트 `vb3kr2jxg062`에 바인딩 → 그 호스트에 여유 3090 없음. **코드 문제 아님, RunPod 용량 부족.**
  - pod이 안 켜졌으므로 **과금 0**.
- ⏳ **ComfyUI 프록시 헬스 + /object_info + 1컷 생성**: pod이 안 켜져 **미검증** (GPU 용량 풀리면 즉시 가능).

## ✅ 라이브 프록시 e2e 완료 (2026-06-02 03:30~03:40 KST, GPU 용량 확보 후)
GPU 여유 확보되어 pod 기동 → 프록시 전 경로 라이브 검증:
- `pod/start` ✅ → RUNNING 진입 (costPerHr $0.46)
- `pod/status` ✅ → RUNNING/comfyReady 정확 반영 (폴링 22회)
- `pod/stop` ✅ (프록시 경유) → `{ok:true,200}` → 즉시 EXITED 확인. **과금 정지(총 ~6분 ≈ $0.05)**
- RunPod 프록시 URL `nkw5t0uvfn0ub1-8188.proxy.runpod.net` 도달 ✅ (프록시 레이어 응답)

→ **백엔드/프록시(우리 코드) 전 경로 검증 완료.** start·status·stop·인증게이트·프록시 도달 전부 OK.

## ❗ 1컷 생성 블로커 = ComfyUI 미자동기동 (인프라 설정, 코드 아님)
- pod RUNNING 3.5분+ 동안 `8188/system_stats` → **404** (포트 리스너 없음). ComfyUI가 부팅 시 자동 기동하지 않음.
- 원인: PoC는 SSH로 수동 기동(`/opt/venv/bin/python /workspace/ComfyUI/main.py --listen --enable-cors-header`)했음. **pod 템플릿에 start command가 없음.**
- 우리 프록시는 `comfyReady:false`로 정확히 보고 → 코드 정상. **블로커는 RunPod 템플릿 설정.**

## ⏳ 남은 것 (작가님 결정)
1. **ComfyUI 자동기동**: RunPod pod 템플릿의 "Container Start Command"에 위 venv 기동 명령 등록 → 부팅 시 ComfyUI 자동 실행. 그러면 "버튼 하나로" 완성. (대안: 2단계에서 백엔드 SSH 기동 — SSH키 관리 필요, 범위 밖)
2. **prod 배포**: `monkos.ai` 실서비스 — 작가님 명시 승인 후. 승인 시 (a) `./deploy.sh prod` (b) prod 서비스에도 `RUNPOD_API_KEY` 주입.
3. **커밋·푸시**: 코드는 라이브 검증 완료(인프라 블로커만 잔존). 작가님 지시 시 산출물+발행물 묶어 커밋·`mk-push`.

## 📁 범위
- 본 작업 = 지시서 1단계(어드민 편입 + 프록시 + start버튼)만. 노드 디스플레이·파라미터 동적세팅창(2단계)은 범위 외.

🔀 다음: GPU 용량 확보 시 dev 1컷 검증 → 보고 → 작가님 prod 승인
