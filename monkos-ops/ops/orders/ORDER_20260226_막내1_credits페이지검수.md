---
type: ORDER
date: 2026-02-26
from: M1/쌍아
to: 막내(any)
subject: credits.html 신설 + server.js 수정 검수
priority: 높음
---

# 지시서: credits 페이지 검수 및 배포

**[2026-02-26 05:05 KST] M1/쌍아 → 막내(any)**

## 역할 선언
> **너는 "막내1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

---

## 배경

이번 세션에서 쌍아가 직접 코딩한 산출물이 있다 (ch1 1조 "쌍아 직접 실행" 트리거 신설 이전에 작성됨). 정식 절차에 따라 막내가 검수한 뒤 커밋+push한다.

### 문제
- idphoto-kr에서 크레딧 버튼(💎) 클릭 → `https://monkos.ai/credits` → 404 검은 화면
- portal에 `credits.html` 파일 미존재

### 쌍아 작업 내역 (검수 대상)

| 파일 | 변경 유형 | 내용 |
|------|----------|------|
| `monkos_AI/portal/public/credits.html` | **신규** | 독립 크레딧 충전 페이지 |
| `monkos_AI/portal/server.js` (2594-2604) | **수정** | 확장자 없는 URL → `.html` 폴백 |
| `monkos_AI/idphoto-kr/public/index.html` (693, 1112) | **수정** | 크레딧 링크에 `?from=` 파라미터 추가 |
| `governance/laws/ch1_agent_system.md` (31) | **수정** | 쌍아 직접 코딩 트리거 규칙 추가 |

---

## 검수 항목

### 1. credits.html 코드 리뷰
- [ ] HTML 구조/시맨틱 확인
- [ ] CSS 변수가 portal 디자인 시스템(`--bg: #0a0a1a`, `--accent: #a78bfa`)과 일치하는지
- [ ] Google OAuth 클라이언트 ID가 `config.js` 및 `server.js`와 동일한지 (`933456016842-...`)
- [ ] Toss 클라이언트 키가 `config.js`와 동일한지 (`test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq`)
- [ ] 크레딧 패키지 5개가 `shared.js` CHARGE_OPTIONS 및 `server.js` TOSS_AMOUNT_CREDITS와 일치하는지
- [ ] `?from=` → sessionStorage → Toss 리다이렉트 생존 → 복귀 로직 정상 여부
- [ ] XSS 위험: `returnUrl`이 `innerHTML`에 직접 삽입되는 부분 확인 (보안 검토)

### 2. server.js 수정 리뷰
- [ ] `.html` 폴백 로직이 기존 정적 파일 서빙을 깨지 않는지
- [ ] `/credits` → `credits.html` 매핑 확인
- [ ] `/privacy`, `/terms` 등 기존 확장자 있는 URL이 영향받지 않는지

### 3. idphoto-kr 수정 리뷰
- [ ] `from` 파라미터 인코딩이 올바른지 (`encodeURIComponent`)
- [ ] 693번줄 onclick, 1112번줄 setTimeout 양쪽 모두 반영 확인

### 4. 로컬 테스트 (가능 시)
- [ ] portal 서버 로컬 실행 → `http://localhost:8080/credits` 접속 → 페이지 렌더링
- [ ] `http://localhost:8080/credits.html` 도 동일하게 접근 가능
- [ ] 미로그인 시 Google 로그인 UI 노출
- [ ] 기존 페이지(`/privacy.html`, `/terms.html`) 정상 서빙

### 5. 보안 점검
- [ ] `returnUrl`에 대한 도메인 화이트리스트 필요 여부 판단
- [ ] API 키가 하드코딩된 부분이 클라이언트 공개키(Toss client key, Google client ID)인지 확인 — 시크릿 키 노출 없는지

---

## 발견 시 조치

- **경미한 문제** (스타일, 오타 등): 직접 수정 후 커밋에 포함
- **중대한 문제** (보안, 로직 오류): 수정 후 보고서에 `[이슈]` 태그로 명시
- **구조적 문제** (설계 변경 필요): 수정하지 말고 보고 → 쌍아+작가님 판단

---

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | `monkos-ops/ops/reports/COMPLETION_20260226_막내1_credits검수.md` |
| 문서 유형 | `REPORT` |
| 세션 로그 | `[log] 태그 커밋` |

### 커밋 메시지 가이드
```
[portal] credits.html 신설 + server.js .html 폴백 + idphoto-kr from 파라미터
```

법률 개정 파일(ch1)은 별도 커밋:
```
[법률] ch1 1조 — 쌍아 직접 코딩 트리거 신설
```
