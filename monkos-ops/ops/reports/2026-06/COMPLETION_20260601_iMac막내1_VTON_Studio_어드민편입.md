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

## ⏳ 배포 대기 — 작가님 결정 필요 (미배포)
deploy.sh·.env 무단 수정 금지(헌법 4조 1항) + 프로덕션 포털 배포는 영향범위가 커서 **배포 전 확인 요청**:

1. **RUNPOD_API_KEY가 GCP Cloud Run 환경변수에 없음.** 현재 "GitHub secret"으로만 등록 — GitHub secret은 Cloud Run으로 자동 주입되지 않음. `deploy.sh`는 `--update-env-vars`(나열된 키만 갱신, 기존 보존)이라 TOSS 키처럼 **GCP 콘솔에 수동 설정**하면 배포 간 유지됨. 키 미설정 시 프록시는 503 반환(안전 차단).
   - 선택지 A: 작가님이 GCP 콘솔 monkos-portal 환경변수에 `RUNPOD_API_KEY` 수동 추가 (deploy.sh 미변경) — 권장
   - 선택지 B: deploy.sh의 `--update-env-vars`에 추가 (deploy.sh 수정 → 승인 필요)
2. **배포 대상 env**: `dev`(monkos-portal-dev) 선검증 권장 → `prod`(monkos.ai 실서비스). prod는 라이브 포털이라 작가님 명시 승인 후 진행.
3. **RUNPOD_POD_ID 확인**: 지시서는 `nkw5t0uvfn0ub1`. 6/1 세션에 새 3090 pod 생성 기록 있음 — 현재 유효 pod id 확인 필요(다르면 GCP env `RUNPOD_POD_ID`로 오버라이드).

## 🧪 로컬 검증
- `node --check` 통과: config.js / runpod.js / server.js
- 로컬 서버 부팅(PORT=8099): `/health` 200, `/admin/vton-studio.html` 200
- 인증 게이트: `/admin/api/vton/pod/status`·`/admin/api/vton/comfy/system_stats` → **401**(어드민 세션 없으면 차단) 확인
- ⚠️ 라이브 e2e(pod start→업로드→생성→결과)는 **미수행**: RUNPOD_API_KEY(GCP)·pod 가동(과금)·어드민 쿠키 필요. 배포 후 작가님과 함께 1컷 검증 권장.

## 📁 범위
- 본 작업 = 지시서 1단계(어드민 편입 + 프록시 + start버튼)만. 노드 디스플레이·파라미터 동적세팅창(2단계)은 범위 외.

🔀 다음: 작가님 배포 승인(env·키 설정) → deploy.sh 경유 배포 → 라이브 1컷 검증
