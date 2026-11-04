---
type: incident
date: 2026-11-04
device: iMac
agent: 쌍아
severity: 경미
service: matte-imac (vision-matte, 매팅 체인 1순위)
status: 마감
---

# INCIDENT — matte-imac 프로세스 오종료 (<30초)

**[2026-11-04 19:29 KST]** iMac/쌍아 → 작가님

- 경위: 막내7(ORDER_20261104 여권화각_출고본대조)이 측정 전용 vision-matte 사본(:8097)을 `pkill -f`로 종료하면서, 같은 바이너리 경로(`~/.monkos/vision-matte/vision-matte`)로 떠 있던 prod 인스턴스(:8000)까지 종료. launchd KeepAlive가 19:28:26 재기동.
- 영향: 끊김 <30초. 막내7 실측 — 터널 오류 0, 해당 구간 요청 공백. 체인상 불통 시 RunPod 폴백 경로 존재. 쌍아 19:29 재실측: 외부 health 2회 200, 로컬 :8000 200, launchd running(pid 3766).
- 원인: 프로세스 패턴 종료(`pkill -f <바이너리 경로>`)가 동일 바이너리의 운영 인스턴스를 구분하지 못함.
- 재발 방지: 측정·시험용 사본은 **기동 시 PID를 기록해 그 PID만 종료**한다. 운영 바이너리 경로로 `pkill -f`/`killall` 금지. 다음 지시서 준수 조항에 1줄 추가.
