---
type: order
date: 2026-06-11
device: iMac
from: 민아
to: 막내
via: 쌍아(검수 후 토스)
portfolio: PF_PORTAL
status: 발행
subject: "블로그 CMS — 오전 세션 잔여 3건: /admin 무인증 차단 + 색인 ping/관측성"
based_on: REPORT_20260611_iMac민아_블로그CMS진단.md
---

# [지시서] 블로그 CMS 색인·보안 잔여 3건

**[2026-06-11 13:36 KST] iMac/민아 → 막내 (쌍아 검수 경유)**

## 배경
민아 CMS 진단(`REPORT_20260611_iMac민아_블로그CMS진단`) 후 쌍아 오전 세션이 슬러그 단일화·번역토큰·SA정착·llms동적화를 처리했다. 민아 재검증 결과 **코드상 미처리 3건**이 남아 본 지시서로 발급한다. 셋 다 작은 응급 패치로 1세션 내 처리 가능.

## ⚠️ 준수 조항 (위반 가능성 높은 항목만)
- **배포는 `./deploy.sh prod` 경유만.** `gcloud run deploy`/`builds submit` 직접 금지 (ch5 2조).
- **기존 함수 재사용.** 인증은 `admin-auth.js`의 `requireAdmin`/`getAdminUser`를 쓰고 새 인증 로직 중복 구현 금지.
- **어드민 락아웃 방지.** Task 1에서 로그인 진입 경로는 가드 예외 처리(아래 명시). 누락 시 작가님 본인도 어드민 접근 불가.
- 시크릿 생성·추측·placeholder 금지 (헌법 4조 1항).

---

## Task 1 — `/admin/*` 정적 페이지 무인증 노출 차단 🔴 Critical

**현상**: `server.js:384-410` 정적 서빙이 `/admin/blog-list.html`·`blog-edit.html`·`dashboard.html` 등을 **인증 없이 그대로 서빙**한다. `/api/admin/*`는 핸들러 내부 `requireAdmin`으로 막혀 있으나 어드민 **화면 자체는 무방비** → 구조·필드·엔드포인트 정찰 노출.

**변경** (`server.js`):
1. `admin-auth.js`에서 `requireAdmin` import 추가 (현재 `handleAgentAuth`만 import — server.js:38).
2. 정적 서빙 직전(현 `server.js:385` `let filePath...` 직후, `fullPath` 계산 전후)에 가드 삽입:
   - `filePath`가 `/admin/`으로 시작하고 `.html`로 끝나면 → `if (!requireAdmin(req, res)) return;`
   - `requireAdmin`은 미인증 시 401을 이미 응답하므로 `return`만 하면 됨.
3. **로그인 진입 예외**: 어드민 로그인 페이지(현 진입 경로 확인 — `/admin/login.html` 또는 `/admin/index.html` 중 실제 로그인 UI)는 가드 제외. 실제 진입점을 코드/배포본에서 확인 후 예외 처리. (미확인 시 작업 중단·보고 — 락아웃 위험)

**검증 기준**:
- 쿠키 없는 익명 `GET /admin/blog-list.html` → 401
- 정상 어드민 세션(monkos_session 쿠키) → 200 정상 렌더
- 로그인 페이지는 익명 접근 가능(예외 동작 확인)

---

## Task 2 — `pingSitemap` 폐기 엔드포인트 제거 🔴 High

**현상**: `seo.js:22-24` `pingSitemap()`이 `https://www.google.com/ping?sitemap=...`를 호출. 이 엔드포인트는 **2023년 6월 Google이 공식 폐기**해 현재 no-op. `.catch(()=>{})`로 실패조차 은폐.

**변경** (`seo.js` + 호출부):
1. `pingSitemap` 함수 제거. 호출부(`blog.js`, `translate.js`의 `pingSitemap()` 호출·import) 정리.
2. 대체 불필요(사이트맵은 `lastmod` + GSC 등록 사이트맵으로 크롤됨). GSC Sitemaps API 자동 submit은 **이번 범위 외**(과설계 금지). 단순 제거가 정답.

**검증 기준**: `grep -rn pingSitemap lib/` 결과 0건. 빌드/기동 정상. 발행 플로우 에러 없음.

---

## Task 3 — `requestIndexing` 403/429 구분 로깅 + 일일 카운터 🟠 High (관측성)

**배경**: SA 권한은 정착(층1+2)으로 "OK" 확정됐다. 그러나 색인이 실제 도달하는지 볼 수단이 없어 "색인 멈춤" 재발 시 또 추측하게 된다. **관측성(층3)**으로 추측을 제거한다.

**현상**: `seo.js:7-20` `requestIndexing`이 성공/실패(WARN) 단순 로깅. 403(권한)·429(쿼터 초과, 일 200건) 구분 없음.

**변경** (`seo.js`):
1. `catch (e)`에서 HTTP 상태(`e.response?.status` 또는 `e.code`) 추출해 분기 로깅:
   - 403 → `[SEO] Indexing 권한거부(403): {url}` (ERROR) — 정착된 사실과 모순이므로 즉시 가시화
   - 429 → `[SEO] Indexing 쿼터초과(429): {url}` (WARN)
   - 기타 → 현행 WARN 유지
2. 모듈 스코프 일일 카운터(요청 수). 호출 시 +1, 180건 근접 시 `[SEO] Indexing 쿼터 근접 N/200` WARN. (UTC 자정 리셋 또는 단순 누적 후 로그 — 막내 판단, 과설계 금지)

**검증 기준**: 의도적 실패 주입 시 403/429가 구분 로그로 출력. 정상 발행 시 카운터 증가 로그.

> 참고: 호출부 `await` 미적용(`blog.js`, `translate.js`의 fire-and-forget)도 개선 여지가 있으나, 발행 응답 지연 트레이드오프가 있어 **본 지시서 범위 외**. 로깅 구분만으로 1차 관측성 확보.

---

## 배포 & 완료
1. 로컬 검증(기동·grep·인증 동작) 후 `./deploy.sh prod` 경유 배포.
2. prod에서 Task 1(익명 401)·Task 2(에러 없음)·Task 3(로그 출력) 스모크.
3. COMPLETION 보고서(`completions/2026-06/`) + 세션 로그 어펜드 + PF_PORTAL 히스토리 1행.
4. 커밋(`[fix]` 또는 `[security]`) → 푸시.

## 범위 외 (후속 별건)
- AGENT_API_KEY `.includes()` → `timingSafeEqual` (admin-auth.js:23,52)
- `decodeURIComponent` try/catch (server.js:306,317)
- 일회성 스크립트 6종 `scripts/archive/` 격리 + server.js 301 하드코딩 9곳 데이터화

— 끝 —
