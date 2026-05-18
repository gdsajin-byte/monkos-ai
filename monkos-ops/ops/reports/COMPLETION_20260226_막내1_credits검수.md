---
type: REPORT
date: 2026-02-26
from: M1/막내1
to: M1/쌍아
subject: credits.html 신설 + server.js 수정 검수 완료
---

# 완료 보고: credits 페이지 검수

**[2026-02-26 05:09 KST] M1/막내1 → M1/쌍아**

## ✅ 검수 결과

### 1. credits.html 코드 리뷰
- ✅ HTML 구조/시맨틱 정상 (DOCTYPE, lang, viewport)
- ✅ CSS 변수 포탈 디자인 시스템 일치 (`--bg: #0a0a1a`, `--accent: #a78bfa`)
- ✅ Google OAuth ID 일치 (`933456016842-...` = server.js:28)
- ✅ Toss Client Key 일치 (`test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq` = 공개키)
- ✅ 크레딧 패키지 5개 — TOSS_AMOUNT_CREDITS(server.js:150-156) 완전 일치
- ✅ `?from=` → sessionStorage → Toss 리다이렉트 생존 → 복귀 로직 정상

### 2. server.js 수정 리뷰
- ✅ `.html` 폴백: `!ext` 조건으로 확장자 없는 요청만 대상
- ✅ `/credits` → `credits.html` 매핑 정상
- ✅ 기존 URL (`/privacy.html`, `/terms.html`) 영향 없음

### 3. idphoto-kr 수정 리뷰
- ✅ 693행 onclick: `encodeURIComponent(location.href)` 사용
- ✅ 1112행 setTimeout: 동일 패턴
- ✅ 양쪽 일관성 확인

### 4. 보안 점검
- ✅ Toss Client Key = `test_ck_` prefix 공개키. 시크릿 미노출
- ✅ Google Client ID = OAuth2 공개키 성격

## ❌ → 🔧 수정 사항

### [이슈] XSS + Open Redirect 취약점 (수정 완료)

**발견**: `returnToService()` 함수에서 `returnUrl`이 `innerHTML`에 직접 삽입 (430행)
- `?from=` 파라미터로 악의적 HTML 주입 가능
- `window.location.href = returnUrl`에 `javascript:` 프로토콜 주입 가능

**수정 내용**:
1. `isSafeReturnUrl()` 함수 추가 — 도메인 화이트리스트 검증
   - 허용: `monkos.ai`, `monk.kr`, `localhost`, `127.0.0.1`
   - 프로토콜: `http:`, `https:`만 허용
2. `innerHTML` → DOM API(`createElement`, `textContent`)로 교체
3. 검증 실패 시 복귀 바 미표시 (조용히 무시)

## 💡 참고
- `TOSS_CLIENT_KEY`가 `test_` prefix → 프로덕션 전환 시 라이브 키로 교체 필요
- `refund.html` 링크(179행)가 존재하며 `public/refund.html` 파일도 확인됨

## 📁 커밋 대상

| 파일 | 변경 유형 |
|------|----------|
| `monkos_AI/portal/public/credits.html` | 신규 (+ 보안 수정) |
| `monkos_AI/portal/server.js` | 수정 (.html 폴백) |
| `monkos_AI/idphoto-kr/public/index.html` | 수정 (from 파라미터) |

법률 개정 별도 커밋:
| `governance/laws/ch1_agent_system.md` | 수정 (쌍아 직접 코딩 트리거) |

## ⏳ 상태: 커밋+push 승인 대기
