# MONKOS 보안 점검 보고서

**작성일:** 2026-02-13
**작성자:** MONK STUDIO 개발팀
**대상:** monkos.ai 포털 + idphoto 서비스
**버전:** v1.0 (긴급 점검)

---

## 1. 요약

| 구분 | 심각 | 높음 | 중간 | 낮음 |
|------|------|------|------|------|
| 발견 취약점 | 2 | 3 | 4 | 2 |

**긴급 조치 필요 항목:** 2건
**권장 개선 항목:** 9건

---

## 2. 심각 (Critical) 취약점

### 2.1 🔴 크레딧 API 인증 부재

**위치:** `portal/server.js` - `/api/credits`, `/api/credits/use`

**현재 상태:**
```javascript
// userId만 있으면 누구나 조회/차감 가능
const userId = urlParams.searchParams.get('userId');
const userRef = usersCollection.doc(userId);
```

**공격 시나리오:**
```bash
# 타인의 크레딧 조회
curl "https://monkos.ai/api/credits?userId=google_123456789"

# 타인의 크레딧 차감 (심각!)
curl -X POST "https://monkos.ai/api/credits/use" \
  -d '{"userId":"google_123456789","type":"download"}'
```

**위험도:** 🔴 심각 (타인 크레딧 탈취 가능)

**해결 방안:**
```javascript
// 세션 토큰 검증 필수화
if (req.url?.startsWith('/api/credits')) {
  const authHeader = req.headers.authorization;
  const user = await verifySessionToken(authHeader);
  if (!user || user.id !== userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
```

---

### 2.2 🔴 기본 시크릿 키 하드코딩

**위치:** `portal/server.js:1119, 1164`

**현재 상태:**
```javascript
const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
```

**위험:** 환경변수 미설정 시 예측 가능한 시크릿 사용

**해결 방안:**
```javascript
const secret = LEMONSQUEEZY_WEBHOOK_SECRET;
if (!secret) {
  throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET 필수');
}
```

---

## 3. 높음 (High) 취약점

### 3.1 🟠 CORS 전체 허용

**위치:** `portal/server.js:466`

**현재 상태:**
```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
```

**위험:** 모든 도메인에서 API 호출 가능 → CSRF 공격 가능

**해결 방안:**
```javascript
const ALLOWED_ORIGINS = [
  'https://monkos.ai',
  'https://idphoto-jp.monkos.ai',
  'https://idphoto-kr.monkos.ai',
];

const origin = req.headers.origin;
if (ALLOWED_ORIGINS.includes(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin);
}
```

---

### 3.2 🟠 세션 토큰 서명 없음

**위치:** `functions/api/auth.js:388`

**현재 상태:**
```javascript
// 단순 Base64 인코딩 (서명 없음)
const token = btoa(JSON.stringify(payload));
```

**위험:** 토큰 위변조 가능

**해결 방안:**
```javascript
// HMAC 서명 추가 또는 JWT 사용
import jwt from 'jsonwebtoken';
const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
```

---

### 3.3 🟠 XSS 취약점 (sessionStorage)

**위치:** `portal/public/index.html`

**현재 상태:**
```javascript
sessionStorage.setItem('monkos_user', JSON.stringify(currentUser));
```

**위험:** XSS 공격 시 세션 탈취 가능

**해결 방안:**
- HttpOnly 쿠키 사용 (서버 세션)
- CSP(Content Security Policy) 헤더 추가
- 입력값 새니타이징

---

## 4. 중간 (Medium) 취약점

### 4.1 🟡 Rate Limiting 부재

**현재 상태:** API 호출 제한 없음

**위험:** DDoS, 브루트포스 공격

**해결 방안:**
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // IP당 100회
});
```

---

### 4.2 🟡 로그에 민감 정보 노출

**현재 상태:**
```javascript
log(`[Auth] 신규 가입: ${user.email}`);
```

**위험:** 로그 탈취 시 개인정보 노출

**해결 방안:**
```javascript
log(`[Auth] 신규 가입: ${maskEmail(user.email)}`);
// output: g****n@gmail.com
```

---

### 4.3 🟡 Firestore 보안 규칙 미검토

**현재 상태:** 서버에서만 접근하므로 낮은 위험

**권장:** Firestore 보안 규칙 명시적 설정 확인

---

### 4.4 🟡 SQL Injection 유사 패턴

**현재 상태:** Firestore 사용으로 SQL Injection은 해당 없음

**주의:** NoSQL Injection 가능성 검토 필요
```javascript
// 사용자 입력을 직접 쿼리에 사용 시 주의
const userId = req.body.userId; // 검증 필요
```

---

## 5. 낮음 (Low) 취약점

### 5.1 🟢 에러 메시지 정보 노출

```javascript
res.end(JSON.stringify({ error: err.message }));
```

**권장:** 프로덕션에서는 일반 에러 메시지 반환

---

### 5.2 🟢 HTTP 보안 헤더 부분 적용

**현재 적용됨:**
- ✅ Strict-Transport-Security
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options

**추가 권장:**
- ❌ Content-Security-Policy (CSP)
- ❌ X-XSS-Protection
- ❌ Referrer-Policy

---

## 6. 긴급 조치 항목

### 6.1 즉시 조치 (24시간 내)

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| 1 | 크레딧 API 인증 추가 | 2시간 |
| 2 | 기본 시크릿 제거 | 30분 |
| 3 | CORS 화이트리스트 | 1시간 |

### 6.2 단기 조치 (1주일 내)

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| 4 | JWT 토큰 도입 | 4시간 |
| 5 | Rate Limiting | 2시간 |
| 6 | CSP 헤더 추가 | 1시간 |

### 6.3 중기 조치 (1개월 내)

| 우선순위 | 항목 | 예상 공수 |
|----------|------|----------|
| 7 | 로그 마스킹 | 2시간 |
| 8 | 보안 감사 자동화 | 8시간 |
| 9 | 침투 테스트 | 외주 |

---

## 7. 개선된 인증 플로우 제안

### 7.1 현재 플로우
```
Google OAuth → credential → 서버 검증 → sessionStorage에 user 저장
  ↓
API 호출 시 userId 파라미터로 전달 (인증 없음)
```

### 7.2 권장 플로우
```
Google OAuth → credential → 서버 검증
  ↓
서버에서 JWT 발급 (HttpOnly 쿠키 또는 Authorization 헤더)
  ↓
API 호출 시 JWT 검증 → userId 추출
  ↓
userId 일치 확인 후 처리
```

### 7.3 구현 예시

**서버 (토큰 발급):**
```javascript
import jwt from 'jsonwebtoken';

async function handleGoogleCallback(credential) {
  const tokenInfo = await verifyGoogleToken(credential);

  const accessToken = jwt.sign(
    { userId: tokenInfo.sub, email: tokenInfo.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: tokenInfo.sub },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken, user };
}
```

**서버 (API 보호):**
```javascript
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**클라이언트:**
```javascript
async function apiCall(endpoint, options = {}) {
  const token = getAccessToken(); // 메모리 또는 쿠키에서

  return fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}
```

---

## 8. 결론

### 현재 보안 수준
```
████████░░░░░░░░░░░░ 40%
```

**평가:** 개발/테스트 단계 수준, 프로덕션에는 부적합

### 조치 후 목표
```
████████████████░░░░ 80%
```

### 권장 액션
1. **즉시:** 크레딧 API 인증 추가 (최우선)
2. **1주일:** JWT 기반 인증 시스템 전환
3. **1개월:** 전체 보안 감사 + 침투 테스트

---

## 9. 참고 자료

- OWASP Top 10 (2021)
- Google Cloud Security Best Practices
- JWT.io (JWT 표준)
- Helmet.js (Node.js 보안 헤더)

---

**문서 끝**
