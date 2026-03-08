---
type: ORDER
date: 2026-02-28
from: M1/쌍아
to: 막내1
priority: P0
subject: 쿠키 단일화 Phase A — 서버 준비
code: AUTH_COOKIE_PHASE_A
design_ref: DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md
---

# 지시서: 쿠키 단일화 Phase A — 서버 준비

> **[2026-02-28] M1/쌍아 → 막내1**
> **유형**: 구현 (무파괴 — 신규 추가만)
> **설계서**: `monkos-ops/tech/DESIGN_AUTH_PROTOCOL_COOKIE_UNIFICATION.md`
> **선행 조건**: 없음 (Phase A가 첫 단계)

---

## 작업 개요

서버 측 보안 결함 수정 + 로그아웃 API 신설. **기존 코드 삭제 없음, 추가만.**

---

## 작업 상세

### A1. AUTH_SECRET 환경변수 분리

**파일**: `monkos_AI/portal/lib/shared/config.js`

**현행 (149~158행 부근)**:
```javascript
const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
```

**변경**:
```javascript
const AUTH_SECRET = process.env.AUTH_SECRET;
if (!AUTH_SECRET) {
  console.warn('[AUTH] ⚠️ AUTH_SECRET 환경변수 미설정 — 프로덕션에서는 반드시 설정 필요');
}
const authSecret = AUTH_SECRET || LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
```

- `generateAuthToken()`과 `verifyAuthToken()` 내부에서 `authSecret` 사용
- 기존 `LEMONSQUEEZY_WEBHOOK_SECRET` 폴백 유지 (하위 호환)
- AUTH_SECRET 미설정 시 서버 시작은 허용하되 경고 로그

### A2. timingSafeEqual 적용

**파일**: `monkos_AI/portal/lib/shared/config.js`

**현행 verifyAuthToken() 내부**:
```javascript
if (sig !== expectedSig) return null;
```

**변경**:
```javascript
import { timingSafeEqual } from 'crypto';
// ...
const sigBuf = Buffer.from(sig, 'hex');
const expectedBuf = Buffer.from(expectedSig, 'hex');
if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
```

- `crypto.timingSafeEqual` 사용 (Node.js 내장)
- 길이 불일치 시 사전 차단 (timingSafeEqual은 같은 길이만 비교 가능)

### A3. 로그아웃 API 신설

**파일 1**: `monkos_AI/portal/lib/auth.js`

함수 추가:
```javascript
export async function handleLogout(req, res) {
  res.setHeader('Set-Cookie', 'monkos_session=; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true }));
}
```

**파일 2**: `monkos_AI/portal/server.js`

라우트 추가 (기존 auth 라우트 근처):
```javascript
import { handleLogout } from './lib/auth.js';
// ...
app.post('/api/auth/logout', handleLogout);
```

- POST 메서드 사용 (GET은 이미지 태그 CSRF 공격 가능 — 막내3 리스크 보고서 R8)
- 쿠키 삭제 (Max-Age=0) + 200 응답

### A4. AUTH_SECRET 환경변수 생성 + deploy.sh 반영

**시크릿 생성** (터미널에서 실행):
```bash
openssl rand -hex 32
```

**deploy.sh에 추가** (또는 환경변수 설정 파일):
```
AUTH_SECRET={위에서 생성한 값}
```

> 헌법 제6조 보완 개정 추인 안건 기반 (PETITION_20260228_쌍아_헌법6조_보완개정.md, 작가님 승인 2026-02-28 07:57 KST).
> 단서 조건: ① 환경변수로만 주입 ② 커밋 메시지에 용도 명시 ③ 결제 시크릿과 분리 확인

---

## 완료 조건

- [ ] config.js — AUTH_SECRET 환경변수 분리 + 폴백 유지
- [ ] config.js — timingSafeEqual 적용
- [ ] config.js — AUTH_SECRET 미설정 시 경고 로그
- [ ] auth.js — handleLogout() 추가
- [ ] server.js — POST /api/auth/logout 라우트 추가
- [ ] `node server.js` 로컬 기동 테스트 통과
- [ ] 기존 로그인/인증 흐름에 영향 없음 확인
- [ ] 커밋 (develop, `[feat]` 태그)
- [ ] push 승인 요청

---

## 주의사항

1. **기존 코드 삭제 금지** — 추가만. generateAuthToken/verifyAuthToken 시그니처 변경 없음
2. **AUTH_SECRET은 `openssl rand -hex 32`로 생성** — 코드에 하드코딩 금지, 환경변수로만 주입 (헌법 6조 추인 안건 기반)
3. **LEMONSQUEEZY_WEBHOOK_SECRET 폴백 유지** — AUTH_SECRET 미설정 시 기존 동작 보장
4. **import 방식 확인** — config.js가 ESM(`export`)인지 CJS(`module.exports`)인지 확인 후 맞출 것
