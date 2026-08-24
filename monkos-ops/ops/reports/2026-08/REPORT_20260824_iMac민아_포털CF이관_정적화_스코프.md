---
type: report
date: 2026-08-24
device: iMac
agent: 민아
subject: "specs·포털 CF 이관 + 정적페이지화 스코프 검토"
status: 제출
portfolio: PF_SPECS, PF_PORTAL
---

# specs·포털 CF 이관 + 정적페이지화 — 스코프 검토

**[2026-08-24 13:30 KST]** iMac/민아 → 작가님

> 목적: monkos.ai 포털(Cloud Run SSR)의 정적 성격 페이지를 Cloudflare 엣지로 이관하는 범위·방식·단계·리스크 산정. **본 문서는 스코프 검토이며 실행 지시서가 아님** (실행은 쌍아 지시서 경유).

---

## 1. 현황 실측 (2026-08-24)

| 항목 | 실측값 |
|---|---|
| monkos.ai DNS | **이미 Cloudflare 네임서버** (bob/edna.ns.cloudflare.com) — 단 **DNS-only(회색)**, 응답 서버 `Google Frontend` = CF 프록시 미경유 |
| 포털 prod | `monkos-portal` 1Gi/1CPU, **MIN_INSTANCES=1 (웜 상시)**, max 5 |
| specs 규모 | specs-data.json **429키 × 6언어(ko/en/ja/es/id/vi) = 2,574 상세 페이지** + 리스트 6 + 사이트맵 8종 |
| blog | 223 URL (Firestore CMS) |
| 페이지 무게 | 상세 1p = 58KB raw / 17KB gzip → 전량 ≈ 150MB (CF Pages 한도 내: 파일 2.6k/20k, 파일당 25MB) |
| specs 렌더러 | `render-specs.js` **Firestore 의존 0** — specs-data.json + i18n 순수 파일 기반 |
| 유저별 동적 요소 | **없음** — layoutShell에 세션/쿠키 분기 없음, 로그인 상태는 클라이언트 JS. specs 페이지는 전 유저 동일 HTML = 캐시/정적화 완전 적합 |
| 페이지 내 API 의존 | 퍼널 위젯(specs-funnel.js)이 `/api/idphoto/precheck·generate·fit`, `/api/payments/*`, `/api/credits`, `/api/download/*` 호출 — **same-origin 쿠키 전제** |
| 301 체계 | 규칙 기반 (COUNTRY_SLUG_TO_ISO 60 + TYPE_ALIASES 4 + REDIRECT_MAP) — 열거 가능 |
| 캐시 버스트 | `ASSET_VER = K_REVISION` (Cloud Run 리비전) — 정적화 시 대체 버전 체계 필요 |
| SSG 제약 | render-specs.js import 시 `PROJECT_ID` 필수 env (config.js 가드) + `(req,res)` 핸들러 시그니처 — 빌드 스크립트에서 env 주입 + res 목킹 필요 |

**동기 정합**: idphoto-kr 실측(요청 86% 봇 스캔)과 동일 구조 — SSR 웜 인스턴스가 봇+정적 트래픽에 소진 중. specs는 AI 인용 48%의 SEO 자산이라 TTFB·가용성이 곧 자산 가치.

---

## 2. 아키텍처 판정

### 전제: 도메인 분리(specs.monkos.ai 등)는 배제
URL 자산(/specs/* 색인·AI 인용·hreflang 체계)이 monkos.ai 경로에 축적됨. 서브도메인 이전 = SEO 자산 리셋. **동일 URL 유지가 절대 조건.**

### 채택 구조: CF 프록시 전면 + Worker 라우터 (경로 기반 분기)
```
유저 → Cloudflare (프록시 ON)
        ├─ /specs/* /{lang}/specs/* → 정적 자산 (Workers Assets) ← SSG 빌드 산출물
        ├─ /sitemap-specs*.xml, llms.txt → 정적 자산
        └─ 그 외 전부 (/api/*, /auth/*, /admin/*, blog, home…)
              → Cloud Run 오리진 (monkos-portal run.app URL로 fetch)
```
- same-origin 유지 → 퍼널 API·크레딧 쿠키 **무수정 동작**
- 캡 300/일·생성·결제 게이트는 전부 API 측 → 정적화 영향 0
- ⚠️ **도메인 매핑 → Worker 오리진 전환 주의**: CF 프록시(주황)를 켜면 Google 관리형 인증서 갱신이 깨질 수 있음. Worker가 `*.run.app` URL로 직접 fetch하는 방식으로 도메인 매핑 의존을 제거하는 것이 정석. 전환 순서 설계 필수 (섹션 4 Phase 0→1).

---

## 3. 이관 대상 판정표

| 표면 | 데이터원 | 판정 | 방식 |
|---|---|---|---|
| specs 상세 2,574p + 리스트 6p | 파일 (specs-data.json) | ✅ **1차 정적화** | SSG 빌드 → Workers Assets |
| sitemap-specs 6종 + llms.txt | 파일 | ✅ 1차 | 빌드 산출물 |
| specs 301 (구 슬러그) | 규칙 (열거 가능) | ✅ 1차 | 빌드 시 리다이렉트 목록 생성 → Worker 처리 |
| blog 223p + 리스트 | Firestore CMS | 🟡 **2차** | 어드민 발행 시 재빌드 훅 필요 — 구조 신설 |
| home / faq / gallery / board / pricing | Firestore CMS | 🟡 2차 이후 | blog와 동일 패턴. board는 쓰기 있어 후순위 |
| headshot / crop / admin / auth / api 전체 | 동적 | ❌ 이관 불가 | Cloud Run 존치 |
| /guide, 정적 public/* | 파일 | ✅ 1차 부수 | 그대로 자산 승격 |

---

## 4. 단계 스코프

### Phase 0 — CF 프록시 전환 + 엣지 캐시 (코드 무수정, 즉효)
- monkos.ai(+필요 서브도메인) 프록시 ON, SSL Full(strict), `/specs/*` Cache Rule (Edge TTL, Cache Everything)
- **오리진 인증서 전략 확정이 선행 게이트** (도메인 매핑 유지 여부 vs Worker 프록시 선행)
- 효과: TTFB 즉감 + 오리진 히트 급감 → **웜 해제 여부 판단용 실측 데이터 확보**
- 리스크: 캐시 퍼지 체계(specs-data 갱신 시), Toss/Lemon 웹훅·OAuth 콜백 CF 통과 검증 필수
- 공수: 설정 + 검증 0.5~1일 (지시서 1건)

### Phase 1 — specs SSG 정적화 (본 건의 핵심)
1. **빌드 스크립트** `portal/tools/specs-ssg/`: render-specs.js를 res 목킹으로 호출 → 2,574 HTML + 리스트 + 사이트맵 + 리다이렉트 목록 출력. ASSET_VER → 빌드 해시로 대체
2. **Worker 라우터**: 정적 자산 우선 매칭, 미스 시 run.app 오리진 폴백 (신규 spec 추가 직후 빌드 전 공백도 폴백이 흡수 — 무음 강등 아닌 설계상 안전망)
3. **배포 파이프라인**: specs-data.json·렌더러 변경 → 재빌드·재배포 (deploy.sh 체계 준수, ch5)
4. **검증 게이트**: 정적본 vs SSR본 diff 샘플링(언어×대륙별), 301 전수 curl, hreflang/canonical, 퍼널 E2E(생성→결제 1루프), GSC 색인 모니터링 7일
- 공수: 2~3일, 지시서 2~3건 분할 (빌드 스크립트 / Worker+배포 / 검증)

### Phase 2 — CMS 표면 (blog·home·faq) 정적화 [별건 분리 권고]
- 어드민 저장 → 재빌드 훅 구조 신설 필요. specs와 달리 **발행 이벤트 연동**이 본질
- Phase 1 안정화 + 실측 후 착수 판단

### Phase 3 — 포털 웜 해제 판단
- Phase 1 이후 오리진 트래픽 실측 → `MIN_INSTANCES 1→0` 검토 (idphoto-kr 웜 해제와 동일 절차, **작가님 승인 게이트**)
- 기대 절감: 월 ~3.6만원 (idphoto-kr 동급 리소스 기준) + 콜드스타트 노출은 API 호출 시점만

---

## 5. 리스크 대장

| # | 리스크 | 등급 | 대응 |
|---|---|---|---|
| R1 | CF 프록시 전환 시 Google 관리형 인증서 갱신 실패 | 🔴 | Worker→run.app 오리진으로 도메인 매핑 의존 제거. 전환 순서를 지시서에 명시 |
| R2 | OAuth 콜백(Google/Kakao/LINE)·결제 웹훅(Toss/Lemon) CF 경유 이상 | 🔴 | Phase 0에서 dev 도메인 선행 검증 + WAF 예외 목록 |
| R3 | SSR page_view 트래킹 소실 (정적 페이지는 오리진 미도달) | 🟡 | 대시보드 유입 지표 소스 전환 (CF Analytics/GA4) — 지표 단절 사전 고지 |
| R4 | 정적본·SSR본 이원화 기간의 정합성 (정본 단일 원칙, 헌법 3조 4항) | 🟡 | 렌더 코드는 단일 정본 유지(SSG가 동일 렌더러 호출), 산출물만 이중화. 빌드 자동화로 드리프트 차단 |
| R5 | specs-data 갱신 → 캐시/정적본 미반영 | 🟡 | 빌드 파이프라인에 퍼지 포함, 폴백 라우팅이 공백 흡수 |
| R6 | V1 레거시 18slug (isV2Spec 게이트) 정적화 시 회귀 | 🟡 | 검증 게이트에 V1 slug 전수 포함 (7/16 잠복 500 전례) |

---

## 6. 권고

1. **Phase 0 즉시 착수 가치 높음** — 코드 무수정·가역적이며, Phase 1·3의 판단 데이터를 만든다.
2. Phase 1은 **렌더러 재작성 없이 기존 render-specs.js를 빌드 타임에 호출**하는 방식이 정본 단일 원칙에 부합 (렌더 로직 포크 금지).
3. Phase 2(CMS 표면)는 본 스코프에서 **분리** — 발행 훅이라는 별개 구조 문제.
4. 실행 시 쌍아 지시서 경유 (경로①). 본 보고는 설계 입력 자료.
