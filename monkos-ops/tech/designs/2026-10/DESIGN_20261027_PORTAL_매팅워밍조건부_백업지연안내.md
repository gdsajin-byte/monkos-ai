---
type: design
date: 2026-10-27
device: iMac
agent: 쌍아
status: 작가님 검토 대기
portfolio: PF_INFRA
subject: RunPod 워밍 조건부화(iMac 생존 시 비가동·백업 전용) + 백업 전환 시 고객 안내·팀 알림 설계
---

# DESIGN — 매팅 워밍 조건부화 + 백업 지연 안내

**[2026-10-27 16:44 KST]** iMac/쌍아 → 작가님

> 출처: 작가님 2026-10-27 16:23 "아이맥 성공시 런팟 호출을 비가동하고 백업만 할것인지" / 16:44 "워밍을 끄되 혹시 그쪽으로 늦게 넘어갈때 메세지를 설계해봐".
> 실측 근거(쌍아 세션 로그 10-27 16:24): 10-22~10-27 매팅 출력 62건 전부 `via=matte-imac`, RunPod 출력 0·실패 0. RunPod 완료 +62는 `warmupMatteEngine()`의 1×1 워밍 잡. 워밍 1회 = 워커 기동 + 유휴 대기(약 90초) 과금.

## 1. 현행 구조와 문제

| 위치 | 동작 |
|---|---|
| `portal/lib/matte.js:142-159` `warmupMatteEngine()` | 체인의 모든 엔드포인트를 예열. RunPod에는 **iMac 생사와 무관하게** `/run` 실잡 발사(60초 쿨다운, 인스턴스 단위) |
| 호출 3곳 | `server.js:378` 퍼널 진입 · `:651` precheck 통과 · `:795` 생성 시작 |
| `runMatteChain()` | iMac 프리플라이트(2.5s) → 실패 시 RunPod `/runsync`(25s 타임아웃, 1회 재시도) → 전부 실패 시 null → Gemini L3 + 텔레그램 경보 |
| 고객 화면 `public/js/specs-funnel.js` | 무료: 15초·35초 시간 기반 문구 / 유료: 3.5초 단계 회전 + 35초 문구(`genStillWorking2` "거의 다 됐어요 — 첫 생성은 조금 더 걸릴 수 있어요") |

문제: ① iMac이 전량 처리하는데 RunPod 워밍 과금이 계속 발생 ② iMac 불통 → RunPod 콜드(실측 16초, 최대 30초+) 구간에 고객은 사유 없는 대기만 본다 ③ 팀은 "전 엔드포인트 실패"일 때만 알림 — 백업 전환 자체는 무음.

## 2. 설계

### 2-1. 워밍 조건부화 (서버)

- `warmupMatteEngine()`이 **1순위 자체 서버(iMac)의 /health를 먼저 확인**한다. 살아 있으면 RunPod 워밍을 **하지 않는다**. 불통일 때만 RunPod 워밍 발사.
- 생사 결과를 **60초 캐시**(`engineState = 'primary' | 'backup'`) — 같은 요청 흐름의 precheck·generate가 같은 판정을 공유.
- 매팅 체인 순서·타임아웃·재시도는 **불변**(iMac → RunPod → Gemini L3).

### 2-2. 사전 안내 — precheck 응답에 엔진 상태 (서버 → 고객)

- precheck 응답에 `engineReady: true|false` 추가(내부 엔진명 노출 금지 — ch8). false = iMac 불통 → 이 시점에 RunPod 워밍이 이미 발사됨.
- 고객이 결제·검수하는 몇 초~수십 초 동안 **콜드스타트가 흡수**된다(사전 안내 + 사전 예열이 같은 순간).
- 고객 화면(검수 단계 하단, 1줄, 정보색 — 경고색 아님):

| 언어 | 문구 |
|---|---|
| ko | 지금은 보조 처리 서버로 진행돼요. 평소보다 20~30초 더 걸릴 수 있어요. |
| ja | 現在は予備の処理サーバーで進行します。通常より20〜30秒ほど長くかかる場合があります。 |
| en | We're using our backup processing server right now — this may take 20–30 seconds longer than usual. |
| es | Ahora usamos nuestro servidor de respaldo; puede tardar entre 20 y 30 segundos más de lo habitual. |

### 2-3. 진행 중 안내 (고객)

- `engineReady === false`로 생성에 들어간 경우만 시간 문구를 앞당긴다: **10초** "보조 서버에서 처리 중이에요 — 조금만 더 기다려 주세요" / **25초** 기존 `genStillWorking2`.
- `engineReady === true`(정상)인 경우 현행 문구 그대로 — 정상 고객에게 불필요한 경고를 보이지 않는다.
- 결제 안심 문구(유료 경로, 25초 이후 병기): "처리에 실패하면 생성권은 차감되지 않고 자동으로 돌려드려요." — **현행 환급 게이트(`refundGate`)가 실제로 그렇게 동작하는 경로에서만** 노출(되는 것만 응답, 헌법 4조 4항). 막내가 경로별 실측 후 적용 범위 확정.

### 2-4. 실패 시 (불변)

- 전 엔드포인트 실패 → 기존대로 Gemini L3 강등 또는 명시 실패 + 환급. 무음 강등 금지 원칙 유지.

### 2-5. 팀 알림 (서버 → 텔레그램)

- **백업 전환 발생 시** 1줄: `⚠️ 매팅 백업 전환 — iMac 불통, RunPod 처리 ({slug}, {소요}s)`. 10분 쿨다운(기존 `ALERT_COOLDOWN_MS` 재사용, 키 분리).
- 로그: `[Matte] BACKUP via=runpod reason={프리플라이트 불통|호출 실패} cold={s}` — 사후 집계용.
- iMac 측 터널 워처(외부 /health, 2회 연속 실패 시 tg_notify)는 그대로 — 두 알림이 같은 장애를 양쪽에서 확인.

## 3. 수용 기준 (막내 dev 검증)

1. iMac 정상: precheck·generate 1회씩 → RunPod `/run` 호출 **0** (dev 로그 + RunPod 원장 completed 불변), `engineReady:true`, 고객 문구 변화 없음.
2. iMac 차단(dev에서 1순위 URL을 불통 주소로): precheck `engineReady:false` + 안내 1줄 표시 + RunPod 워밍 1회 → generate `via=runpod` 성공 + 10초 문구 + 텔레그램 1건.
3. 4개 언어 문구 렌더 확인(ko·ja·en·es). 내부 명칭(iMac·RunPod) 고객 노출 0.
4. 기존 스모크·결제 경로 회귀 없음.

## 4. 감수하는 것

- iMac이 **생성 도중** 갑자기 죽으면 사전 워밍이 없어 콜드를 그대로 탄다(실측 16초, 25초 타임아웃 안). precheck 시점 판정이 정상이었으므로 사전 안내도 없다 → 10초 문구는 `engineReady` 무관 시간 기반 폴백 문구(현행 15·35초)가 받는다.
- 60초 캐시 동안의 판정 지연 — 장애 직후 1분 내 고객 일부는 안내 없이 백업을 탈 수 있다.

## 5. 범위·절차

- 수정 파일: `portal/lib/matte.js`, `portal/server.js`(precheck 응답·로그), `public/js/specs-funnel.js`, `lib/cms/specs-i18n.js`(4언어 키 3개). 엣지 SSG 렌더러 영향 여부 막내 확인 — specs-i18n 변경 시 **엣지 재배포 의무**(references.md §배포).
- 실행: 막내(지시서) → dev 검증 → **포털 prod 배포·엣지 재배포는 작가님 "배포 승인" 후**.
