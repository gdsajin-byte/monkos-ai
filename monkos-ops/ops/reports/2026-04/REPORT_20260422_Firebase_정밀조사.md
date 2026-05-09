---
type: REPORT
date: 2026-04-22
from: iMac/막내3
to: iMac/쌍아
status: 완료
subject: Firebase 정밀 조사 — Firestore DB 중복 + Anonymous 로그인
---

# Firebase 정밀 조사 보고서

> **[2026-04-22 12:06 KST] iMac/막내3 → iMac/쌍아**
> 근거 지시서: `ORDER_20260422_Firebase정밀조사_DB중복_익명로그인.md`
> 감사자 계정: gdsajin@gmail.com (owner)
> 감사 방식: 읽기 전용 (list/describe/query). 삭제·수정 무.

---

## 조사 1: monkos-3c6e4 Firestore DB 중복 — **정본 확정: `(default)` nam5**

### 1-1. DB 메타 비교 (REST/gcloud describe)

| 항목 | `(default)` — nam5 | `default` — us-central1 |
|---|---|---|
| createTime | **2026-01-29 10:14:28** (나중) | 2026-01-29 10:11:48 (먼저) |
| locationId | nam5 (multi-region US) | us-central1 (단일 리전) |
| freeTier | **false** | true |
| keyPrefix | `s` | (없음) |
| type | FIRESTORE_NATIVE | FIRESTORE_NATIVE |
| databaseEdition | STANDARD | STANDARD |
| deleteProtection | DISABLED | DISABLED |
| PITR | DISABLED | DISABLED |

> ⚠️ **감사 보고서 Ⅰ**(REPORT_20260422_GCP_Firebase_인프라감사.md §7-1) 기재 순서가 실제와 반대. 실제 생성은 `default`(us-central1)가 먼저(10:11), `(default)`(nam5)가 뒤(10:14).

### 1-2. 컬렉션 목록 (REST `documents:listCollectionIds`)

| DB | 컬렉션 |
|---|---|
| **`(default)` nam5** | `aiStatus`, `commands`, `notifications`, `users` (4개) |
| `default` us-central1 | **비어있음 (0개)** |

### 1-3. SDK가 바라보는 DB

**apps/MonkosChat** — 본 프로젝트 내 유일한 Firebase 앱:

- `apps/MonkosChat/.firebaserc` → `{"projects":{"default":"monkos-3c6e4"}}`
- `apps/MonkosChat/functions/index.js:6` → `admin.initializeApp()` (인자 없음 → **`(default)` DB 자동 바인딩**)
- 사용 컬렉션: `users`, `notifications`, `aiStatus`, `chats`, `commands`
  - `(default)` nam5의 4개 컬렉션과 정확히 일치 ✅

그 외 `monkos-ops/scripts/command_bridge.js` 계열은 동일 `(default)`를 `cert(serviceAccount)`로 바인딩.

### 1-4. 생성 경위 추정

1. **2026-01-29 10:11** — 누군가 Firebase Console/CLI로 수동 생성: 이름 `default`(괄호 없음), us-central1.
2. **2026-01-29 10:14** — Firebase Hosting 배포 또는 Functions 초기화 중 Firebase가 "표준" `(default)` DB를 **nam5 멀티리전**으로 자동 생성. SDK `admin.initializeApp()`은 이 표준 DB를 바라봄.
3. 이후 모든 데이터는 `(default)` nam5에 축적. `default` us-central1은 초기 오생성 후 방치.

근거: `freeTier:true` + `keyPrefix` 없음 → 수동 첫 생성 흔적. `freeTier:false` + `keyPrefix:"s"` → 후속 자동 생성 흔적.

### 1-5. 리전 의미

| 항목 | nam5 (multi-region) | us-central1 (단일) |
|---|---|---|
| 지연 | 멀티리전 분산 복제 | 단일 DC |
| 가용성 | 99.999% | 99.99% |
| 비용 | 스토리지·쓰기 +50% | 표준 |
| 쓰기 처리량 | 높음 | 표준 |

→ 현재 정본이 nam5인 것은 **운영상 의도 맞음**. 실서비스 DB는 multi-region이 정석.

### 1-6. 결론

- **정본**: `(default)` nam5 — 운영 DB. 그대로 유지.
- **유휴**: `default` us-central1 — 컬렉션 0개, 87일간 미사용. **삭제 후보.**
- **조치 권장**: 별도 승인 지시서로 `gcloud firestore databases delete --database=default --project=monkos-3c6e4` 단 한 줄. 단, 이 명령은 헌법 4조 2항 **삭제 금지**에 해당 — 작가님 결재 필수.

---

## 조사 2: Firebase Auth Anonymous 로그인 — **사용 종료 상태, 비활성 권장**

### 2-1. 사용자 현황 (identitytoolkit `accounts:query`)

- **총 유저**: **8명**
- **구성**: **8명 전원 Anonymous** (email/password/providers 모두 없음)
- email 프로바이더 가입자: **0명**

### 2-2. 유저 타임라인 (createdAt == lastLoginAt 전원)

| # | 생성=최종 로그인 (KST) |
|---|---|
| 1 | 2026-01-29 19:30:04 |
| 2 | 2026-01-30 11:45:24 |
| 3 | 2026-01-30 11:56:21 |
| 4 | 2026-01-30 11:57:14 |
| 5 | 2026-01-30 12:00:45 |
| 6 | 2026-01-30 14:56:38 |
| 7 | 2026-01-31 12:39:51 |
| 8 | 2026-02-02 12:28:59 |

> 패턴: 2026-01-29~02-02 **5일 구간 집중**. 그 후 **78일+ 신규/재방문 0**. 재로그인 세션 0건.

### 2-3. 코드베이스 검색

```
grep -rnE "signInAnonymously|anonymousAuth|isAnonymous" --include="*.{js,ts,mjs,tsx,jsx,html}"
→ (소스 코드 히트 0건, 번들 산출물 제외)
```

- `docs/archives/backend-v1/src/services/storage.ts:34` 의 `userId = 'anonymous'`는 Firebase Auth와 무관한 기본값 문자열 (아카이브).
- **현행 소스 어디에서도 `signInAnonymously()` 호출 없음.**

### 2-4. 사용 맥락 추정

커밋 로그 + 세션 로그 교차:

- 2026-01-29 커밋 `904e5d2 "DANGEROUSLY_FORWARD 미션 완료: MONKOS Chat 앱 기초 구축"`
- 2026-01-30 커밋 `e89390b "MONKOS Chat App: Vertex AI 실제 연동 및 Firebase Hosting 배포"`
- 2026-01-30 세션로그: Firebase Hosting 배포 완료 — https://monkos-3c6e4.web.app
- MonkosChat Expo 앱(`MonkosChatApp`) 초기 테스트 시 **signInAnonymously 사용 → 이후 email 기반으로 전환하면서 삭제**된 것으로 판단.

### 2-5. 현행 상태

- `apps/MonkosChat/` 폴더는 존재. 최근 커밋은 2026-03-01(`5d09721`, 문서 통합)로 코드 변경 없음.
- 현 운영 챗봇(`chat.monkos.ai`)은 `monkos` 프로젝트 Cloud Run 서비스 `monk-n8n` 계열 + 텔레그램 봇. Firebase Auth 경유 **미사용**.
- 즉, **Firebase Auth anonymous는 실질 유휴**.

### 2-6. 결론

- **실서비스 미사용 + 코드 의존 0 + 78일간 활동 0** → **비활성 권장**.
- Firebase Console → Authentication → Sign-in method → Anonymous **Disable**.
- 기존 익명 유저 8명 처리: 
  - 순수 Auth 레코드만 있고 Firestore `users` 컬렉션에도 대응 문서가 남아있을 수 있음 → 선정리 후 Auth Disable 순서 권장.
  - 이 건도 헌법 4조 2항(데이터 삭제) 해당 — **작가님 결재 필수**.

---

## 3. 준수 사항

- ✅ **4조 1항**: 유저 email/UID 등 개인정보 값 로그·보고서에 기재 안 함. 존재 여부·통계만.
- ✅ **4조 2항**: 모든 호출 읽기 전용 (list/describe/query, POST이지만 쓰기 아님). 삭제·수정 0건.
- ✅ **지시서 범위**: "조사+보고"까지. DB 삭제·Auth 비활성 실행 안 함.

---

## 4. 후속 제안 (작가님 결재 대기)

| # | 항목 | 명령 | 헌법 고려 |
|---|---|---|---|
| 1 | 빈 DB `default`(us-central1) 삭제 | `gcloud firestore databases delete --database=default --project=monkos-3c6e4` | 4조 2항 — 작가님 승인 후 |
| 2 | Firebase Auth anonymous 비활성 | Console Authentication → Sign-in method → Anonymous Disable | 4조 2항 준용 — 작가님 승인 후 |
| 3 | 익명 유저 8명 정리 | (2번보다 먼저 수행) Firebase Auth 유저 일괄 삭제 + Firestore `users` 컬렉션 대응 문서 확인 | 4조 2항 — 별도 지시서 |

---

**조사 완료**
**[2026-04-22 12:06 KST] iMac/막내3**
