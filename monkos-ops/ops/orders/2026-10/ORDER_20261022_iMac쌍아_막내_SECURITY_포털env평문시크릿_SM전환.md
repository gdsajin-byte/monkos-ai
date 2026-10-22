---
type: order
date: 2026-10-22
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 포털 Cloud Run env 평문 시크릿 4종 → SM secretKeyRef 전환 (dev 선행, prod는 작가님 승인)
status: 발행
portfolio: PF_SECURITY
---

# ORDER — 포털 env 평문 시크릿 SM 전환

> 출처: 작가님 2026-10-21 17:54 (iMac-민아-1015-1939 사람 턴) "세가지다 권고안으로 처리" — `incidents/2026-10/INCIDENT_20261021_portal-env-telegram-token-exposure.md` 보완 청구 수락. 작가님 2026-10-22 16:23 (iMac 쌍아 세션 사람 턴) "진행해".
> 이 지시서는 **prod 배포 승인을 포함하지 않는다**. prod 단계는 그 시점에 새 사용자 턴 승인을 받는다(ch1 7조 2항·ch5).

## 1. 목적

`monkos-portal`(+`-dev`)에 평문 env로 직주입된 4종을 SM 참조로 바꿔, `gcloud run services describe`·콘솔에서 값이 보이지 않게 한다. 토큰 로테이션은 불요 판정(INCIDENT).

| 변수 | SM 존재 (10-22 16:24 `secret check` 실측) |
|------|------|
| TELEGRAM_BOT_TOKEN | ✅ |
| TELEGRAM_TEAM_BOT_TOKEN | ✅ |
| TEAM_NOTIFY_SECRET | ✅ |
| TELEGRAM_EVENT_BOT_TOKEN | ❌ **SM 없음** |

## 2. 절차

1. **값 일치 확인 (출력 금지)**: SM 존재 3종에 대해 Cloud Run 현행 env 값과 SM `latest` 값이 같은지 **해시 비교만**(`sha256sum` 결과의 일치 여부 Y/N만 기록, 해시 자체도 기록하지 않음). 불일치 시 중단·보고.
2. **TELEGRAM_EVENT_BOT_TOKEN**: SM 미등재 → **만들지 말고 중단 보고**. 등재는 작가님 `scripts/secret.sh add` 경로(헌법 4조 1항). 작가님 등재 후 재개.
3. **deploy.sh 수정** (`monkos_AI/portal/deploy.sh`): `SECRETS`에 4종 추가, 194행 주석("서비스 env 직주입 유지")을 이 지시서 근거로 갱신. 기존 평문 env와 같은 이름을 secret으로 바꿀 때 Cloud Run 타입 충돌 오류가 날 수 있다 → 같은 배포에서 `--remove-env-vars` 처리 여부를 **dev에서 먼저 실측**.
4. **dev 배포**: `deploy.sh dev`(정본 경유, `gcloud run deploy` 직접 금지). 검증: describe 결과 4종이 `valueFrom.secretKeyRef`(값 미출력 필터로), 팀봇 웹훅 `/api/webhook/telegram-team` 수신 1회·`TEAM_NOTIFY_SECRET` 사용 경로 1회 정상.
5. **prod**: dev 판정표를 첨부해 작가님께 승인 요청 → 새 사용자 턴 승인 후 `deploy.sh prod`. 검증은 4와 동일 + CS봇·이벤트봇 웹훅 각 1회.
6. **SECRET_INVENTORY.md** 해당 행 갱신(주입 방식 SM 참조).

## 3. 범위

**허용**: `monkos_AI/portal/deploy.sh` 수정 · dev 배포 · SECRET_INVENTORY 갱신 · 웹훅 기능 스모크.
**금지**: 시크릿 생성·로테이션 · 값 출력(어떤 형태로든 — env 조회는 `valueFrom` 유무만) · 승인 없는 prod 배포 · 웹훅 URL 변경.

## 4. 반환

완료 보고: 단계별 판정(값 일치 Y/N, dev describe, 웹훅 스모크), 커밋 SHA(원격 대조), prod 승인 요청 시각·결과, 중단 시 사유.
