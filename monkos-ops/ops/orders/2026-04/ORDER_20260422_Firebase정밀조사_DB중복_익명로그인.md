---
type: ORDER
date: 2026-04-22
from: iMac/쌍아
to: iMac/막내3
status: 완료
---

# [지시서] Firebase 정밀 조사 — Firestore DB 중복 + Anonymous 로그인

> **[2026-04-22 11:45 KST] iMac/쌍아 → iMac/막내3**
> 배경: 인프라 감사(REPORT_20260422_GCP_Firebase_인프라감사.md)에서 발견된 2건의 정밀 조사
> 작가님 지시: "내가 모르는 내용 정밀파악후 처리요망" / "어떤시점 어떤맥락인지 파악후 처리"

---

## 조사 1: monkos-3c6e4 Firestore DB 중복

### 현황
- 프로젝트 `monkos-3c6e4`에 DB가 2개 존재
  - `(default)` — nam5 (multi-region) — 2026-01-29 10:11 생성
  - `default` — us-central1 — 2026-01-29 10:14 생성
- 3분 간격으로 생성됨. 하나가 오생성일 가능성

### 조사 항목
1. **각 DB의 컬렉션 목록 비교** — 어느 쪽이 실데이터인지
```bash
# REST API로 컬렉션 목록 조회
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://firestore.googleapis.com/v1/projects/monkos-3c6e4/databases/(default)/documents:listCollectionIds" \
  -X POST -H "Content-Type: application/json" -d '{}'

curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://firestore.googleapis.com/v1/projects/monkos-3c6e4/databases/default/documents:listCollectionIds" \
  -X POST -H "Content-Type: application/json" -d '{}'
```

2. **각 DB의 문서 수 추정** — 각 컬렉션의 최상위 문서 수
3. **Firebase SDK가 어느 DB를 바라보는지** — 코드베이스에서 `firebase` 초기화 코드 검색
```bash
grep -r "firestore\|initializeApp\|getFirestore" --include="*.js" --include="*.ts" --include="*.mjs" \
  /Users/jeong-kyushin/developer/monk_project/ | grep -v node_modules | grep -v .git
```

4. **Firebase Console 자동 생성 여부** — `(default)`는 Firebase가 자동 생성하는 표준명. `default`(괄호 없음)는 수동 생성 추정.

5. **리전 차이 의미** — nam5(multi-region US) vs us-central1(단일 리전). 비용·지연 영향.

### 산출물
- 조사 결과를 보고서 하단에 어펜드:
  `monkos-ops/ops/reports/REPORT_20260422_GCP_Firebase_인프라감사.md`
- 또는 별도 파일: `monkos-ops/ops/reports/REPORT_20260422_Firebase_정밀조사.md`

---

## 조사 2: Firebase Auth Anonymous 로그인

### 현황
- `monkos-3c6e4` 프로젝트에서 anonymous 로그인이 활성 상태
- 활성 프로바이더: email + anonymous
- MFA 비활성

### 조사 항목
1. **코드베이스에서 anonymous auth 사용 검색**
```bash
grep -r "signInAnonymously\|auth().signIn\|anonymous" --include="*.js" --include="*.ts" --include="*.mjs" \
  /Users/jeong-kyushin/developer/monk_project/ | grep -v node_modules | grep -v .git
```

2. **Firebase Auth 사용자 수 확인** (가능하면)
```bash
# REST API로 유저 목록 (최대 1000)
curl -s -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://identitytoolkit.googleapis.com/v1/projects/monkos-3c6e4/accounts:batchGet?maxResults=10" \
  -X POST -H "Content-Type: application/json" -d '{}'
```
- anonymous 유저가 있는지, 몇 명인지
- 마지막 로그인 시점

3. **어떤 서비스에서 사용하는지** — monkos-3c6e4.web.app / monkos.ai / 기타
4. **git log에서 anonymous 설정 시점 추적** (가능하면)

### 판단 기준
- anonymous 유저가 0명이고 코드에서 미사용 → **비활성 권장**
- 실사용 중 → 용도 기록 + 유지

---

## 준수 조항

⚠️ **헌법 4조 1항**: 사용자 개인정보(이메일, UID 등) 노출 최소화. 통계 수준만.
⚠️ **헌법 4조 2항**: DB 삭제·Auth 설정 변경 금지. 조사만.
⚠️ 이 지시서는 **조사+보고**까지. 실제 처리(DB 삭제, Auth 비활성 등)는 작가님 결재 후 별도 지시.

---

## 완료 기준

- 두 조사 항목 모두 결과 기록
- "어느 DB가 정본인지" 명확한 결론
- "anonymous 로그인이 필요한지" 명확한 결론
- 세션 로그 어펜드
