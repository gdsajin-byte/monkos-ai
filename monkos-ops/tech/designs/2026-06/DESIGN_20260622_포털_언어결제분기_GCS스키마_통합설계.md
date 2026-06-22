---
type: design
date: 2026-06-22
device: iMac
agent: 쌍아
status: 기안
---

# 설계서: 포털 언어·결제 분기 + GCS 스키마 통합 설계

> 6/22 세션 논의 기반. 민아 분석(2축 모델, SEO 경고) 반영.

## 1. 원칙 — 3→1 수렴

현재 언어 감지 메커니즘이 3개로 파편화되어 있다. 새로 얹는 게 아니라 **하나로 모아서 단순화**하는 것이 핵심.

| 현재 (파편) | 문제 | 통합 후 |
|---|---|---|
| i18n.js — 클라이언트 타임존+브라우저 언어 | SSR과 불일치, kr/global 2분법 (일본 구분 불가) | **폐기** → 서버 판별값 수신 |
| 홈 renderHome — 한국어 하드코딩 | 내부 페이지와 불일치 | **통합** → 내부 페이지와 동일 i18n 텍스트팩 |
| crop localStorage.monkos_lang | 3번째 독립 메커니즘 | **폐기** → 쿠키 단일화 |

통합 후 단일 흐름:
```
첫 방문 → 서버 Accept-Language 판별 → 쿠키 세팅 → SSR 렌더
재방문 → 쿠키 읽기 → SSR 렌더
수동 전환 → 쿠키 갱신 → 리로드
```

## 2. 2축 모델

언어와 결제는 분리한다. 신호가 다르고, 뭉치면 시나리오3(미국 출장 일본인)이 깨진다.

### 축 A — 언어 (UI 렌더링)

| 우선순위 | 신호 | 설명 |
|---|---|---|
| 1 | 쿠키 `monkos_lang` | 사용자가 명시 선택했거나 이전 방문에서 설정됨 |
| 2 | URL 경로 prefix | `/ja/`, `/en/` → 해당 언어 강제 + 쿠키 갱신 |
| 3 | Accept-Language 헤더 | 첫 방문 시 서버가 읽어서 판별 |
| 4 | 기본값 | `ko` |

**서버단 판별 로직** (server.js 미들웨어):
```javascript
function detectLang(req) {
  // 1. URL prefix
  const pathLang = req.url.match(/^\/(ja|en)(\/|$)/)?.[1];
  if (pathLang) return pathLang;

  // 2. 쿠키
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.monkos_lang && ['ko', 'ja', 'en'].includes(cookies.monkos_lang)) {
    return cookies.monkos_lang;
  }

  // 3. Accept-Language
  const accept = req.headers['accept-language'] || '';
  if (accept.match(/^ja/i)) return 'ja';
  if (accept.match(/^en/i)) return 'en';
  if (accept.match(/^ko/i)) return 'ko';

  return 'ko';
}
```

**쿠키 세팅**: 서버가 판별한 lang을 `Set-Cookie: monkos_lang={lang}; Domain=.monkos.ai; Path=/; Max-Age=31536000; SameSite=Lax`로 응답 헤더에 포함.

**클라이언트 i18n.js 변경**: 자체 감지 로직 전부 제거. 서버가 세팅한 쿠키에서 `lang`만 읽거나, SSR 시 `window.__LANG__` 변수로 주입받아 사용.

### 축 B — 결제 (통화·수단)

| 신호 | 수단 | 설명 |
|---|---|---|
| IP 국가 | `geoip-lite` (npm) | KR → 토스, 그 외 → LINE Shop/Stripe |
| 사용자 override | 체크아웃 화면 | 자동 추정이 틀려도 교정 가능 |
| 로그인 유저 | Firestore user.region | 첫 결제 시 확정, 이후 기억 |

**서버단 판별 로직**:
```javascript
import geoip from 'geoip-lite';

function detectPaymentRegion(req) {
  // 로그인 유저의 저장된 region 우선
  if (req.user?.region) return req.user.region;

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  const geo = geoip.lookup(ip);
  return (geo?.country === 'KR') ? 'kr' : 'global';
}
```

**현재 credits.js의 `region` 변수**: 서버가 판별한 값을 SSR 시 `window.__REGION__` 으로 주입. 클라이언트의 `detectRegion()` (타임존 기반) 폐기.

## 3. SEO 안전장치

| 규칙 | 이유 |
|---|---|
| **강제 302 리다이렉트 금지** | Googlebot은 미국 IP로 크롤링. geo redirect 걸면 봇이 한국어 색인 불가 |
| `monkos.ai/` = x-default (한국어) 유지 | hreflang 정본. 변경 없음 |
| Accept-Language 기반은 **렌더링만**, URL 변경 안 함 | 일본어 브라우저로 `/` 접속 → 일본어로 렌더하되 URL은 `/` 유지 |
| 사용자 명시 전환 시에만 URL prefix 변경 | 스위처 클릭 → `/ja/` 이동 |

## 4. 영향받는 파일 — 변경 범위

### P1 — 서버단 언어·결제 판별 통합

| 파일 | 변경 |
|---|---|
| `portal/server.js` | `detectLang()` 미들웨어 추가, 모든 렌더 함수에 lang 전달, `Set-Cookie` 응답 |
| `portal/lib/shared/config.js` | `geoip-lite` import, `detectPaymentRegion()` 함수 |
| `portal/public/js/i18n.js` | `detectRegion()` 제거, 서버 주입값(`__LANG__`, `__REGION__`) 수신으로 전환 |
| `portal/lib/cms/home.js` | 한국어 하드코딩 → 텍스트팩(ko/ja/en) 분리 |

### P1 — GCS 스키마 정리

| 파일 | 변경 |
|---|---|
| `studio/server.js` | `/api/profiles/generate` — 요청에서 userId 수신, `saveImages(userId, ...)` 호출 |
| `portal/server.js` | headshot 프록시 — Studio 호출 시 userId 전달 |
| `studio/gcs-save.js` | 경로 구조 변경: `{서비스}/{userId}/{파일명}` |

### P2 — 언어 스위처 UI + 결제 리다이렉트

| 파일 | 변경 |
|---|---|
| `portal/lib/cms/render-shell.js` | layoutNav에 KO/JA/EN 스위처 UI 추가 |
| `portal/lib/payments.js` | toss-success에 returnUrl 파라미터 전달·사용 |
| `portal/public/js/credits.js` | buyToss 호출 시 현재 페이지 경로를 returnUrl로 전달 |

### P3 — crop localStorage 통합

| 파일 | 변경 |
|---|---|
| `MONK_kr/ai_lab/photolab/` 관련 | localStorage.monkos_lang → 쿠키 monkos_lang 전환 |

## 5. GCS 파일명 스키마

### 폴더 구조 (확정)

```
monk-customer-photos/
  idphoto/                    ← 증명사진
    {userId}/
  headshot/                   ← 헤드샷
    {userId}/
  profiles/                   ← 차후 프로필 스튜디오
    {userId}/
```

- `service/` 중간 폴더 제거
- 서비스별 1단 폴더
- 유저별 하위 폴더 (마이페이지 연동 대비)

### 파일명 패턴

```
{timestamp}_{style}_{type}.{ext}

예시:
idphoto/kakao_4817724214/
  20260328T0301_passport_original.jpg
  20260328T0301_passport_generated.png

headshot/kakao_4817724214/
  20260621T1232_corporate_original.jpg
  20260621T1232_corporate_generated.png
```

- 국가 코드는 폴더가 아닌 Firestore user 문서에서 관리 (유저가 국가를 바꿀 수 있으므로)
- style: idphoto는 `passport`/`resume`, headshot은 `linkedin`/`corporate`/`creative`/`professional`/`dating`
- type: `original`/`generated`

### gcs-save.js 변경

```javascript
// 변경 전
export async function saveImages(userId, originalImage, generatedImage) {
  const basePath = `service/idphoto/kr/${userId}`;
  ...
}

// 변경 후
export async function saveImages(service, userId, style, originalImage, generatedImage) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const basePath = `${service}/${userId}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
  ...
}
```

### 기존 데이터 마이그레이션

- `service/idphoto/kr/{userId}/` → `idphoto/{userId}/` 이동
- `service/idphoto/kr/studio-profiles/` → 파일명에서 타임스탬프 추출, 가능한 경우 userId 매칭 후 `headshot/{userId}/`로 이동. 매칭 불가 건은 `headshot/_unmapped/`로 이동
- 마이그레이션 스크립트 별도 작성

## 6. 결제 완료 후 리다이렉트

현재 `handleTossSuccess` (payments.js:409)에서 `href="/"` 하드코딩.

변경:
1. `credits.js` — `buyToss(amount)` 호출 시 현재 페이지 경로를 쿼리 파라미터로 전달: `/credits?returnUrl=/headshot`
2. 크레딧 페이지 — 토스 결제 요청 시 `successUrl`에 `returnUrl` 포함
3. `handleTossSuccess` — 결제 완료 후 "돌아가기" 링크에 `returnUrl` 사용 (없으면 `/` 폴백)
4. Open redirect 방지: `returnUrl`이 `/`로 시작하는 상대 경로만 허용

## 7. 구현 단계

| 단계 | 내용 | 의존성 | 우선순위 |
|---|---|---|---|
| ~~P0~~ | ~~layoutNav 언어 인자화~~ | 없음 | ✅ 완료 (6/22 배포) |
| P1-a | 서버단 detectLang + 쿠키 세팅 + i18n.js 정리 | 없음 | 높음 |
| P1-b | 홈 페이지 텍스트팩 분리 | P1-a | 높음 |
| P1-c | geoip-lite 도입 + region 서버 판별 | 없음 | 높음 |
| P1-d | GCS 스키마 변경 + Studio userId 전달 | 없음 | 높음 |
| P1-e | 기존 GCS 데이터 마이그레이션 | P1-d 배포 후 | 중간 |
| P2-a | 언어 스위처 UI | P1-a | 중간 |
| P2-b | 결제 완료 returnUrl 리다이렉트 | 없음 | 중간 |
| P3 | crop localStorage → 쿠키 통합 | P1-a | 낮음 |

## 8. 연관 건

- **자체 유저 트래킹 제안서** (PROPOSAL_20260622) — 이벤트에 lang/region 포함 설계 필요
- **어드민 대시보드 결제 유저 식별** — 민아 설계 대상
- **credits.sh 로컬 환경 복원** — iMac .env 미설정으로 운영 도구 고장
