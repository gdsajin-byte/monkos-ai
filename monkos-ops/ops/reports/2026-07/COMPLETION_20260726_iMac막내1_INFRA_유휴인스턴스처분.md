---
type: completion
date: 2026-07-26
device: iMac
agent: 막내1
portfolio: PF_INFRA
order: ORDER_20260726_iMac쌍아_막내3_INFRA_유휴인스턴스_처분.md
status: 마감
---

# COMPLETION — 유휴 인스턴스 처분 (v4-preview 태그 회수 + idphoto-jp minScale 0)

**[2026-07-26 16:30 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260726_iMac쌍아_막내3_INFRA_유휴인스턴스_처분.md](../../orders/2026-07/ORDER_20260726_iMac쌍아_막내3_INFRA_유휴인스턴스_처분.md)
> ⚠️ 지시서 `receiver: 막내3`이나 작가님이 iMac/막내1 세션에 직접 토스. 오늘 막내3 세션 로그 부재 → 동시 실행 충돌 없음 확인 후 막내1 수행. 산출물은 실제 수행 주체 명의로 기록.

---

## §0 회신 — KR 판정 재료 (지시서 §6)

### JP prod 콜드스타트 3회 실측 ⭐

| 회차 | 시각 | **콜드** (인스턴스 0 실측 확인 후) | 직후 웜 |
|---|---|---|---|
| 1 | 15:51:01 | **200 / 3.105970s** (connect 0.045544 / ttfb 3.043693) | 200 / 0.418309s |
| 2 | 16:09:15 | **200 / 2.116525s** (connect 0.077827 / ttfb 2.057235) | 200 / 0.428455s |
| 3 | 16:27:25 | **200 / 1.744716s** (connect 0.044344 / ttfb 1.691231) | 200 / 0.425242s |

- **평균 2.32초 / 범위 1.744~3.106초**, 전건 200. 웜은 3회 모두 0.42초대로 일정. 콜드/웜 비 약 5.5배.
- 대상: `monkos-idphoto-jp-00127-n9z` (2CPU/2Gi, us-central1)

### 부수 실측 — 유휴 인스턴스 반납 시간

조건 폴링이 함께 재어준 값. 3회전 모두 동일 패턴:

| 회차 | 마지막 요청 | 인스턴스 1 유지 확인 | 0 검출 |
|---|---|---|---|
| 1 | 15:31:39 | +15분(15:47)까지 1.0 | +18분(15:50) |
| 2 | 15:51:04 | +15분(16:05)까지 1.0 | +18분(16:08) |
| 3 | 16:09:18 | +15분(16:23)까지 1.0 | +18분(16:26) |

→ Monitoring 수집 지연 2~3분을 감안하면 **실제 반납은 마지막 요청 후 약 15분**.

### ⚠️ 판정 시 유의 — 스펙 차이가 콜드스타트를 설명하지 못한다

민아 기존 실측 **2.25초는 kr-dev(512Mi/1CPU)**, 이번은 **JP prod(2Gi/2CPU) 평균 2.32초**. **거의 동일하다.**
→ 이 서비스의 콜드스타트는 CPU/메모리 스펙에 눌리지 않는다. **"KR prod는 2Gi/2CPU라 콜드가 짧을 것"이라는 추론은 본 데이터로 지지되지 않는다.** KR 판정은 스펙이 아니라 **2초대 콜드를 감수할 트래픽인가**로 놓아야 한다. KR은 JP와 달리 실유입이 있으므로 판단 재료가 다르며, **본 지시서 범위 밖이므로 막내1은 판정하지 않는다.**

---

## §1 수행 결과

### Task 1 — v4-preview 처분 ✅

**선행 확인 게이트(지시서 §2-2)** — 실행 전 실측, 지시서 전제와 일치 확인:
```
spec.traffic  : [{"latestRevision": true, "percent": 100},
                 {"revisionName": "monkos-portal-00377-feh", "tag": "v4-preview"}]
status.traffic: [{"revisionName": "monkos-portal-00377-feh", "tag": "v4-preview", "url": "https://v4-preview---monkos-portal-4jeplpqpua-uc.a.run.app"},
                 {"latestRevision": true, "percent": 100, "revisionName": "monkos-portal-00539-bmt"}]
latestReady   : monkos-portal-00539-bmt
```
→ 태그 = `00377-feh`, 트래픽 100% = `00539-bmt`. 배분 변동 없음 → 실행 진행.

**1-1 정본 수정** — `monkos_AI/portal/deploy.sh:133` (preview 분기 한정)
```diff
-  MIN_INSTANCES="1"  # prod 서비스 대상이므로 prod와 동일 유지
+  MIN_INSTANCES="0"  # --no-traffic 태그 리비전 = 트래픽 0 → 웜 불요 (2026-07-26 유휴 1대 31일 점유 실측)
```

**1-2 라이브 태그 회수**
```
$ gcloud run services update-traffic monkos-portal --region us-central1 --remove-tags v4-preview
Updating traffic...
Routing traffic...................done
Done.
URL: https://monkos-portal-4jeplpqpua-uc.a.run.app
Traffic:
  100% LATEST (currently monkos-portal-00539-bmt)
```

### Task 2 — idphoto-jp minScale 0 ✅

**사전 실측**: `minScale=1`, `maxScale=10`, latestReady `monkos-idphoto-jp-00126-smk`

**2-1 정본 수정** — `monkos_AI/idphoto-jp/deploy.sh:70`
```diff
-  MIN_INSTANCES="1"  # prod 상시 대기 = 콜드스타트 이탈 방지 (변경 금지)
+  MIN_INSTANCES="0"  # 노출 2·클릭 0·백엔드 의존 없음 실측 → 웜 불요 (2026-07-26 작가님 승인, 07-04 "변경 금지" 해제)
```

**2-2 라이브 반영**
```
$ gcloud run services update monkos-idphoto-jp --region us-central1 --min-instances 0
Deploying...
Creating Revision.......................................................................done
Routing traffic.....done
Done.
Service [monkos-idphoto-jp] revision [monkos-idphoto-jp-00127-n9z] has been deployed and is serving 100 percent of traffic.
Service URL: https://monkos-idphoto-jp-933456016842.us-central1.run.app
```

---

## §2 🔴 [예외] 기록 — 법률 5장 2조 (deploy.sh 경유)

- **예외 사유**: 작가님 2026-07-26 14:54 직접 지시. JP 최종 배포는 07-22이며 `deploy.sh prod` 재빌드 시 minScale 외 변경분이 동반 유입된다. **스케일 설정만 변경하고 이미지를 건드리지 않기 위해** `gcloud run services update` 사용.
- **이미지 무변경 실증** — 예외의 전제가 실제로 지켜졌음을 리비전 대사로 확인:

| 항목 | 00126-smk (이전) | 00127-n9z (신규) |
|---|---|---|
| imageDigest | `sha256:204560c07e66094575916cc86144b5ddd73a770df0b0981d7f8ee25668230992` | **동일** |
| cpu/memory | `{'cpu': '2', 'memory': '2Gi'}` | **동일** |
| minScale | `1` | **`(none)`** ← 유일한 변경분 |
| created | 2026-07-22T05:12:26Z | 2026-07-26T05:57:38Z |

→ 재빌드 0. 변경분은 `minScale` 단 하나. 예외의 목적이 실제로 달성됨.

---

## §3 검증 결과 (지시서 §4 — 전건 실행 원문)

| # | 항목 | 판정 |
|---|---|---|
| 1 | v4-preview 태그 소멸 | ✅ |
| 2 | 포털 정상 | ✅ |
| 3 | JP minScale 반영 | ✅ |
| 4 | JP prod 콜드스타트 3회 | ✅ (§0, 재측정으로 확보) |
| 5 | JP 정상 | ✅ |
| 6 | 유휴 인스턴스 감소 | ✅ |

### 검증 1 — v4-preview 태그 소멸 ✅
```
$ gcloud run services describe monkos-portal --region us-central1 --format="value(status.traffic)"
{'latestRevision': True, 'percent': 100, 'revisionName': 'monkos-portal-00539-bmt'}

spec.traffic  : [{"latestRevision": true, "percent": 100}]
status.traffic: [{"latestRevision": true, "percent": 100, "revisionName": "monkos-portal-00539-bmt"}]
```
→ `v4-preview` 항목 **spec·status 양쪽에서 부재**. `00539-bmt` 100% 유지.

### 검증 2 — 포털 정상 ✅
```
$ curl -s -o /dev/null -w "%{http_code} %{time_total}" https://monkos.ai/
200 0.888528
```

### 검증 3 — JP minScale 반영 ✅
```
minScale = (none)
maxScale = 10
latestReady = monkos-idphoto-jp-00127-n9z
image = gcr.io/monkos/monkos-idphoto-jp
```

### 검증 5 — JP 정상 ✅
```
$ curl -s -o /dev/null -w "%{http_code}" https://idphoto-jp.monkos.ai/
200 0.512640
```

### 검증 6 — 유휴 인스턴스 감소 ✅

조회 경로: `gcloud auth print-access-token` + Monitoring API v3 `timeSeries` 직접 호출
(`gcloud monitoring time-series` 미지원 확인). 스크립트: 스크래치패드 `instance_count.py`.
**축 분해**: `aggregation.groupByFields = metric.label.state` + `resource.label.revision_name` (지시서 §4 6번 주의 준수 — 단일 수치 판독 금지).

**(a) portal `00377-feh` 소멸 — 처분 전후 대비**

처분 전(3h 창, 5분 정렬 ALIGN_MEAN / REDUCE_MAX):
```
- revision=monkos-portal-00377-feh  state=active
  포인트 36개 | max=0.00 min=0.00 최신값=0.00
- revision=monkos-portal-00377-feh  state=idle
  포인트 36개 | max=1.00 min=0.75 최신값=0.75
  최근→과거 12점: [0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
```
→ 지시서 §1-2의 "요청 0건 처리하며 1대 상시 점유" 재확인(active 0 / idle 1 상시).

처분 후(1.5h 창):
```
- revision=monkos-portal-00377-feh  state=idle
  최근→과거 12점: [0.0, 0.8, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
  최신값=0.00 (2026-07-26T06:03:00Z)   ← 시계열이 06:03Z(15:03 KST)에서 종료
- revision=monkos-portal-00539-bmt  state=active
  최신값=0.50 (2026-07-26T06:33:00Z)   ← 같은 창에서 계속 보고 중
```
→ idle 1.0 → 0.8 → 0.0 드레인 후 **15:03 KST부로 `00377` 계열 시계열 자체 종료 = 인스턴스 소멸 확정.**
→ 대조군 `00539-bmt`는 동일 창에서 계속 보고(active 0.2~1.0 변동) → 조회 자체의 문제가 아님을 교차 확인.
→ ⚠️ 이 관측은 **프로브 경로 밖**이다. 검증 2의 curl은 트래픽 100%인 `00539-bmt`로 가며 태그 회수된 `00377-feh`로는 어떤 요청도 가지 않는다. 따라서 오염 없음.

**(b) JP `00127-n9z` — minScale 0 실효 확인**

60초 정렬 ALIGN_MAX 판독. 처분 시각(14:59) 전후:
```
--- revision=monkos-idphoto-jp-00126-smk state=idle ---
  14:33=1 ... 14:58=1  14:59=0  15:00=0 ...      ← 구 리비전 소멸
--- revision=monkos-idphoto-jp-00127-n9z state=idle ---
  15:00=1 ... 15:31=1                             ← 신규 리비전 (프로브가 붙들고 있던 구간)
```
콜드스타트 재측정 중 **인스턴스 총계(active+idle) 0을 3회 실측**:
```
[15:51:01] 최신 3점 합계=[0.0, 0.0, 0.0] (최신 15:50)
[16:09:15] 최신 3점 합계=[0.0, 0.0, 1.0] (최신 16:08)
[16:27:25] 최신 3점 합계=[0.0, 0.0, 1.0] (최신 16:26)
```
→ **minScale=1이면 인스턴스가 0으로 내려갈 수 없다.** 0 도달 3회 실측이 minScale 0 실효의 직접 증거.

**(c) 정상상태 최종 판독** — 마지막 프로브(16:27:34) 이후 25분 무요청 확보 후 재조회:

```
=== 최종 판독 2026-07-26 16:52 KST — 마지막 프로브(16:27:34) 이후 25분 무요청 ===
### monkos-idphoto-jp — 창: 06:52:56Z ~ 07:52:56Z (= 15:52 ~ 16:52 KST), 5분 정렬
- revision=monkos-idphoto-jp-00127-n9z  state=active
  최신값=0.00 | 최근→과거 12점: [0.0, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0, 0.2, 0.0, 0.0, 0.0]
- revision=monkos-idphoto-jp-00127-n9z  state=idle
  최신값=0.00 | 최근→과거 12점: [0.0, 0.2, 1.0, 1.0, 0.8, 0.4, 1.0, 1.0, 0.4, 0.8, 1.0, 1.0]

### monkos-portal — 창: 06:52:57Z ~ 07:52:57Z, 5분 정렬
- revision=monkos-portal-00539-bmt  state=active  최신값=0.60 (0.2~0.8 변동)
- revision=monkos-portal-00539-bmt  state=idle    최신값=0.40 (0.2~0.8 변동)
  ※ 이 창에 `monkos-portal-00377-feh` 시계열 **자체가 존재하지 않음**
```
→ **JP `00127-n9z`: active 0.00 / idle 0.00 — 인스턴스 0 정상상태 확정.**
  창 중반의 idle 1.0 구간과 active 0.2 스파이크 2개는 콜드스타트 재측정 프로브 구간이며, 프로브 종료 후 idle 1.0 → 0.2 → 0.0으로 반납 완료.
→ **portal: `00377-feh` 시계열 부재 = 소멸 확정.** 같은 창에서 `00539-bmt`만 정상 보고 중.
→ 지시서 §4 6번 합격 기준(**portal `00377` 계열 소멸 · JP idle 0**) **양건 충족.**

---

## §4 🔴 실패 기록 — 콜드스타트 1차 측정 폐기

**작가님 지적(15:0x)**: *"측정 행위가 측정 대상을 건드리는 걸 분리 안 한 것"* — 이 지적이 1차 측정 자체에도 그대로 적용되었다.

**1차 측정(폐기)** — 지시서 §4가 정한 "10분 이상 무요청 대기 후 3회, 각 회차 10분+"를 그대로 이행:

| 회차 | 시각 | "콜드" | 직후 웜 |
|---|---|---|---|
| 1 | 15:09:28 | 200 / 0.478211s | 200 / 0.418614s |
| 2 | 15:20:32 | 200 / 0.430422s | 200 / 0.417994s |
| 3 | 15:31:36 | 200 / 0.475556s | 200 / 0.413070s |

**폐기 사유** — 콜드-웜 차이가 0.06초. 지표로 반증 완료:
```
--- revision=monkos-idphoto-jp-00127-n9z state=idle ---
  15:00=1 ... 15:31=1   ← 전 구간 1. 단 한 번도 0으로 내려가지 않음
--- revision=monkos-idphoto-jp-00127-n9z state=active ---
  15:11=1  15:22=1  15:30=1   ← active 스파이크 3개 = 내 프로브 3회, 그 외 트래픽 0
```
→ 인스턴스가 살아있는 상태에서 친 값 = **전부 웜 히트.** 콜드스타트가 아니다.

**원인**: 11분 고정 대기가 이 서비스의 유휴 반납 시간(실측 약 15분)보다 짧았고, **매 프로브가 그 타이머를 리셋했다.** 인스턴스가 0으로 내려가기를 기다린 것이 아니라, 0으로 내려가지 못하게 11분마다 깨우고 있었다. 지시서 §4의 "10분 이상"이라는 전제가 이 서비스에서 성립하지 않았다.

**교정**: 시간을 가정하지 않고 **조건을 실측**하는 방식으로 전환. Monitoring API로 `instance_count(active+idle)`를 3분 폴링 → **2점 연속 0 확인 후에만 프로브**. 폴링은 Monitoring만 조회하므로 서비스를 깨우지 않는다(측정기와 측정 대상 분리). 스크립트: 스크래치패드 `jp_coldstart_v2.py`.

**교훈**: *0.43초를 "JP prod 콜드스타트"로 보고했다면 KR 판정이 통째로 틀린 재료 위에 섰다.* 수치가 나왔다는 것과 그 수치가 재려던 것을 쟀다는 것은 다르다. 대기 시간을 상수로 박은 검증 절차는 대상의 반납 시간이 바뀌면 조용히 무효가 된다 — **검증 조건은 시간이 아니라 상태로 표현해야 한다.**

---

## §5 준수 조항 이행 (지시서 §5)

| # | 조항 | 이행 |
|---|---|---|
| 1 | 범위 엄수 | ✅ `idphoto-kr/deploy.sh:71`·`portal/deploy.sh:98`(prod)·`crop-engine` **무수정** — 아래 전수 확인 |
| 2 | `deploy.sh prod` 실행 금지 | ✅ 미실행. 재빌드 0(§2 imageDigest 동일 실증) |
| 3 | 비밀정보 무접촉 | ✅ `MIN_INSTANCES` 행 외 무수정. git diff 2파일 각 1행(±1) |
| 4 | 파괴적 명령 금지 | ✅ 해당 없음 |
| 5 | [예외] 기록 | ✅ §2 + 세션 로그 양쪽 명시 |
| 6 | 실측 보고 | ✅ 검증 6건 실행 원문 §3 첨부. 폐기된 1차 측정도 §4에 원문 보존 |
| 7 | 완료 보고 | ✅ 본 파일 + 세션 로그 + PF_INFRA 히스토리 + 커밋·푸시 |

**범위 엄수 전수 확인**:
```
$ grep -rn "MIN_INSTANCES=" monkos_AI/*/deploy.sh
portal/deploy.sh:88      MIN_INSTANCES="0"  # dev는 콜드스타트 허용 (유휴 과금 방지)
portal/deploy.sh:98      MIN_INSTANCES="1"  # prod 상시 대기 = 콜드스타트 이탈 방지 (변경 금지)   ← 무수정
portal/deploy.sh:133     MIN_INSTANCES="0"  # ← 본 지시서 Task 1
idphoto-jp/deploy.sh:64  MIN_INSTANCES="0"  # dev
idphoto-jp/deploy.sh:70  MIN_INSTANCES="0"  # ← 본 지시서 Task 2
idphoto-kr/deploy.sh:64  MIN_INSTANCES="0"  # dev
idphoto-kr/deploy.sh:71  MIN_INSTANCES="1"  # prod 상시 대기 ... (변경 금지)                    ← 무수정 (범위 밖)
```

---

## §6 변경 파일 / 리비전

| 파일 | 변경 |
|---|---|
| `monkos_AI/portal/deploy.sh` | 133행 `MIN_INSTANCES` 1→0 (preview 분기) |
| `monkos_AI/idphoto-jp/deploy.sh` | 70행 `MIN_INSTANCES` 1→0 (prod 분기) |

| 서비스 | 리비전 | 비고 |
|---|---|---|
| `monkos-portal` | `00539-bmt` 100% (불변) | `v4-preview` 태그 회수, `00377-feh` 소멸 |
| `monkos-idphoto-jp` | `00126-smk` → **`00127-n9z`** 100% | 이미지 동일, minScale만 변경 |

**롤백**
```bash
# Task 1 되돌리기
gcloud run services update-traffic monkos-portal --region us-central1 \
  --set-tags v4-preview=monkos-portal-00377-feh
# Task 2 되돌리기
gcloud run services update monkos-idphoto-jp --region us-central1 --min-instances 1
```

---

## §7 잔여 / 후속

- ⏳ **`idphoto-kr` 처분 판정** — 본 지시서 범위 밖. §0 콜드스타트 실측값이 판정 재료. 쌍아·작가님 판단 대기.
- 💡 **지시서 검증 절차의 일반 교훈** — "N분 대기 후 측정" 형태의 검증 조항은 대상의 상태 변화 시간이 바뀌면 조용히 무효가 된다. 향후 유사 검증은 **상태 조건(`instance_count=0` 등)으로 기술**할 것을 제안한다(§4).
