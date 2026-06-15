---
type: design
date: 2026-06-15
device: iMac
agent: 쌍아
portfolio: PF_SPREAD
links: [PF_SPECS, PF_RETRIEVAL, PF_OPUS, PF_CITADEL, PF_AUTOPILOT]
status: 진행
---

# GEO 강화 로드맵 — 발행→유통→색인→AI인용 전 구간

> **[2026-06-15 13:33 KST] iMac/쌍아**
> 원천: 작가님 지시("발행이 구글에만 알리는 로직 — 네이버·AI에도") + 웹/민아 전략보고서 + 키미 다변화 로드맵 교차 분석 + 막내2 감사·구현 결과

---

## 0. 한 줄

**발행 1건이 구글·네이버·빙·AI 검색까지 자동으로 도달하는 파이프라인을 완성한다.**

---

## 1. 현재 위치 (6/15 기준)

### 이미 있는 것
- ✅ 동적 sitemap (index 분할 완료, lastmod today 박제 해소)
- ✅ llms.txt 58행 (AI 검색 발견용)
- ✅ robots.txt 검색봇 5종 허용 + 훈련봇 3종 차단 (양 도메인, 코드 완료)
- ✅ IndexNow 구현 (seo.js, blog.js·translate.js 3곳 통합, 코드 완료)
- ✅ Google Indexing API (기존 유지, JobPosting 전용이나 병행)
- ✅ OG 이미지 자동 생성
- ✅ JA·EN 자동 번역 + GitHub Issues(SPREAD 트리거)
- ✅ CF 대시보드 봇 차단 OFF 확인 (monk.kr)
- ✅ 구조화 데이터 P0 — JSON-LD 언어 분기 코드 결함 수정 완료 (Article inLanguage, HowTo locField)

### 아직 없는 것
- ❌ monkos.ai 배포 (IndexNow·robots 코드가 prod에 안 올라감)
- ❌ specs 다국어 데이터 커버리지 (validity 4%, fileSpec 5%)
- ❌ JSON-LD 전면 적용 (Article·FAQPage·Organization·BreadcrumbList 누락 페이지)
- ❌ 콘텐츠 분류 (내수/글로벌 구분 없이 전부 번역·배포)
- ❌ AI 인용 측정
- ❌ 네이버 서치어드바이저 sitemap 등록 확인

---

## 2. Phase 로드맵

### P0 — 통지 파이프라인 마감 `진행 중`

> 발행 시 5개 검색엔진에 자동 통지 + 기존 결함 해소

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| IndexNow 코드 구현 | ✅ | 막내2 (6/15) | seo.js 확장 |
| robots.txt 보강 (양 도메인) | ✅ | 막내2 (6/15) | 검색봇 5종 + 훈련봇 3종 |
| sitemap index today 박제 해소 | ✅ | 막내2 (6/15) | render-sitemap.js |
| monk.kr sitemap .html 308 해소 | ✅ | 막내2 (6/15) | sitemap.xml |
| CF 봇 차단 확인 | ✅ | 작가님 (6/15) | Do not block 확인 |
| **monkos.ai 배포** | ⏳ | **막내1 실행 중** | deploy.sh 경유, specs 다국어와 동시 |
| **specs 다국어 데이터 보강** | ⏳ | **막내1 실행 중** | validity·fileSpec·headHeight EN/JA |
| 네이버 서치어드바이저 sitemap 등록 확인 | ❌ | 쌍아/작가님 | 수동 확인 필요 |
| Bing WMT sitemap 등록 확인 | ❌ | 쌍아/작가님 | 수동 확인 필요 |

**P0 완료 조건:** monkos.ai 배포 후 블로그 1편 발행 → IndexNow 200 응답 로그 확인.

---

### P1 — 구조화 데이터 + AEO 레이어 `미착수`

> AI 검색이 우리 콘텐츠를 "인용할 만한 구조화된 정보원"으로 인식하게 만든다

| 항목 | 대상 | 효과 |
|------|------|------|
| Article/BlogPosting JSON-LD 전면 | 블로그 전 페이지 | datePublished·author·inLanguage → AI 신선도·권위 신호 |
| Organization JSON-LD | 전역 | 브랜드 엔티티 확립 |
| BreadcrumbList JSON-LD | 전역 | 사이트 계층 구조 → AI 맥락 파악 |
| FAQPage JSON-LD | specs 하위 페이지 | 대화형 검색 인용 (ChatGPT·Perplexity) |
| HowTo JSON-LD 보강 | specs 상세 | 절차적 답변 추출 (이미 일부 있음, 전면화) |
| llms.txt 강화 | 전역 | specs 카탈로그 + 서비스 구조 반영 |
| 신선도 루프 | specs·핵심 글 | 갱신일 실 반영 → Perplexity 30일 재인용 |

**P1 완료 조건:** Rich Results Test 통과 + GSC Enhancements 에러 0.

---

### P2 — 콘텐츠 분류 + 배포 라우팅 `미착수`

> 발행 시 "이건 내수, 이건 글로벌"을 자동 판단해 번역·배포 범위를 결정

| 항목 | 내용 |
|------|------|
| `distribution` 필드 | blog.js 발행 시 `local` / `global` 선택 |
| local 경로 | 번역 없음, 네이버 최적화만, SPREAD 스킵 |
| global 경로 | JA·EN 자동번역 + IndexNow + GitHub Issues(SPREAD) |
| 자판기 연동 | 루틴이 초안 생성 시 콘텐츠 전략(P1~P4) 기반 자동 태깅 |
| PF 연결 | PF_OPUS(생산) → distribution 필드 → PF_SPREAD(배포) 인터페이스 |

**P2 완료 조건:** 내수형 글 발행 시 번역 미작동 + 글로벌 글 발행 시 전채널 배포 확인.

---

### P3 — 신디케이션 + 실시간 푸시 `미착수`

> 발행이 자기 사이트를 넘어 외부 플랫폼까지 자동 확산

| 항목 | 내용 | PF 연계 |
|------|------|---------|
| WebSub (RSS 실시간 푸시) | RSS 구독 생태계 즉시 전파 | PF_SPREAD |
| canonical 크로스포스팅 | Medium·LinkedIn·X·note (DISTRIBUTION_SCHEMA R1~R4) | PF_SPREAD |
| 네이버 C-Rank 최적화 | 외부유입·체류 3분+ → 순위 향상 | PF_CITADEL |
| Reddit 시드 | Perplexity 최다 인용 소스 (46.7%) | PF_SPREAD R5 |

---

### P4 — 측정 + 자동화 `미착수`

> 발행→인용까지 전 구간 측정 + AUTOPILOT 편입

| 항목 | 내용 | PF 연계 |
|------|------|---------|
| AI 인용 추적 | 정기 쿼리로 monkos.ai 인용 여부 모니터링 | PF_AUTOPILOT |
| 발행→색인 리드타임 KPI | IndexNow 제출 → 색인 확인까지 소요일 | PF_AUTOPILOT |
| 엔진별 색인 수 baseline | 구글 302→?, 빙·네이버 0→? | GA4/GSC |
| 팬아웃 자동화 | 발행 이벤트 → 통지·배포·측정 전체 Routines 편입 | PF_AUTOPILOT |

---

## 3. PF 간 연결 맵

```
PF_OPUS (생산 메타)
  ├─ 콘텐츠 전략 (필러×톤×믹스)
  ├─ 자판기 (루틴 → 초안 → CMS 드래프트)
  │
  ▼ distribution: local|global (P2에서 신설)
  │
PF_SPREAD (배포)
  ├─ DISTRIBUTION_SCHEMA (R1~R5 채널 라우팅)
  ├─ IndexNow 통지 (P0 ✅)
  ├─ 자동번역 (global만)
  ├─ GitHub Issues → 채널 변환
  │
  ▼
PF_CITADEL (유입·SEO)           PF_SPECS (자산)
  ├─ sitemap·색인              ├─ specs-data.json (445국 규격)
  ├─ 구조화 데이터 (P1)         ├─ 다국어 번역 데이터
  ├─ 네이버 C-Rank              ├─ JSON-LD (HowTo·FAQPage)
  │                             │
  ▼                             ▼
PF_AUTOPILOT (측정·자동화)
  ├─ AI 인용 추적
  ├─ 색인 리드타임
  └─ 팬아웃 Routines
```

---

## 4. 소스 인덱스

| 문서 | 내용 |
|------|------|
| [웹민아 전략보고서](../../reports/2026-06/REPORT_20260615_웹민아_발행유통_멀티디스트리뷰션_전략.md) | 10축 리서치, IndexNow 핵심 제안, 4-Phase 원안 |
| [막내2 감사보고서](../../reports/2026-06/REPORT_20260615_iMac막내2_SPREAD_발행유통_감사결과.md) | 코드 실측 + 딥리서치 7개 주장 검증 |
| 키미 다변화 로드맵 | `~/Desktop/철창이/Kimi_Agent_다변화 로드맵.zip` — 국가별 점유율·GEO·AI 크롤러 상세 |
| [사이트맵 재정리 제안](../../proposals/PROPOSAL_20260614_웹민아_사이트맵재정리_색인복구.md) | sitemap index 분할·lastmod 정확성 |
| [specs 구조화 데이터 감사](../../reports/2026-06/REPORT_20260614_iMac막내2_SPECS_구조화데이터_언어분기감사.md) | 1,335페이지 전수 감사 결과 |
