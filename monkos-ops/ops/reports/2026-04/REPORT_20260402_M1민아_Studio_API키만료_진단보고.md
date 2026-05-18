---
type: report
from: M1/민아
to: M1/쌍아
date: 2026-04-02
project: MONKOS Studio
---

# MONKOS Studio DEV — API 400 키 만료 진단 보고

**[2026-04-02 03:14 KST] M1/민아 → M1/쌍아**

> 작가님 지시: Studio dev 환경에서 "생성 실패: API 400: API key expired" 에러 발생. 코드 파악 후 쌍아에게 보고서 작성.

---

## 1. 증상

- **환경**: `monkos-studio-dev-933456016842.us-central1.run.app`
- **에러**: `생성 실패: API 400: API key expired. Please renew the API key.`
- **발생 시점**: 여권/신분증 규격 + 여성 + 성인 조건으로 "생성" 클릭 시
- After 영역에 빨간 에러 메시지 출력, 이미지 미생성

---

## 2. 에러 경로 추적

```
[프론트] app.js:439 — fetch('/api/idgen', {...})
  ↓
[서버] server.js:288 — POST /api/idgen 핸들러
  ↓
[서버] server.js:309 — fetch(Google Imagen API)
  요청 URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}
  ↓
[Google] 400 응답: "API key expired. Please renew the API key."
  ↓
[서버] server.js:330 — throw new Error(`API ${response.status}: ${detail}`)
  ↓
[서버] server.js:357 — res.status(500).json({ error: err.message })
  ↓
[프론트] app.js:472 — "생성 실패: API 400: API key expired..."
```

---

## 3. 키 로딩 구조

| 계층 | 위치 | 변수 |
|------|------|------|
| 소스코드 | `studio/server.js:44` | `const GEMINI_API_KEY = process.env.GEMINI_API_KEY \|\| ''` |
| 로컬 환경변수 | `monkos_AI/.env` | `GEMINI_API_KEY=...` |
| Cloud Run 배포 | `studio/deploy.sh:102` | `--set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY}` |

**배포 스크립트**(`deploy.sh`)가 `.env`에서 키를 읽어 Cloud Run 환경변수로 주입.

---

## 4. 원인 판정

**Cloud Run dev 리비전에 배포된 `GEMINI_API_KEY`가 만료(또는 유출 후 비활성화)된 상태.**

3/30 사건과 동일 패턴:
- 3/30: 레포 public 전환 시 Google 스캐너가 키 감지 → `...HDow` 키 유출 → 403
- 3/31: iMac에서 Secret Manager v2(`...aD0`) 반영 + Cloud Run prod 재배포 완료
- **dev 환경은 이 키 갱신이 미반영되었을 가능성 높음**

---

## 5. 조치 방안 (쌍아 → 막내 지시서 항목)

### 즉시 조치 (P0)
1. **dev 환경 키 갱신**: `.env`의 `GEMINI_API_KEY`가 현행 유효 키인지 확인
2. **Studio dev 재배포**: `bash deploy.sh dev` 실행하여 Cloud Run dev 리비전 갱신
3. **생성 테스트**: dev에서 여권 규격 생성 정상 동작 확인

### 검증 사항
- prod(`monkos-studio`)도 동일 에러 없는지 확인
- `.env`의 `GEMINI_API_KEY`와 Secret Manager의 키가 동일한지 대조
- 3/31 키 갱신 시 dev 재배포가 누락된 것인지 이력 확인

### 재발 방지 (P2)
- deploy.sh에서 `.env` 직접 참조 → Secret Manager 참조로 전환 검토
- prod/dev 동시 배포 체크리스트 추가

---

## 6. 영향 범위

| 환경 | 상태 | 비고 |
|------|------|------|
| Studio **dev** | ❌ API 400 | 이번 에러 |
| Studio **prod** | ⚠️ 미확인 | 3/31 재배포 완료 → 정상 추정이나 확인 필요 |
| idphoto-kr prod | ✅ | 3/31 키 갱신 완료 |
| idphoto-jp prod | ✅ | 3/31 키 갱신 완료 |

---

**[2026-04-02 03:14 KST] M1/민아 보고 완료**
