---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "monk-ai-images 버킷 코드 참조 전수조사 — 쓰기 경로·스키마·맥락 분석"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — monk-ai-images 버킷 코드 참조 전수조사

> **[2026-06-12 12:31 KST]** iMac/쌍아 → iMac/막내1
> 작가님 직접 지시(②경로). GCP 전수조사 A 후속.

---

## 배경

라이브로 바이너리가 쌓이는 버킷이 `gs://monk-ai-images` **1개**뿐이다. 이 버킷에 데이터를 쓰는 코드가 몇 군데이고, 어떤 맥락에서 쓰고, 경로 스키마가 어떻게 잡히는지 전수 파악이 필요하다.

## 조사 범위

### 1. 참조 코드 전수 식별

아래 파일들이 `monk-ai-images`를 참조한다 (쌍아 선행 grep):

**서비스 코드 (라이브)**:
- `monkos_AI/idphoto-kr/gcs-save.js` + `server.js` + `deploy.sh`
- `monkos_AI/idphoto-jp/gcs-save.js` + `server.js` + `deploy.sh`
- `monkos_AI/studio/gcs-save.js` + `deploy.sh`
- `monkos_AI/portal/lib/shared/config.js` + `deploy.sh`
- `MONK_kr/ai_lab/photolab/result.js`

**스크립트/운영**:
- `monkos-ops/scripts/ads_upload.sh`
- `scripts/gcs_migrate.sh`

**아카이브/레거시**:
- `monkos-ops/tech/archive/functions_cf/api/ads.js`
- `docs/archives/scripts-legacy/sync_to_gcs.sh`
- `apps/monk_imagen4/backend/server.js` + `deploy.sh`
- `apps/idphoto-jp-v079/deploy.sh`

### 2. 각 참조별 분석 (핵심)

**라이브 서비스 코드** 각각에 대해:

| 분석 항목 | 내용 |
|----------|------|
| **읽기/쓰기 구분** | 이 코드가 버킷에서 읽기만 하는지, 쓰기(업로드)도 하는지 |
| **쓰기 경로 패턴** | 어떤 GCS 경로에 저장하는지 (예: `service/idphoto/kr/{uuid}.jpg`) |
| **트리거** | 무엇이 이 코드를 트리거하는지 (유저 요청? 배치? 수동?) |
| **데이터 성격** | 고객 촬영물? AI 생성 결과? 정적 자산? 광고 이미지? |
| **SA/인증** | 어떤 SA로 GCS에 접근하는지 |
| **공개/비공개** | 업로드 후 public URL을 반환하는지, 서명 URL인지 |

### 3. 경로 스키마 맵 작성

최종 산출물로 버킷 전체 경로 스키마를 정리:

```
gs://monk-ai-images/
├── ads/          ← 쓰기: {어떤 코드}, 트리거: {뭐}
├── assets/       ← 쓰기: {어떤 코드}
├── blog/         ← 쓰기: {어떤 코드}
├── generated/    ← 쓰기: {어떤 코드}, 경로패턴: {뭐}
├── raw_data/     ← 쓰기: {어떤 코드}
├── service/      ← 쓰기: {어떤 코드}, 경로패턴: {뭐}
│   └── idphoto/
│       ├── jp/
│       └── kr/
└── profiles/     ← 쓰기: {어떤 코드}
```

### 4. 레거시/데드 코드 판별

아카이브·레거시 참조가 실제 라이브에서 호출 가능한지 판별:
- `apps/monk_imagen4/` — 프로토타입? 라이브?
- `MONK_kr/ai_lab/photolab/` — CF Pages에서 서빙 중?
- `monkos-ops/tech/archive/` — archive 폴더이니 데드일 가능성 높지만 확인

### 5. 버킷 분리 설계 기초자료

막내2 보고서에서 "public(ads/assets/blog) + private(raw_data/service/generated) 분리" 권고가 나왔다. 이 조사 결과를 기반으로:
- public 유지 필요 경로 (CDN으로 외부 노출 필요)
- private 전환 가능 경로 (서명 URL 전환 가능)
- 서비스별 영향도

를 판정해달라.

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_SECURITY_GCS버킷코드참조전수.md` | 본 조사 보고서 |

## ⚠️ 준수 조항

- **헌법 4조 2항**: **읽기 전용**. 코드 수정·버킷 변경 금지.
- **헌법 4조 1항**: 키·시크릿 값 금지. SA 이름·역할만.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀` + 수발신 헤더.

## 커밋 메시지

```
[research] monk-ai-images 버킷 코드 참조 전수조사 — 쓰기 경로·스키마·맥락 분석
```
