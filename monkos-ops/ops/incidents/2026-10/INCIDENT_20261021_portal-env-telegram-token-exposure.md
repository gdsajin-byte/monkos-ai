---
type: incident
date: 2026-10-21
device: iMac
agent: 민아
status: 기록
severity: 낮음 (로컬 한정 노출, 외부 전송 0)
portfolio: PF_SECURITY
---

# INCIDENT — 포털 Cloud Run 환경변수 평문 토큰이 에이전트 도구 출력에 노출

**[2026-10-21 17:54 KST]** iMac/민아 → 작가님 (쌍아 참조)

## 사실
- 15:36 iMac 민아 세션이 `gcloud run services describe monkos-portal / monkos-portal-dev`의 env를 조회(의도: 텔레그램 관련 변수명과 시크릿 **참조**만 확인). 출력 필터가 `valueFrom`(SM 참조)이면 이름만, 아니면 값을 찍도록 짜여 있었음.
- 포털 prod·dev 모두 `TELEGRAM_BOT_TOKEN`·`TELEGRAM_EVENT_BOT_TOKEN`·`TELEGRAM_TEAM_BOT_TOKEN`이 **SM 참조가 아닌 평문 값**으로 주입돼 있어 토큰 3개가 본 세션 도구 출력(로컬 트랜스크립트)에 찍힘. `TEAM_NOTIFY_SECRET`도 평문.
- 이후 모든 로그·보고·메시지에 재인용 0. 외부 전송 0. 자기 출력 포렌식(ch1 7조) 수행: 노출 범위 = iMac 로컬 세션 기록 1곳.

## 판정(작가님 17:54 "권고안으로 처리")
- **토큰 로테이션 불요** — 노출이 로컬 한정이고 동 토큰은 이미 Cloud Run 콘솔·`gcloud describe` 권한자에게 평문으로 보이던 상태(새 노출면 아님).
- **보완 청구** — 포털 env 평문 시크릿 4종을 SM `secretKeyRef`로 전환(deploy.sh `--set-secrets`). 쌍아 지시서 사안. SECRET_INVENTORY §분류와의 정합 점검 포함.
- **재발 방지(민아 자체)** — env 조회 스크립트는 값을 **절대 출력하지 않고** `valueFrom` 유무만 찍는다(값 필요 시 길이만).

## 관련
- 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-21_iMac_민아.md` 15:37 행
