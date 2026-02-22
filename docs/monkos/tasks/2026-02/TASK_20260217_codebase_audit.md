# 막내 지시서: 코드베이스 전수 조사 — 잔재 코드 & 배포 라인 감사

**발행:** 2026-02-17 11:50 KST
**발행자:** 쌍아 (전략실)
**대상:** 막내 (조사 전담)
**우선도:** 최우선
**브랜치:** develop
**성격:** 조사·보고 전용 — 코드 수정 금지

---

## 배경

2/16 야간 세션에서 반복된 문제:
1. develop 코드를 prod(us-central1)에 직배포 → 카메라 충돌 4연속
2. 고아 서비스(asia-northeast1/3)에 배포 → 반영 안 됨
3. `landing.html` 삭제했으나 관련 참조가 잔존
4. `/` 리다이렉트 로직 혼선 (포털 vs /app)

**코드베이스 전체에 이런 잔재가 얼마나 남아있는지 전수 조사한다.**

---

## 조사 범위

```
monkos_AI/
├── idphoto-kr/    ← 서버 + 클라이언트
├── idphoto-jp/    ← 서버 + 클라이언트
├── portal/        ← 포탈 서버
```

+ 루트의 스크립트, 설정 파일, CI/CD 관련 전체

---

## 조사 항목

### A. 배포 라인 감사

코드베이스 전체에서 아래 패턴을 검색하고 **전수 목록** 작성:

1. **`gcloud` 명령어** — 모든 `gcloud` 호출 위치
   - `gcloud run deploy`
   - `gcloud builds submit`
   - 리전 지정값 확인 (us-central1 / asia-northeast1 / asia-northeast3)
2. **`deploy.sh`** — 존재 여부, 내용, dev/prod 분기 로직 확인
3. **`Dockerfile`** — 각 서비스별 존재 여부 및 내용
4. **`cloudbuild.yaml`** / CI/CD 설정 — 존재 여부
5. **하드코딩된 서비스명/리전**
   - `idphoto-kr` vs `monkos-idphoto-kr` (어느 이름이 어디서 쓰이는지)
   - `asia-northeast1`, `asia-northeast3` 참조가 남아있는지

**정답 (MEMORY.md 기준):**
| 도메인 | 서비스명 | 리전 |
|--------|----------|------|
| monkos.ai | monkos-portal | us-central1 |
| idphoto-kr.monkos.ai | monkos-idphoto-kr | us-central1 |
| idphoto-jp.monkos.ai | monkos-idphoto-jp | us-central1 |

→ 위와 다른 값이 하드코딩된 곳 = **잔재**

### B. 랜딩페이지 잔재

`landing.html`은 삭제되었으나:

1. **`landing` 문자열 참조** — HTML, JS, server.js 전체 검색
   - `landing.html` 파일 참조
   - `/landing` 라우트
   - 랜딩 관련 CSS 클래스/ID
2. **루트(`/`) 리다이렉트 로직** — 각 server.js에서 `/` 요청 처리 방식
   - 현재: `/` → `/app` 리다이렉트 (b09462d 커밋)
   - 이전: `/` → 포탈(monkos.ai) 리다이렉트
   - KR과 JP가 동일한지 확인
3. **삭제된 landing.html의 CSS/JS가 다른 파일에 남아있는지**

### C. 고아 코드 / 데드 코드

1. **사용되지 않는 라우트** — server.js에서 실제 클라이언트가 호출하지 않는 엔드포인트
2. **주석 처리된 코드 블록** — 의미 있는 것 vs 삭제해야 할 것 분류
3. **참조 없는 static 파일** — public/ 하위에 어디서도 링크하지 않는 파일
4. **환경변수 참조** — process.env.XXX 중 실제 설정되지 않은 것

### D. KR/JP 불일치

1. **server.js 구조 차이** — 라우트, 미들웨어, 리다이렉트 로직
2. **index.html 구조 차이** — 결제/로그인 외 로직 차이가 있는지
3. **public/ 정적 파일 차이** — KR에만 있고 JP에 없는 것 (또는 반대)

---

## 보고 형식

```markdown
---
## 조사 보고 [막내N] [HH:MM KST]

### A. 배포 라인
| 파일 | 줄 | 내용 | 문제 |
|------|-----|------|------|
| path/file | L123 | `gcloud run deploy ...` | 리전 불일치 |

### B. 랜딩 잔재
| 파일 | 줄 | 내용 | 상태 |
|------|-----|------|------|
| path/file | L456 | `landing.html` 참조 | 삭제 필요 |

### C. 고아 코드
| 파일 | 줄 | 내용 | 분류 |
|------|-----|------|------|
| path/file | L789 | 미사용 라우트 `/old-api` | 삭제 후보 |

### D. KR/JP 불일치
| 항목 | KR | JP | 판단 |
|------|-----|-----|------|
| 루트 리다이렉트 | /app | ??? | 확인 필요 |

### 요약
- 🔴 즉시 수정 필요: N건
- 🟡 정리 권장: N건
- 🟢 문제 없음: N건

📁 조사 대상 파일 수: N개
🔀 코드 수정: 없음 (조사 전용)
---
```

---

## 제약

- **코드 수정 금지** — 순수 조사·보고만
- **배포 금지** — 당연히
- 의심스러운 것은 빠짐없이 기록 (과잉 보고 > 누락)
- MEMORY.md 먼저 읽고 시작할 것
