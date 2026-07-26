---
type: order
date: 2026-07-26
device: iMac
agent: 쌍아
receiver: 막내3
portfolio: PF_INFRA
status: 발행
---

# 유휴 인스턴스 처분 — v4-preview 태그 회수 + idphoto-jp minScale 0

**[2026-07-26 14:54 KST]** iMac/쌍아 → iMac/막내3

> 작가님 직접 지시(14:54): *"일단 프리뷰 jp부터 꺼보자 하드코딩과 디플로이 동시 차단"*
> **범위 한정: v4-preview + idphoto-jp 2건.** `idphoto-kr`는 **본 지시서 범위 밖**(JP 실측 회신 후 별건 판정).

---

## §1 배경 — 실측 근거

### 1-1. 전체 상시 웜 인스턴스 = 5개 (14개 서비스 / 4개 리전 전수 조사)

| 리비전 | 리전 | 규격 | 판정 |
|---|---|---|---|
| `monkos-portal-00539-bmt` | us-central1 | 1CPU/1Gi | 유지 (specs 랜딩 본진) |
| `monkos-crop-engine-00025-4bw` | asia-northeast3 | 1CPU/1Gi | 유지 (유료 3트랙 공통 의존, ONNX 3종 로드) |
| `monkos-idphoto-kr-00203-jwn` | us-central1 | 2CPU/2Gi | **범위 밖** |
| **`monkos-idphoto-jp-00126-smk`** | us-central1 | 2CPU/2Gi | **본 지시서 Task 2** |
| **`monkos-portal-00377-feh`** (`v4-preview`) | us-central1 | 1CPU/512Mi | **본 지시서 Task 1** |

### 1-2. v4-preview — 계측 증거

- `deploy.sh` `preview` 분기는 **2026-03-13 `d0f4a001` 블루/그린 배포용으로 신설된 정상 기능**. 폐지 대상 아님.
- 리비전 `00377-feh` **2026-06-25 생성** 후 태그 라우팅이 살아 있어 `minScale=1`을 계속 이행.
- **Monitoring 실측(24h 연속): `state=active` 0 · `state=idle` 1.** → **31일간 요청 0건을 처리하며 인스턴스 1대 상시 점유.** 추정 아닌 계측 확정.
- 원인: `deploy.sh:133` `MIN_INSTANCES="1"  # prod 서비스 대상이므로 prod와 동일 유지` — **`--no-traffic` 리비전에는 성립하지 않는 전제.**

### 1-3. idphoto-jp

- 28일 노출 2 · 클릭 0. 실트래픽은 크롤러(robots/sitemap)·스캐너뿐 (민아 07-26 실측).
- **백엔드 런타임 의존 없음 확인 완료** (민아 07-25).
- `deploy.sh:70` `MIN_INSTANCES="1"  # ... (변경 금지)` — 이 주석은 `2ee054ff`(07-04) **dev 유휴과금 정리 시 쌍아가 붙인 국소 가드레일**이며, **콜드스타트 인시던트 기록은 `incidents/` 전체에 0건**. 측정 근거 없음. **작가님 승인으로 해제.**
- 선례: `monk-image-engine`·`monkos-studio`는 **prod인데 이미 `minScale` 미설정(=0)**. prod=웜은 우리 관행이 아니다.

---

## §2 Task 1 — v4-preview 처분

### 2-1. 정본 수정 (하드코딩 차단)

`monkos_AI/portal/deploy.sh:133`

```
- MIN_INSTANCES="1"  # prod 서비스 대상이므로 prod와 동일 유지
+ MIN_INSTANCES="0"  # --no-traffic 태그 리비전 = 트래픽 0 → 웜 불요 (2026-07-26 유휴 1대 31일 점유 실측)
```

### 2-2. 라이브 태그 회수 (현행 누수 차단)

```bash
gcloud run services update-traffic monkos-portal \
  --region us-central1 \
  --remove-tags v4-preview
```

> ⚠️ **선행 확인 필수**: 실행 전 `--remove-tags` 대상이 `00377-feh`인지, **트래픽 100%가 `00539-bmt`에 있는지** 재확인할 것. 트래픽 배분이 바뀌면 **중단하고 보고**.

---

## §3 Task 2 — idphoto-jp minScale 0

### 3-1. 정본 수정 (하드코딩 차단)

`monkos_AI/idphoto-jp/deploy.sh:70`

```
- MIN_INSTANCES="1"  # prod 상시 대기 = 콜드스타트 이탈 방지 (변경 금지)
+ MIN_INSTANCES="0"  # 노출 2·클릭 0·백엔드 의존 없음 실측 → 웜 불요 (2026-07-26 작가님 승인, 07-04 "변경 금지" 해제)
```

### 3-2. 라이브 반영 (디플로이 차단)

```bash
gcloud run services update monkos-idphoto-jp \
  --region us-central1 \
  --min-instances 0
```

> ⚠️ **[법률 5장 2조 예외 — 작가님 14:54 직접 지시]**
> `deploy.sh prod` 경유가 원칙이나, JP 최종 배포는 **07-22**이며 재빌드 시 minScale 외 변경분이 동반 유입된다. **스케일 설정만 변경하고 이미지를 건드리지 않기 위해** `services update`를 사용한다. 세션 로그·COMPLETION에 **`[예외]` 명시 기록 필수** (헌법 5조 4항).

---

## §4 검증 (전건 실측 · 추정 보고 금지)

| # | 항목 | 방법 | 합격 기준 |
|---|---|---|---|
| 1 | v4-preview 태그 소멸 | `gcloud run services describe monkos-portal --region us-central1 --format="value(status.traffic)"` | `v4-preview` 항목 **부재**, `00539-bmt` 100% 유지 |
| 2 | 포털 정상 | `curl -s -o /dev/null -w "%{http_code} %{time_total}" https://monkos.ai/` | **200** |
| 3 | JP minScale 반영 | `gcloud run services describe monkos-idphoto-jp --region us-central1 --format=json` → `minScale` 파싱 | `(none)` 또는 `0` |
| 4 | **JP prod 콜드스타트 실측** ⭐ | 10분 이상 무요청 대기 후 `curl -w "%{time_total}"` **3회** (각 회차 사이 10분+) | **수치 3건 기록** (합격/불합격 아님 — KR 판정 재료) |
| 5 | JP 정상 | `curl -s -o /dev/null -w "%{http_code}" https://idphoto-jp.monkos.ai/` | **200** |
| 6 | 유휴 인스턴스 감소 | Monitoring API `run.googleapis.com/container/instance_count`, **`state`·`revision_name`으로 그룹 분해** | portal `00377` 계열 소멸, JP idle 0 |

> ⚠️ **6번 주의**: 지표를 단일 수치로 읽지 말 것. `aggregation.groupByFields`로 **state(active/idle) × revision_name 축을 분해**한 뒤 판독한다. 축 미분해로 인한 오독이 07-26 쌍아 보고에서 실제 발생했다.
>
> 조회 경로: `gcloud monitoring time-series` **미지원**. `gcloud auth print-access-token` + Monitoring API v3 `timeSeries` 직접 호출.

---

## §5 ⚠️ 준수 조항

1. **범위 엄수** — `idphoto-kr`·`portal` prod·`crop-engine`의 `MIN_INSTANCES`는 **손대지 않는다.** 범위 확대 필요 시 **보고 후 대기**.
2. **`deploy.sh prod` 실행 금지** — 본 지시서는 **스케일 설정만** 변경한다. 재빌드·재배포 불요.
3. **비밀정보 무접촉** — 두 파일 모두 시크릿 라인을 포함한다. `MIN_INSTANCES` 행 **외 수정 금지**.
4. **파괴적 명령 금지** (헌법 4조 2항).
5. **[예외] 기록** — §3-2 5장 2조 예외를 세션 로그 + COMPLETION 양쪽에 명시.
6. **실측 보고** — 검증 6건 전부 **실행 결과 원문**을 COMPLETION에 첨부. "정상 확인" 같은 요약 단독 기재는 미완료로 간주.
7. **완료 보고** — `monkos-ops/ops/reports/2026-07/COMPLETION_20260726_iMac막내3_INFRA_유휴인스턴스처분.md` 생성. 세션 로그 어펜드 + **PF_INFRA 히스토리 1행 어펜드** + 커밋·푸시.

---

## §6 회신 요망 (KR 판정 재료)

검증 4번 **JP prod 콜드스타트 3회 실측값**을 COMPLETION 상단에 별도 명기할 것. 민아 기존 실측(2.25초)은 **kr-dev(512Mi/1CPU)** 값이며, **prod(2Gi/2CPU) 실측이 아니다.** 이 수치로 `idphoto-kr` 처분 여부를 별건 판정한다.

---

## §7 JP 회생 조건 — 되돌림 트리거 (필수 기재)

> **끄는 조건만 있고 켜는 조건이 없으면 그것은 처분이 아니라 방치다.** v4-preview가 31일 방치된 원인도 "언제 걷을지"를 아무도 안 정했기 때문이다. 동일 실패를 반복하지 않기 위해 트리거를 **지금** 확정한다.

### 7-1. JP의 위상 (끄되 버리는 것이 아님)

- `idphoto-jp`는 **ja 언어 specs의 유일한 전환 엔드포인트**다 (`portal/lib/cms/specs-i18n.js:325` `ctaHref` · `:356` `upsellHref`). 죽은 서비스가 아니다.
- JP 검색 신호는 형성 중 — `在留カード写真サイズ` Bing 3위 (07-26 브리핑).
- ∴ **minScale 0 = 폐기가 아니라 「수요 확인 전까지 유휴비 미지출」.**

### 7-2. 복귀 트리거 (둘 중 **하나** 충족 시)

| # | 조건 | 관측 근거 | 오염 내성 |
|---|---|---|---|
| **A** | **JP 결제 1건 발생** | Firestore 결제 기록 | 이진값 — GA4 테스트 트래픽 오염 무관 |
| **B** | **JP 실유입 주간 두 자릿수** (크롤러·스캐너 제외) | Cloud Run 요청 로그 UA 필터 | 봇 제외 명시 |

- ⛔ **GA4 세션 수 단독 사용 금지** — 내부 테스트 트래픽 오염 미해소 상태(`traffic_type` 플래그 미기안).

### 7-3. 복귀 형태는 **자동으로 minScale=1이 아니다**

트리거 충족 시 **검증 4번 콜드스타트 실측값을 근거로 재판정**한다.

| 콜드스타트 실측 | 복귀 판정 |
|---|---|
| ~3초 이하 | **웜 복귀 불요.** 유입이 붙어도 콜드 유지가 이득 |
| 3~10초 | 유입 볼륨 대비 재계산 후 결정 |
| 10초 초과 | 웜 복귀 검토 (마감선 115초 잠식 우려) |

### 7-4. 관측 주체 — **사람이 기억하는 트리거는 트리거가 아니다**

- **주체: 웹/민아 데일리 E2E 루틴.** 이미 5개 서비스 라이브 프로브를 매일 수행 중이므로 관측면이 존재한다.
- 막내3 조치 사항: **PF_INFRA에 §7-2 트리거 · §7-3 판정표 · 관측 주체를 명시 기재**할 것. 본 지시서에만 남기면 지시서가 아카이브되는 순간 소실된다.
- E2E 루틴 체크 항목 추가 배선은 **별건**(본 지시서 범위 밖). 쌍아가 기안한다.

### 7-5. 부수 확인 — `/health-check` 오탐 방지

`.claude/commands/health-check.md`가 `idphoto-jp/health`를 프로브한다. **minScale 0 이후 첫 호출은 콜드스타트만큼 느려진다.** 판정 기준이 `200 = 정상`이므로 코드상 오판은 없으나, **응답 지연을 장애로 오독할 소지**가 있다. COMPLETION에 *"JP는 콜드 운용 — 최초 프로브 지연은 정상"* 1행을 명시하고, 스킬 문구 보강 필요 여부를 의견으로 회신할 것.
