---
type: order
date: 2026-10-27
from: iMac/쌍아
to: iMac/쌍아-막내21
device: iMac
agent: 쌍아
subject: RunPod 매팅 워밍 조건부화 + 백업 전환 시 고객 안내(4언어)·팀 알림 — 구현·dev 검증까지 (prod 배포 없음)
status: 대기
portfolio: PF_INFRA
---

# ORDER — 매팅 워밍 조건부화 + 백업 지연 안내

**[2026-10-27 16:47 KST]** iMac/쌍아 → iMac/쌍아-막내21

> 출처: 작가님 2026-10-27 16:47 KST (iMac 쌍아 세션 사람 턴) "승인" — 대상: 설계서 [DESIGN_20261027_PORTAL_매팅워밍조건부_백업지연안내](../../../tech/designs/2026-10/DESIGN_20261027_PORTAL_매팅워밍조건부_백업지연안내.md). 작가님 16:44 "워밍을 끄되 혹시 그쪽으로 늦게 넘어갈때 메세지를 설계해봐".

## 할 일

**설계서 §2 전체를 구현한다.** 설계서가 정본이다 — 문구·수치·조건을 바꾸지 않는다. 바꿔야 할 사유를 발견하면 구현 전에 쌍아에게 보고.

1. `portal/lib/matte.js` — `warmupMatteEngine()` 조건부화(1순위 자체 서버 /health 우선, 60초 캐시 `engineState`), 백업 전환 로그 `[Matte] BACKUP via=runpod reason=… cold=…s`, 백업 전환 텔레그램(쿨다운 키를 기존 '전 엔드포인트 실패' 경보와 분리). 체인 순서·타임아웃·재시도 **불변**.
2. `portal/server.js` — precheck 응답에 `engineReady` 추가(엔진명 노출 금지).
3. `public/js/specs-funnel.js` — 사전 안내 1줄(검수 단계), `engineReady===false`일 때만 10초 문구, 유료 25초 이후 환급 안심 문구.
4. `lib/cms/specs-i18n.js` — 설계서 §2-2·2-3 문구 ko·ja·en·es.
5. **환급 안심 문구 적용 범위 실측**: 유료 경로별로 실패 시 `refundGate`가 실제 발화하는지 코드로 확인하고, 발화가 확인된 경로에서만 노출. 확인 결과를 보고서에 표로.

## 검증 (설계서 §3 수용 기준 1~4)

- dev 배포: `monkos_AI/portal/deploy.sh`의 dev 경로만. **prod 배포·엣지 재배포 금지** — 작가님 "배포 승인" 대상.
- ⚠️ **iMac 매팅 서버를 멈추거나 터널을 끊지 않는다** — prod가 같은 서버를 쓰는 공유 자원이다(메모리: 공유자원=dev 게이트 무효, 07-25 실사고). 수용 기준 2의 "iMac 불통"은 **dev 서비스의 1순위 URL만 불통 주소로 바꿔** 재현한다(dev env 한정, 검증 후 원복).
- 수용 기준 2의 텔레그램 실발송은 1건 허용, 메시지에 `[dev]` 표기.
- RunPod 호출 0 판정은 dev 로그 + `monkos-ops/ops/audit/RUNPOD_USAGE.jsonl` 기록 방식(또는 RunPod 상태 API) 전후 대조 — 대조군 1회 포함(live-verify.md 3절).
- specs-i18n 변경이 엣지 SSG 산출물에 들어가는지 확인하고, 들어가면 "prod 반영 시 엣지 재배포 필요"를 보고서에 명기.

## 산출물

- 코드 커밋(롤백 단위 = 서버 1 / 프론트·i18n 1, 2커밋 권장)
- `monkos-ops/ops/reports/2026-10/COMPLETION_20261027_iMac쌍아-막내21_INFRA_매팅워밍조건부.md` — 변경 파일·dev rev·수용 기준 1~4 결과(판정 방법 병기)·환급 경로 표·prod 배포 시 필요한 절차(포털+엣지 여부).

## 쓰기 범위

위 코드 4파일 + 보고서 + 막내 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-27_iMac_쌍아-막내21.md`. dev env 일시 변경(원복 필수). 그 외 없음.

## ⚠️ 준수 조항

- 헌법 3조 1·2항, 4조 1항(시크릿 생성·추측 금지 — 기존 SM 값만), 4조 4항(되는 것만 안내), ch5(prod 배포 = 작가님 승인), ch8(고객 대면 내부 명칭 금지 — iMac·RunPod·Gemini 노출 0), 고객 호칭 원칙(문구는 존칭 서술).
- ch1 7조: 이 지시서 외 범위 확장 금지.

## 완료 기준

- [ ] 수용 기준 1~4 전부 판정(방법 병기)
- [ ] dev env 원복 확인
- [ ] 커밋·푸시 + 원격 SHA 대조, 쌍아(로컬 주소 monk-project-2f)에 세션 메시지 1회

## 커밋 메시지

```
[fix] 매팅 RunPod 워밍 조건부화 — iMac 생존 시 비가동·백업 전환 로그/알림
[feat] 매팅 백업 전환 시 고객 안내 — precheck engineReady·4언어 문구
```
