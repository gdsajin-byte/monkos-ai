---
type: order
date: 2026-07-14
device: M1
agent: 쌍아
recipient: 막내
portfolio: PF_INFRA
status: 대기
---

# 지시서: 자동화 인프라 통합 정비 — 데이터 수집 + MCP 부활 + 인벤토리 감사 + 스킬 등록

**[2026-07-14 16:14 KST]** M1/쌍아 → 막내

---

## 배경

7/14 세션에서 확인된 구조적 문제: **만들어놓고 안 돌아가는 자동화**가 4건 동시 발견.

1. **데이터 수집**: 네이버 검색광고 API 키 3종이 6/20 SM 등록 완료됐으나 호출 코드 0건
2. **MCP 사문화**: retrieval·GA4·GSC 3개 MCP가 6/21 이후 호출 0건 (크리덴셜 iMac 종속)
3. **인벤토리 밀림**: SECRET_INVENTORY.md가 6/12 이후 미갱신, SM 실제 40건 vs 인벤토리 미반영 8건+
4. **스킬 부재**: 도구가 있어도 에이전트가 안 쓰는 습관 → 강제 경로 필요

공통 원인: **1단계(설계+구축)는 완료, 2단계(운용+습관화)에서 멈춤.**
본 지시서에서 4건을 한 번에 처리한다.

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키·비밀번호 생성/추측 금지. 시크릿 값은 절대 노출 금지
- 헌법 4조 2항: 파괴적 명령 금지
- ch5 2조: 배포는 deploy.sh 경유 (daily_briefing.py는 GitHub Actions이므로 해당 없음)
- ch4 10조: 시크릿은 `secret` 커맨드 경유 (본 건은 이미 등록 완료 — 코드에서 참조만)

---

## 권한

- `.github/scripts/daily_briefing.py` 수정
- `.github/workflows/daily-briefing.yml` 수정
- `.mcp.json` 수정
- `.claude/rules/` 신규 파일 생성
- `.claude/skills/` 신규 파일 생성
- `scripts/retrieval/` 수정
- `monkos-ops/ops/SECRET_INVENTORY.md` 수정
- `scripts/` 내 감사 스크립트 신규 생성
- 워크플로우(Workflow) 사용 허가: Phase별 병렬 실행 가능
- 웹 검색 허가: API 문서 참조

---

## Phase 1: 데이터 수집 파이프라인 확장

### 1-1. daily_briefing.py 확장

기존 `daily_briefing.py`에 아래 수집 함수를 추가한다. 기존 GA4/GSC 수집 구조를 따른다.

#### 네이버 검색광고 API (키 기등록)

- 시크릿: `NAVER_SEARCHAD_API_KEY`, `NAVER_SEARCHAD_SECRET_KEY`, `NAVER_SEARCHAD_CUSTOMER_ID` (SM 기등록 6/20)
- GitHub Secrets에 동일 3건 추가 등록 필요 → **지시서 실행 전 작가님에게 요청**
- 인증: HMAC-SHA256 서명 (`X-API-KEY`, `X-Customer`, `X-Signature`, `X-Timestamp`)
- 엔드포인트: `https://api.searchad.naver.com/keywordstool`
- 수집 대상 키워드: `증명사진`, `AI 증명사진`, `여권사진`, `취업사진`, `취업사진 안경` (5개 초기 세트)
- 수집 데이터: 월간 PC/모바일 검색량, 클릭수, 클릭률, 경쟁도
- 출력: 브리핑 `## 📊 네이버 키워드` 섹션 추가

#### 네이버 DataLab API (오늘 등록)

- 시크릿: `NAVER_DATALAB_CLIENT_ID`, `NAVER_DATALAB_CLIENT_SECRET` (SM 등록 7/14)
- GitHub Secrets에 동일 2건 추가 등록 필요
- 인증: `X-Naver-Client-Id`, `X-Naver-Client-Secret` 헤더
- 엔드포인트: `https://openapi.naver.com/v1/datalab/search`
- 수집: 핵심 키워드 5개의 30일 상대 트렌드 추이
- 출력: 브리핑에 트렌드 방향(↑↓→) 1줄 요약

#### Bing Webmaster Tools API (오늘 등록)

- 시크릿: `BING_WMT_API_KEY` (SM 등록 7/14)
- GitHub Secrets에 1건 추가 등록 필요
- 인증: `?apikey={key}` 쿼리 파라미터
- 엔드포인트: `https://ssl.bing.com/webmaster/api.svc/json/`
- 수집: `GetQueryStats` (검색 성과), `GetLinkCounts` (백링크 수)
- 사이트: `https://monkos.ai/`
- 출력: 브리핑 `## 🔎 Bing 검색 성과` 섹션 추가

#### GSC 확장 (기존 키)

- 기존 `fetch_gsc()` 함수에 차원 추가:
  - `device` 차원 (모바일/데스크톱/태블릿 분리)
  - `searchAppearance` 차원 (리치 결과/FAQ 스니펫 노출)
- URL Inspection API: 상위 10 페이지의 색인 상태 확인 (`urlInspection.index.inspect`)

#### GA4 확장 (기존 키)

- 기존 `fetch_ga4()` 함수에 지표 추가:
  - `bounceRate`, `averageSessionDuration`, `screenPageViewsPerSession`
  - 디바이스 카테고리별 분리
- **Realtime API**: `properties/{id}:runRealtimeReport` — `purchase` 이벤트 존재 시 브리핑 🟢 표시

#### PageSpeed Insights API (API 활성화 완료)

- API Key: 기존 GEMINI_API_KEY (= MONKOS NEW API Key, GCP 프로젝트 공용)
- GitHub Secrets에 `PAGESPEED_API_KEY` 로 추가 등록 (또는 기존 키 재사용 판단)
- 엔드포인트: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
- 수집 대상: `https://monkos.ai/`, `https://monkos.ai/specs/kr-passport` (2 URL × 모바일+데스크톱 = 4회)
- 수집 데이터: LCP, INP, CLS (Core Web Vitals)
- 주기: 매일은 과도 → **주 2회** (월/목) 분기 또는 별도 워크플로우
- 출력: 브리핑 `## ⚡ Core Web Vitals` 섹션

### 1-2. daily-briefing.yml 수정

신규 시크릿 env 주입 추가:

```yaml
env:
  GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
  GA4_PROPERTY_ID: ${{ secrets.GA4_PROPERTY_ID }}
  GSC_SITE_URL: ${{ secrets.GSC_SITE_URL }}
  # 신규
  NAVER_SEARCHAD_API_KEY: ${{ secrets.NAVER_SEARCHAD_API_KEY }}
  NAVER_SEARCHAD_SECRET_KEY: ${{ secrets.NAVER_SEARCHAD_SECRET_KEY }}
  NAVER_SEARCHAD_CUSTOMER_ID: ${{ secrets.NAVER_SEARCHAD_CUSTOMER_ID }}
  NAVER_DATALAB_CLIENT_ID: ${{ secrets.NAVER_DATALAB_CLIENT_ID }}
  NAVER_DATALAB_CLIENT_SECRET: ${{ secrets.NAVER_DATALAB_CLIENT_SECRET }}
  BING_WMT_API_KEY: ${{ secrets.BING_WMT_API_KEY }}
```

### 1-3. GitHub Secrets 동기 (작가님 실행 필요)

아래 6건을 GitHub Secrets에 추가해야 한다. SM에서 값을 가져와 `gh secret set`으로 등록.
**지시서 실행 전에 작가님에게 요청:**

```
시크릿 동기가 필요합니다. 터미널에서 아래 6건 실행해주세요:

gcloud secrets versions access latest --secret=NAVER_SEARCHAD_API_KEY --project=monkos | gh secret set NAVER_SEARCHAD_API_KEY
gcloud secrets versions access latest --secret=NAVER_SEARCHAD_SECRET_KEY --project=monkos | gh secret set NAVER_SEARCHAD_SECRET_KEY
gcloud secrets versions access latest --secret=NAVER_SEARCHAD_CUSTOMER_ID --project=monkos | gh secret set NAVER_SEARCHAD_CUSTOMER_ID
gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_ID --project=monkos | gh secret set NAVER_DATALAB_CLIENT_ID
gcloud secrets versions access latest --secret=NAVER_DATALAB_CLIENT_SECRET --project=monkos | gh secret set NAVER_DATALAB_CLIENT_SECRET
gcloud secrets versions access latest --secret=BING_WMT_API_KEY --project=monkos | gh secret set BING_WMT_API_KEY
```

---

## Phase 2: MCP 크리덴셜 정규화 + retrieval 부활

### 2-1. .mcp.json 크리덴셜 정규화

현재 `.mcp.json`의 GA4/GSC MCP가 iMac 경로(`/Users/jeong-kyushin/...`)를 하드코딩하여 M1에서 실행 불가.

**수정 방안**: 크리덴셜 경로를 환경변수 기반으로 전환하거나, SM에서 런타임 복원하는 래퍼 스크립트 작성.

- `google-analytics` MCP: 크리덴셜 경로를 `$GOOGLE_APPLICATION_CREDENTIALS` 또는 SM에서 임시파일로 복원
- `google-search-console` MCP: 동일 처리
- 수정 후 M1에서 MCP 서버 시작 테스트

### 2-2. retrieval DB 빌드 + 자동 갱신 복구

- M1에서 `cd scripts/retrieval && npm install && node build_index.js` 실행
- mk-push.sh의 리빌드 실패 무시(`|| echo`) → 실패 시 경고 출력으로 변경
- 빌드 성공 확인: 문서 수, PF 수, 링크 수 보고

### 2-3. MCP 서버 시작 테스트

수정 후 아래 3개 MCP 서버 시작 검증:
- `monk-retrieval`: search 도구로 "PF_CITADEL" 검색
- `google-analytics`: 간단 쿼리 (최근 7일 세션 수)
- `google-search-console`: 최근 7일 클릭 수

---

## Phase 3: 인벤토리 자동 감사

### 3-1. SECRET_INVENTORY.md 즉시 갱신

SM 실제 목록 40건과 인벤토리를 대사하여 미반영 건 추가:
- BING_WMT_API_KEY (7/14, Bing WMT API, daily_briefing)
- NAVER_DATALAB_CLIENT_ID (7/14, 네이버 DataLab API, daily_briefing)
- NAVER_DATALAB_CLIENT_SECRET (7/14, 네이버 DataLab API, daily_briefing)
- RUNPOD_API_KEY (7/7, RunPod GPU 서빙, monkos-matte)
- TOSS_CLIENT_KEY (7/5, 토스 결제 클라이언트, portal)
- TOSS_SECRET_KEY_TEST (7/12, 토스 테스트 키, portal-dev)
- LEMONSQUEEZY_API_KEY_GLOBAL (6/23, LS 글로벌 결제, portal)
- LEMONSQUEEZY_WEBHOOK_SECRET_GLOBAL (6/23, LS 글로벌 웹훅, portal)
- LEMONSQUEEZY_VARIANT_SPECS_SINGLE (7/5, LS specs 단건, portal)
- AUTH_SECRET (6/12, NextAuth 세션, portal)

### 3-2. 감사 스크립트 신설

`scripts/audit_secrets.sh` 생성:
- SM 전체 목록 (`gcloud secrets list`) vs SECRET_INVENTORY.md 대사
- 미등재 시크릿 경고 출력
- mk-push.sh에서 retrieval 리빌드 후 실행되도록 연동
- 불일치 발견 시 diff를 출력하되 값은 절대 노출 금지

---

## Phase 4: 스킬 + 룰스 등록

### 4-1. `.claude/rules/mcp-tools.md` 신설

에이전트가 MCP 도구 존재를 인지하도록 rules 파일 작성:

```markdown
# MCP 도구 활용 규칙

## PF 탐색 시
- `monk-retrieval` MCP의 `search` 도구를 우선 사용하여 관련 PF·문서를 검색한다.
- grep/find로 직접 탐색하기 전에 MCP 검색을 먼저 시도한다.

## SEO/지표 데이터 필요 시
- `google-analytics` MCP로 GA4 데이터 직접 조회 가능.
- `google-search-console` MCP로 GSC 데이터 직접 조회 가능.
- daily_briefing 파일을 Read하는 것보다 MCP 직접 조회가 최신 데이터.

## 시크릿 확인 시
- `secret check <NAME>` 또는 SECRET_INVENTORY.md를 먼저 확인한다.
- "키가 없다"고 보고하기 전에 SM 실측 필수.
```

### 4-2. `.claude/skills/seo-query.md` 신설

에이전트가 SEO 데이터를 즉시 조회하는 스킬:

- `/seo-query` 호출 시:
  1. GA4 MCP로 최근 7일 세션/이벤트 조회
  2. GSC MCP로 최근 7일 클릭/노출/순위 조회
  3. 결과를 테이블로 정리해서 보고

### 4-3. `.claude/skills/secret-audit.md` 신설

- `/secret-audit` 호출 시:
  1. `gcloud secrets list` 실행
  2. SECRET_INVENTORY.md와 대사
  3. 불일치 보고

---

## 완료 기준

- [ ] daily_briefing.py에 5개 채널 수집 함수 추가 (네이버 검색광고/DataLab/Bing/GSC 확장/GA4 확장)
- [ ] daily-briefing.yml에 신규 env 6건 추가
- [ ] PageSpeed 수집 (별도 주기 또는 daily 통합)
- [ ] .mcp.json 크리덴셜 정규화 — M1에서 GA4/GSC/retrieval MCP 전부 작동
- [ ] M1 retrieval DB 빌드 + mk-push.sh 실패 가시화
- [ ] SECRET_INVENTORY.md 10건 미반영분 추가
- [ ] scripts/audit_secrets.sh 신설 + mk-push.sh 연동
- [ ] .claude/rules/mcp-tools.md 신설
- [ ] .claude/skills/seo-query.md 신설
- [ ] .claude/skills/secret-audit.md 신설
- [ ] MCP 3개 서버 M1 시작 테스트 통과
- [ ] 커밋 + 푸시
- [ ] 완료 보고 (✅❌💡⏳📁🔀 형식)
- [ ] PF_INFRA 히스토리 1행 어펜드

---

## 작가님 선행 액션

**GitHub Secrets 동기 6건** — Phase 1-3의 명령어 참조. 막내 실행 전에 완료 필요.
