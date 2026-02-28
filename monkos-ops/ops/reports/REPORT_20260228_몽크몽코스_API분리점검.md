---
type: report
id: REPORT_20260228_몽크몽코스_API분리점검
date: 2026-02-28 18:54 KST
from: iMac/막내4
to: iMac/쌍아
order: ORDER_20260228_막내4_몽크몽코스_API분리_전수점검
status: completed
---

# monk.kr ↔ monkos.ai API 교차 오염 전수 점검 보고서

> **[2026-02-28 18:54 KST] iMac/막내4 → iMac/쌍아**
> 대원칙: monk.kr과 monkos.ai는 완전히 분리. 교차 호출 절대 금지.

---

## 1. 전수 스캔 요약

| 방향 | 발견 건수 | 수정 | 미수정(전략 판단 필요) |
|------|----------|------|----------------------|
| monk.kr → monkos.ai | **15건** | 1건 | 14건 |
| monkos.ai → monk.kr | **6건** | 4건 | 2건 |
| **합계** | **21건** | **5건** | **16건** |

---

## 2. 발견 사항 상세

### Category A: API 교차 호출 (위반 — 장애 원인)

#### A-1. `_redirects` — 가장 위험한 교차 오염 근원

| 파일 | 라인 | 내용 | 위험도 |
|------|------|------|--------|
| `MONK_kr/_redirects:1` | `/ai_lab/photolab/* → https://idphoto-kr.monkos.ai/:splat 301` | 🔴 |
| `MONK_kr/_redirects:2` | `/ai_lab/image_pro/* → https://image.monkos.ai/:splat 301` | 🔴 |
| `MONK_kr/_redirects:3` | `/api/* → https://monkos.ai/api/:splat 301` | 🔴🔴🔴 |

**Phase 2 커밋 `6dcde0c`에서 추가됨.**

- 3번 라인이 가장 위험: monk.kr의 **모든 API 호출**을 monkos.ai로 301 리다이렉트
- functions/ 제거의 대체재로 사용 → 실질적으로 monkos.ai를 프록시로 만듦
- **헌법 10조 (프록시 금지 원칙) 정면 위반**
- **미수정**: 제거 시 monk.kr의 API 기능 전체 정지. 전략 결정 필요

#### A-2. `ai_lab.html` 서비스 카드 링크 변경

| 파일:라인 | 변경 전 (Phase 2 이전) | 변경 후 (Phase 2) |
|-----------|----------------------|-------------------|
| `ai_lab.html:109` | `./photolab/` | `https://idphoto-kr.monkos.ai` |
| `ai_lab.html:157` | `./image_pro/` | `https://image.monkos.ai` |
| `ai_lab.html:84` | 자체 로그인 UI | `https://monkos.ai/portal` 링크 |
| `ai_lab.html:608-616` | 상대 경로 라우팅 | monkos.ai 절대 경로 라우팅 |

**Phase 2 커밋 `6dcde0c`에서 변경.** 네비게이션 링크이나 분리 원칙 위반.
**미수정**: _redirects 전략과 연동 — 동시 결정 필요

#### A-3. photolab API 호출

| 파일:라인 | 내용 | 영향 |
|-----------|------|------|
| `photolab/config.js:8` | `PORTAL_URL: 'https://monkos.ai'` | 포털 API 호출 |
| `photolab/config.js:14` | `COACHING: 'https://monkos.ai/api/coaching'` | AI 코칭 API |
| `photolab/config.js:15` | `QC: 'https://monkos.ai/api/qc'` | QC API |
| `photolab/app.js:82` | `${protocol}//idphoto-kr.monkos.ai` | WebSocket 코칭 |
| `photolab/shared.js:265` | QR 코드 URL에 idphoto-kr.monkos.ai | 모바일 리다이렉트 |

**미수정**: photolab은 _redirects에 의해 이미 idphoto-kr.monkos.ai로 리다이렉트됨.
monk.kr에서 직접 접근 불가 상태. _redirects 전략과 연동.

#### A-4. photolab/engine/server.js

| 파일:라인 | 내용 |
|-----------|------|
| `engine/server.js:26` | `PORTAL_API_URL = 'https://monkos.ai'` |

**참고**: 이 파일은 Cloud Run용 독립 서버. monk.kr에서 직접 사용되지 않음.
위치가 `MONK_kr/` 안에 있으나 실제 배포 대상은 Cloud Run.
**미수정**: 구조적 위치 이슈 (MONK_kr 폴더에 Cloud Run 코드 공존)

#### A-5. index-v6.js (이미 조치됨)

| 파일 | 상태 |
|------|------|
| `image_pro/app/assets/index-v6.js:49,58` | image.monkos.ai 호출 |
| `image_pro/app/index.html:75` | v5로 롤백 완료 ✅ |

**조치 완료**: 쌍아 직접 v6→v5 롤백 (커밋 `6ba934f`)

#### A-6. MONK_kr/config.js

| 파일:라인 | 변경 전 | 변경 후 |
|-----------|--------|--------|
| `config.js:13` | `PORTAL: 'https://monkos.ai'` | `PORTAL: ''` ✅ |
| `config.js:14` | `IDPHOTO_KR: 'https://idphoto-kr.monkos.ai'` | `IDPHOTO_KR: ''` ✅ |
| `config.js:15` | `IDPHOTO_JP: 'https://idphoto-jp.monkos.ai'` | `IDPHOTO_JP: ''` ✅ |

**수정 완료**: grep 확인 결과 어떤 페이지에서도 `MONK_CONFIG.API.PORTAL/IDPHOTO_*`를 참조하지 않음. 안전하게 비움.

---

### Category B: monkos.ai → monk.kr 교차 참조

#### B-1. API 호출 (수정 완료)

| 파일:라인 | 변경 전 | 변경 후 | 비고 |
|-----------|--------|--------|------|
| `portal/lib/shared/config.js:53` | `TX_API_URL = '...monk.kr/api/tx'` | `TX_API_URL = ''` ✅ | CF Workers tx.js 이미 제거됨. TX_API_KEY 비어있어 실행 안됨 |

#### B-2. 네비게이션 (수정 완료)

| 파일:라인 | 변경 전 | 변경 후 |
|-----------|--------|--------|
| `idphoto-kr/public/options.js:21` | `'https://monk.kr'` | `'https://monkos.ai'` ✅ |

#### B-3. Schema.org URL (수정 완료)

| 파일:라인 | 변경 전 | 변경 후 |
|-----------|--------|--------|
| `portal/public/index.html:42` | `"url": "https://monk.kr"` | `"url": "https://monkos.ai"` ✅ |
| `idphoto-jp/public/index.html:47` | `"url": "https://monk.kr"` | `"url": "https://monkos.ai"` ✅ |

#### B-4. CORS 허용 목록 (미수정 — 유지 필요)

| 파일:라인 | 내용 | 판단 |
|-----------|------|------|
| `portal/lib/shared/config.js:99` | `'https://monk.kr'` in CORS allowed | 유지 — monk.kr 프론트가 portal API를 호출하는 한 필요 |
| `portal/public/credits.html:425` | `'monk.kr'` in allowed origins | 동일 |

---

### Category C: 정적 콘텐츠/브랜딩 (무관 — 수정 불필요)

- `photolab/*.html` — og:image, favicon, privacy/terms 링크 (monkos.ai CDN)
- `photolab/flowchart_*.html` — 문서/플로우차트 설명 텍스트
- `photolab/result.html:185` — 워터마크 텍스트
- `_backup_20260217/`, `*_spa_backup.*`, `index_00079.html` — 백업 파일

이들은 CDN 리소스 참조이거나 문서 설명이므로 교차 호출이 아님.

---

## 3. Phase 1~3 이관 산출물 리뷰

### Phase 1 (커밋 `3f18774`) — Image Pro 이관

| 변경 | 분리 원칙 위반 |
|------|--------------|
| `index-v6.js` API 엔드포인트 변경 `/api` → `image.monkos.ai` | ⚠️ **위반** — monk.kr 프론트가 monkos.ai API 직접 호출 |
| `apps/monk_imagen4/backend/server.js` API 추가 | ✅ 정상 — Cloud Run 자체 확장 |

→ v6→v5 롤백으로 조치 완료 ✅

### Phase 2 (커밋 `6dcde0c`) — monk.kr 정적화

| 변경 | 분리 원칙 위반 |
|------|--------------|
| `functions/` → `monkos-ops/tech/archive/` 이동 | ✅ 정상 (아카이브) |
| `wrangler.toml` D1 바인딩 제거 | ✅ 정상 |
| `ai_lab.html` 서비스 링크 → monkos.ai | ⚠️ **위반** — A-2 참조 |
| `_redirects` 추가 (3개 301 룰) | 🔴 **위반** — A-1 참조 |
| auth 페이지 아카이브 | ✅ 정상 |

### Phase 3 (커밋 `9712bc5`) — 레거시 정리

| 변경 | 분리 원칙 위반 |
|------|--------------|
| `cloudflare-workers/` 제거 | ✅ 정상 |
| `cloudflare-workers-imagen/` 제거 | ✅ 정상 |
| `.gitignore` 보강 | ✅ 정상 |
| GCR 삭제 계획서 작성 | ✅ 정상 |

### Phase 1 추가 (커밋 `aeb74bb`) — Image Pro 프론트 복제

| 변경 | 분리 원칙 위반 |
|------|--------------|
| `apps/monk_imagen4/backend/public/app/` 에 Image Pro 프론트 복제 | ✅ 정상 — Cloud Run 자체 서빙 |
| 인증 JSON (`auth.json`) staff@monk.kr | ⚠️ 참고 — monk.kr 도메인 메일이지만 로컬 인증용 (교차 호출 아님) |

---

## 4. 구조적 이슈 — 전략 결정 필요

### 핵심 딜레마

Phase 2에서 `functions/` 제거 + `_redirects` 추가라는 **두 작업이 쌍을 이룸**:

```
functions/ 제거 → monk.kr/api/* 핸들러 없음
         ↕ 대체
_redirects → monk.kr/api/* → monkos.ai/api/* 301 리다이렉트
```

_redirects를 제거하면 monk.kr의 API 기능이 전부 정지.
functions/를 복원하면 Phase 2의 의도(정적화)가 무효화.

### 선택지

| 방법 | 내용 | 장점 | 단점 |
|------|------|------|------|
| **A. 완전 분리** | _redirects 제거 + functions/ 복원 | 분리 원칙 100% 준수 | Phase 2 롤백 = 이중 인프라 유지 |
| **B. 점진적 분리** | _redirects의 `/api/*` 룰만 제거, photolab/image_pro 리다이렉트는 유지 | photolab→Cloud Run 전환 인정, API 교차는 차단 | monk.kr API 기능 정지 (index.html 챗봇 등) |
| **C. 현상 유지** | 분리 원칙을 "향후 목표"로 재정의 | 즉시 변경 불필요 | 헌법 10조 프록시 금지 위반 지속 |
| **D. monk.kr API 자체 재구축** | functions/ 복원 대신 monk.kr 전용 Workers 재작성 (챗봇 등 필요한 것만) | 깔끔한 분리 + 불필요한 함수 탈락 | 작업량 |

---

## 5. 수정 내역 요약

| # | 파일 | 변경 | 비고 |
|---|------|------|------|
| 1 | `MONK_kr/ai_lab/image_pro/app/index.html` | v6→v5 롤백 | 쌍아 선행 조치 ✅ |
| 2 | `MONK_kr/config.js:13-15` | monkos.ai URL 3개 → 빈 문자열 | 미사용 확인 후 비움 ✅ |
| 3 | `monkos_AI/portal/lib/shared/config.js:53` | TX_API_URL monk.kr → 빈 문자열 | dead endpoint 비활성 ✅ |
| 4 | `monkos_AI/idphoto-kr/public/options.js:21` | monk.kr → monkos.ai | 포털 링크 자체 도메인으로 ✅ |
| 5 | `monkos_AI/portal/public/index.html:42` | Schema URL monk.kr → monkos.ai | ✅ |
| 6 | `monkos_AI/idphoto-jp/public/index.html:47` | Schema URL monk.kr → monkos.ai | ✅ |

---

## 6. 향후 재발 방지 권고

### 코드 리뷰 체크리스트

- [ ] monk.kr 코드에서 `monkos.ai` 문자열 검색 → 0건 확인
- [ ] monkos.ai 코드에서 `monk.kr` 문자열 검색 → CORS 목록만 허용
- [ ] `_redirects` 파일에 교차 도메인 리다이렉트 없음 확인
- [ ] 빌드 파일(`index-v*.js`) 변경 시 API 엔드포인트 교차 확인
- [ ] 새 서비스 추가 시 분리 원칙 명시 (지시서에 포함)

### 법률 보강 제안

- **ch2 (코딩 규칙)에 조항 추가**: "monk.kr 코드에서 monkos.ai API 호출 금지, 그 역도 금지. 네비게이션 링크는 별도 승인."
- **배포 전 grep 검증 자동화**: deploy.sh에 교차 도메인 검사 추가

---

## 7. 검증

```bash
# 수정 후 교차 참조 잔존 확인
grep -rn "monk\.kr" monkos_AI/ --include="*.js" --include="*.html" --include="*.json" | grep -v node_modules | grep -v CORS | grep -v allowed
# → CORS 목록 외에는 monk.kr 참조 없어야 함
```
