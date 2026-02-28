---
type: order
id: ORDER_20260228_막내3_CF_GCS_잔재점검
date: 2026-02-28 13:15 KST
from: iMac/쌍아
to: 막내3
priority: P1
status: pending
---

# 지시서: Cloudflare Pages 잔재 전수 점검

> **[2026-02-28 13:15 KST] iMac/쌍아 → 막내3**
> **배경**: 쿠키 단일화 리팩토링 후 이상 증상 발생. 과거 배포 잔재가 CF Pages/Workers에 묻어있을 가능성. Git 레포와 CF 측에서 과거 불필요한 것들이 묻어오는 경험이 있었음 (작가님 직접 경험).
> **엔드라인**: 전수 점검 보고서 → 커밋+push → 완료 보고

---

## 1. 점검 범위

### A. Cloudflare Pages — monk.kr 본진

1. **배포 상태 확인**: `wrangler pages deployment list --project-name=monk-kr` (또는 해당 프로젝트명)
2. **현재 활성 배포의 파일 목록** — 이전 빌드 산출물이 남아있는지
3. **_redirects, _headers 파일** — 이전 리다이렉트 규칙이 monkos.ai 도메인과 충돌하는지
4. **Functions (Pages Functions)** — 루트 `functions/` 폴더 기준 정본 확인. CF 측에 이전 버전이 캐싱되어 있는지

### B. Cloudflare Workers — functions/

1. **루트 functions/ 파일 전수 확인**: 현재 배포된 워커 목록 vs 코드베이스
2. **이전 인증 로직 잔재**: sessionStorage/localStorage 관련 코드가 Workers에 남아있는지
3. **CORS 헤더 설정**: idphoto-kr.monkos.ai ↔ monkos.ai 크로스도메인 설정이 쿠키 단일화에 부합하는지
4. **wrangler.toml 점검**: 바인딩, 환경변수, 라우팅 규칙에 이전 설정이 남아있는지

### C. Cloudflare DNS/도메인

1. **DNS 레코드 점검**: monk.kr, monkos.ai 관련 CNAME/A 레코드가 올바른 타겟을 가리키는지
2. **SSL/TLS 설정**: Full(strict) 모드인지
3. **Page Rules / Cache Rules**: 이전에 설정한 캐시 규칙이 JS 파일 캐싱에 영향을 주는지

### D. Cloudflare 캐시

1. **캐시 퍼지 필요 여부**: CF CDN에 이전 JS가 캐싱되어 있는지 확인
   - `curl -I https://monk.kr/...` 헤더의 `cf-cache-status` 확인
2. **Browser Cache TTL 설정**: CF 대시보드 설정이 서버의 Cache-Control 헤더를 오버라이드하는지

---

## 2. 산출물

| # | 내용 |
|---|------|
| 1 | CF 전수 점검 보고서 — 완료 보고에 포함 |
| 2 | 발견된 잔재/설정 오류 목록 + 수정 권고 |

**참고**: CF 설정 변경은 보고만. 실제 변경은 쌍아+작가님 승인 후.

---

## 3. 작업 절차

```
1. MEMORY.md 읽기
2. git pull origin develop
3. 루트 functions/ 전체 읽기
4. wrangler.toml 읽기 (있는 경우)
5. MONK_kr/ 폴더 내 _redirects, _headers 확인
6. CF API/CLI로 배포 상태 확인 (가능한 범위)
7. curl로 프로덕션 캐시 헤더 확인
8. 보고서 작성 → 커밋 + push
9. 완료 보고
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키, 프로젝트 ID 노출 금지 — 보고서에 마스킹
- **ch7 3조**: CF 설정 변경 금지 — 보고만 수행
- **CF functions/ 정본**: 루트 `functions/`만 유효 (MEMORY.md 디버깅 교훈)
