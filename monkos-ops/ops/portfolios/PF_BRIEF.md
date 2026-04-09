---
type: portfolio
id: PF_BRIEF
name: BRIEF
subject: 매일 자동 브리핑 — 성과 보고 + SEO 교정 + 외부 뉴스를 한 장으로
created: 2026-04-10
owner: 작가님
leads: 쌍아(설계), 민아(진단·브리핑)
status: active
---

# PF_BRIEF — 데일리 자동 브리핑

> 작가님이 세션을 열면 한 장이 올라와 있다.
> GSC/GA4/Ads 성과, SEO 교정 사안, 정부자금 공고, 기술 뉴스 — 전부 한 장.
> 작가님은 읽고 판단만 한다.

---

## 1. 비전

**"출근하면 오늘 필요한 판단 재료가 이미 한 장으로 정리되어 있다"**

### 왜 이것을 하는가

- **현재**: 오전 세션 = GSC 열고, GA4 열고, Ads 열고, 이슈 찾고, 교정 지시하고 → 오전 통째로 소모
- 4/10 아침이 정확히 그 패턴 — HEAD 404 발견, sitemap 모순 발견, crop hreflang 누락 발견 → 전부 수동
- 패턴은 잡혔다. 반복되는 진단은 자동화 대상
- **목표**: 에이전트가 새벽에 자동 수집·진단 → 아침 브리핑 한 장 → 작가님은 판단과 지시만

### 브리핑 3축

| 축 | 내용 | 현재 (수동) | 목표 (자동) |
|----|------|------------|-----------|
| **성과** | GSC 클릭/노출, GA4 유입/전환, Ads 비용/CPA | 민아가 매번 접속+분석 | 매일 자동 추출+전일 비교 |
| **교정** | SEO 이슈 (404, noindex, hreflang, CWV) | 막내 CDP 수동 진단 | 매일 자동 순회+이슈 감지 |
| **뉴스** | 정부자금, AI 모델, GitHub, 업계 동향 | 작가님 수동 발견 | 매일 자동 크롤링+필터 |

### 수혜 PF

| 브리핑 항목 | 수혜 PF |
|-------------|---------|
| GSC/GA4 성과 | CITADEL, 전체 |
| SEO 교정 이슈 | CITADEL, PORTAL |
| Ads 비용/CPA | CITADEL, PHOTOPRO |
| 정부자금 공고 | PRESENTATION, 사업 전체 |
| AI 모델/도구 | CDP, PORTAL, PHOTOPRO |
| GitHub 릴리즈 | CDP |
| 업계 뉴스 | SPREAD (콘텐츠 소재) |

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| 데일리 브리핑 발행 | 0 | 매일 1건 | 매일 자동 (무인) |
| 오전 세션 진단 시간 | 1시간+ (수동) | 30분 (반자동) | 10분 (브리핑 확인만) |
| SEO 이슈 발견→대응 | 수일 | 당일 | 자동 감지+지시서 초안 |
| 정부자금 발견 리드타임 | 수일 | 당일 | 공고 당일 알림 |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 04/10 | 작가님 | 구상 — 뉴스 크롤링 + 세션 브리핑 (PF_NEWS) | — | ✅ |
| 04/10 | 쌍아 | PF_NEWS 발족 + Phase 0 설계 | PF_NEWS.md | ✅ |
| 04/10 | 작가님 | **PF 격상** — 뉴스 한정 → 성과+교정+뉴스 통합 브리핑. PF_NEWS → PF_BRIEF | — | ✅ |
| 04/10 | 쌍아 | PF_BRIEF 재작성 — 브리핑 3축(성과/교정/뉴스), /schedule 원격 cron 활용 | PF_BRIEF.md | ✅ |

---

## 3. Phase 현황

### Phase 0 — 설계 + PoC ⏳ 진행 중

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 브리핑 3축 소스 확정 | ⏳ | 쌍아 | 아래 §4 초안 |
| 브리핑 md 템플릿 확정 | ⏳ | 쌍아 | 아래 §5 초안 |
| /schedule 원격 cron PoC (1소스) | ❌ | 막내 | 정부자금 또는 GSC |
| 적립 경로 확정 | ⏳ | 쌍아 | `monkos-ops/ops/briefings/` |
| MCP 도구 확인 (GSC/GA4) | ❌ | 쌍아 | GA4/GSC MCP 가동 상태 확인 |

### Phase 1 — 핵심 자동화

| 항목 | 상태 |
|------|------|
| **[성과] GSC 일일 성과** (클릭/노출/순위/색인) | ❌ |
| **[성과] GA4 일일 성과** (유입/전환/이탈률) | ❌ |
| **[교정] SEO 자동 순회** (HEAD/hreflang/canonical/404) | ❌ |
| **[뉴스] 정부자금** (기업마당/TIPA/소진공) | ❌ |
| **[뉴스] AI 모델/API** (Anthropic/Google) | ❌ |

### Phase 2 — 확장

| 항목 | 상태 |
|------|------|
| [성과] Ads 비용/CPA 자동 추출 | ❌ |
| [교정] CWV (Core Web Vitals) 모니터링 | ❌ |
| [뉴스] GitHub 릴리즈 (MCP/Playwright) | ❌ |
| [뉴스] 업계 종합 (TechCrunch/SEJ) | ❌ |
| 경쟁사 모니터링 | ❌ |
| 주간 종합 리포트 | ❌ |
| 텔레그램 알림 연동 | ❌ |

---

## 4. 소스 목록 (초안)

### 축1: 성과

| 소스 | 방법 | 주기 | 추출 항목 |
|------|------|------|----------|
| Google Search Console | GSC MCP 또는 API | 매일 | 클릭/노출/CTR/순위, 색인 상태, 에러 |
| Google Analytics 4 | GA4 MCP 또는 API | 매일 | 유입(오가닉/paid/direct), 전환, 이탈률, 국가별 |
| Google Ads | Ads API 또는 CDP | 주 3회 | 비용, CPA, 클릭, 노출, 캠페인별 |

### 축2: 교정

| 항목 | 방법 | 주기 | 감지 대상 |
|------|------|------|----------|
| HEAD 응답 점검 | curl 전 페이지 | 매일 | 200 아닌 페이지 |
| hreflang 정합성 | CDP 순회 | 주 2회 | 누락/불일치 |
| canonical 정합성 | CDP 순회 | 주 2회 | 경로 불일치 |
| sitemap ↔ noindex 모순 | sitemap 파싱 + meta 체크 | 주 1회 | 충돌 URL |
| 404 모니터링 | GSC 데이터 | 매일 | 신규 404 |

### 축3: 뉴스

| 소스 | URL/방법 | 주기 | 필터 |
|------|----------|------|------|
| 기업마당 | bizinfo.go.kr | 매일 | AI/SW/소상공인/창업 |
| TIPA | tipa.or.kr | 매일 | R&D/혁신바우처 |
| 소진공 | semas.or.kr | 매일 | 직접대출/정책자금 |
| Anthropic Blog | anthropic.com/news | 매일 | 모델/API/SDK |
| Google AI Blog | blog.google/technology/ai | 매일 | Gemini/Vertex |
| GitHub Releases | API (starred repos) | 매일 | MCP, Playwright, Claude Code |
| HuggingFace Trending | huggingface.co | 매일 | 한국어 모델 |
| TechCrunch AI | techcrunch.com | 매일 | AI 서비스 |
| Search Engine Journal | searchenginejournal.com | 주 2회 | SEO/구글 업데이트 |

---

## 5. 브리핑 형식 (설계)

### 스케줄

```
매일 05:00 KST → /schedule 원격 에이전트 실행
  → 축1: GSC/GA4 API 데이터 추출 + 전일 비교
  → 축2: SEO 자동 순회 (HEAD/hreflang/canonical)
  → 축3: 뉴스 크롤링 + 필터링
  → 브리핑 md 생성 → git commit + push
  → 세션 시작 시 git pull로 자동 수신
```

### 브리핑 템플릿

```markdown
---
type: briefing
date: 2026-04-11
generated: auto (PF_BRIEF)
---

# 데일리 브리핑 2026-04-11

## 📊 성과 (전일 vs 전주 동요일)
| 지표 | 어제 | 전주 | 변동 |
|------|------|------|------|
| GSC 클릭 | 12 | 7 | +71% |
| GSC 노출 | 245 | 180 | +36% |
| GA4 오가닉 | 15 | 8 | +87% |
| GA4 전환 | 2 | 1 | +100% |
| Ads 비용 | ₩12,000 | ₩15,000 | -20% |

## 🔧 교정 (자동 감지)
- ✅ HEAD 응답: 전 페이지 200 — 이상 없음
- ⚠️ GSC 신규 404: `/ja/blog/old-slug` 1건 — 301 추가 필요

## 🔴 긴급 (즉시 대응)
- [정부자금] 소진공 직접대출 접수 마감 D-2

## 🟠 주목 (금주 내 검토)
- [모델] Claude 4.7 Haiku 출시 — 비용 30% 절감
- [GitHub] Playwright MCP v1.2 릴리즈 — 신규 도구 5개

## 🟡 참고
- [뉴스] TechCrunch: AI 증명사진 시장 $2B 전망
```

### 적립 경로

```
monkos-ops/ops/briefings/
  BRIEFING_20260411.md
  BRIEFING_20260412.md
  ...
```

---

## 6. 복기

### 교훈 0: 4/10 아침 세션이 PF_BRIEF의 기원 (04/10)

**현상**: 오전 세션 전체가 SEO 진단+보정에 소모됨 (HEAD 404, sitemap 모순, hreflang 누락 등)
**원인**: 매번 수동으로 접속→진단→발견→지시서→실행. 반복 패턴인데 자동화 안 됨.
**대응**: 패턴이 잡힌 시점에 자동화 전환. 진단 항목을 정형화하여 매일 자동 순회 → 이슈만 보고.

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| GSC/GA4 API 권한 미설정 | 높음 | SA 권한 부여 선행 필요 (작가님 GCP) |
| 크롤링 차단 (rate limit/봇) | 중 | RSS/API 우선, WebFetch 간격 조절 |
| 과잉 정보 (노이즈) | 높음 | 키워드 필터 + 긴급도 3단계 분류 |
| /schedule 원격 실행 제약 | 중 | PoC로 실측 후 대안 검토 |
| 브리핑 품질 불안정 | 중 | Phase 0에서 수동 1회 → 자동 전환 |
