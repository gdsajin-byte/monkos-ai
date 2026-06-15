---
type: order
date: 2026-06-15
from: iMac/쌍아
to: iMac/막내
subject: "발행→유통 멀티 디스트리뷰션 파이프라인 — 통합 감사·설계·구현"
status: 발행
portfolio: PF_SPREAD
links: [PF_SPECS, PF_RETRIEVAL, PF_AUTOPILOT]
---

# 지시서 — 발행→유통 멀티 디스트리뷰션 파이프라인 통합설계

> **[2026-06-15 10:57 KST] iMac/쌍아 → iMac/막내**
> 작가님 지시: 통합설계, 워크플로우·딥리서치 활용 승인, 추가분석+기존보고서 검증 포함.

---

## 배경

웹/민아 전략보고서(`REPORT_20260615_웹민아_발행유통_멀티디스트리뷰션_전략.md`)와 키미 다변화 로드맵(`~/Desktop/철창이/Kimi_Agent_다변화 로드맵.zip` → `/tmp/kimi_roadmap/report.md`)을 교차 분석한 결과, 현행 발행 플로우에 3가지 구멍을 확인했다.

**현행 진단 요약:**
1. 🔴 Google Indexing API가 JobPosting 전용 → 블로그·specs에 **헛스윙**
2. 🔴 유통이 구글 단일채널 — 네이버·빙·AI 검색에 능동 통지 **0**
3. 🟡 monk.kr robots.txt에 검색 전용 봇(OAI-SearchBot, Claude-SearchBot 등) **미등재**
4. 🟡 Cloudflare(monk.kr = CF Pages) 봇 차단 설정 **미감사**

**핵심 해법:** IndexNow 1콜 → 네이버·빙·얀덱스·Seznam·Yep 5개 엔진 동시 통지 + ChatGPT/Perplexity 간접 도달.

---

## 특별 권한 (작가님 직접 승인)

1. **워크플로우(Workflow) 기능 사용 승인** — 병렬 감사·검증·구현에 서브에이전트 활용 가능
2. **딥리서치(/deep-research) 사용 승인** — 기존 보고서 주장을 독자적으로 검증하고, 추가 발견이 있으면 보고서에 포함
3. **자체 추가분석 권한** — 지시서 범위 내에서 필요한 추가 조사를 자율 판단하여 실행 가능

---

## Phase 0 — 감사 + 딥리서치 검증 (워크플로우 병렬)

워크플로우로 다음 5축을 **병렬** 실행한다.

### A. Cloudflare 봇 차단 감사
- monk.kr(CF Pages)의 Security > Bots 설정이 AI 크롤러를 차단하는지 확인
- 키미 보고서 주장: "CF가 신규 도메인에서 AI 크롤러 기본 차단" → monk.kr에 해당하는지 실측
- 방법: `curl -A "OAI-SearchBot" https://monk.kr/` / `curl -A "PerplexityBot"` 등으로 응답 코드 확인
- CF 대시보드 접근이 불가하면 curl 실측으로 추론

### B. robots.txt + AI 크롤러 감사
- 현행 robots.txt 분석: 검색 봇 vs 훈련 봇 구분 미흡 사항 목록화
- 키미/민아 보고서 기준 필수 등재 봇:
  - ✅ 이미 있음: GPTBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Yeti
  - ❌ 누락: **OAI-SearchBot**, **Claude-SearchBot**, **Claude-User**, **Perplexity-User**, Bytespider(차단용), Meta-ExternalAgent(차단용), CCBot(차단용)
- monkos.ai 쪽 robots.txt도 확인 (Cloud Run 동적 서빙 시 어디서 제공하는지)

### C. 현행 Indexing 코드 감사
- `monkos_AI/portal/lib/cms/seo.js` — Google Indexing API 코드 분석
- `blog.js`, `translate.js`에서 `requestIndexing` 호출 패턴 분석
- 실제 응답 로그가 있다면 확인 (403/429 빈도)
- IndexNow 추가 시 코드 구조 설계안 작성

### D. sitemap 현황 교차 검증
- monk.kr/sitemap.xml — 정적 17 URL, lastmod 패턴 확인
- monkos.ai/sitemap.xml — 동적 1,584 URL, lastmod `today` 박제 여부 확인
- specs 페이지가 sitemap에 포함되는지 확인
- 언어별(ko/en/ja) URL 분포 확인
- hreflang 적용 여부 확인

### E. 딥리서치 — 기존 보고서 주장 검증 + 추가 발견

`/deep-research` 활용. 다음 핵심 주장을 독자적으로 검증:

1. **IndexNow 실효성**: "1콜로 5개 엔진 동시 전파" — 2026년 현재 실제 참여 엔진 최신 목록은?
2. **네이버 IndexNow 지원**: 민아 출처(Search Engine Land) 주장 — 실제로 네이버가 IndexNow를 받는지?
3. **Google Indexing API JobPosting 전용**: 비대상 URL에 보내면 실제로 무시하는지, 아니면 관행상 효과가 있는지?
4. **일본 Bing 36.4%**: 키미 주장 — 2026년 최신 데이터로 확인
5. **Cloudflare AI 봇 기본 차단**: Pages 환경에서도 적용되는지?
6. **Schema.org가 AI 인용률 20-30% 향상**: 키미 출처(Semrush 벤치마크) — 최신 검증
7. **추가 발견**: 위 조사 과정에서 보고서에 없는 새로운 인사이트가 있으면 보고

---

## Phase 1 — 구현

Phase 0 감사 결과를 반영하여 실행한다. 감사에서 전제가 뒤집힌 항목은 **실행 전 보고 후 대기**.

### 1-1. robots.txt 보강
대상 파일: `MONK_kr/robots.txt`

```
# AI Search Bots — 검색 인용용 (허용 필수)
User-agent: OAI-SearchBot
Allow: /

User-agent: Claude-SearchBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: Perplexity-User
Allow: /

# AI Training Bots — 훈련용 (차단)
User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Meta-ExternalAgent
Disallow: /
```

기존 GPTBot(훈련봇)의 Allow 유지/차단 여부는 딥리서치 결과에 따라 판단. 현행은 Allow.

### 1-2. IndexNow 구현
1. **키파일 생성**: `MONK_kr/{key}.txt` — IndexNow API 키 파일 배치 (키 = UUID 생성)
2. **seo.js 확장**: `requestIndexNow(url)` 함수 추가
   - 엔드포인트: `https://api.indexnow.org/indexnow`
   - POST body: `{ url, key, keyLocation, urlList }` (배치 제출 지원)
   - 에러 핸들링 + 로깅
3. **blog.js 통합**: 발행 시 `requestIndexing` 호출 직후 `requestIndexNow` 병렬 호출
4. **translate.js 통합**: 번역본 발행 시에도 IndexNow 통지
5. **specs 확장**: specs 페이지 발행/갱신 시에도 IndexNow 통지 (해당 코드 위치 분석 후)

### 1-3. Google Indexing API 정리
- `seo.js`의 `requestIndexing`에 주석 추가: JobPosting 전용이므로 블로그/specs에는 실질 효과 미확인
- **삭제하지 않음** — 관행상 효과가 있다는 의견도 있으므로, 병행 유지하되 IndexNow를 주 채널로
- 로깅 강화: 실제 응답(200 vs 403 vs 429) 비율 추적 가능하도록

### 1-4. sitemap 보강
- monk.kr/sitemap.xml: Sitemap 항목에 monkos.ai sitemap 참조 추가 검토
- monkos.ai 동적 sitemap: lastmod를 실제 수정일로 교정 (Phase 0-D 감사 결과에 따라)
- 이미 별도 지시서(`ORDER_20260614_iMac쌍아_막내_SPECS_사이트맵재정리_Phase1.md`) 존재 시 중복 방지

---

## 산출물

1. **감사 보고서**: `REPORT_20260615_막내_SPREAD_발행유통_감사결과.md`
   - Phase 0 전축 결과 + 딥리서치 검증 결과 + 추가 발견
   - `monkos-ops/ops/reports/2026-06/` 배치
2. **코드 변경**: robots.txt 보강 + IndexNow 구현 + seo.js 확장
3. **PF_SPREAD 히스토리 1행 어펜드**
4. **커밋 → 푸시**

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키 생성 시 IndexNow 키는 UUID이므로 비밀정보 아님 (공개 키). 단 GCP 관련 시크릿 건드리지 말 것
- 헌법 4조 2항: 파괴적 명령 금지
- ch5 2조: 배포 필요 시 deploy.sh 경유
- ch7 3조: 지시서 범위 밖 작업 시 보고 후 대기. 단 **추가분석·딥리서치는 본 지시서 범위 내**
- 기존 사이트맵 지시서(`ORDER_20260614...사이트맵재정리_Phase1`) 작업과 충돌 시 보고
- Cloudflare 대시보드 설정 변경은 **보고만** (실행은 쌍아/작가님)

---

## 워크플로우 실행 가이드

Phase 0을 워크플로우로 구성할 때 권장 구조:

```
Phase 0 "감사" — parallel 5축:
  A: CF 봇 차단 실측 (curl)
  B: robots.txt 분석
  C: Indexing 코드 분석
  D: sitemap 현황 분석
  E: 딥리서치 검증 (7개 주장)

Phase 1 "구현" — Phase 0 결과 반영 후 순차:
  1-1: robots.txt 보강
  1-2: IndexNow 구현
  1-3: Indexing API 정리
  1-4: sitemap 보강 (기존 지시서 확인 후)
```

딥리서치(E)가 가장 오래 걸리므로, A~D 완료 후 Phase 1의 1-1~1-3은 E와 병렬 진행 가능.
