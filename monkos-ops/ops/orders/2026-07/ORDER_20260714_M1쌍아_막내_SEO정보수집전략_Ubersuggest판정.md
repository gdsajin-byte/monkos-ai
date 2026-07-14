---
type: order
date: 2026-07-14
device: M1
agent: 쌍아
recipient: 막내
portfolio: PF_CITADEL, PF_SPECS
status: 대기
---

# 지시서: SEO/GEO 정보수집 전략 수립 + Ubersuggest MCP 연결 판정

**[2026-07-14 14:41 KST]** M1/쌍아 → 막내

---

## 목적

MONKOS의 SEO/GEO 전략을 데이터 기반으로 운용하기 위해, 현재 활용 가능한 정보수집 채널을 전수 조사하고, Ubersuggest MCP 연결이 필요한지 판정한다.

**두 축**:
1. **Ubersuggest 생태계 전수 분석** — MCP 37개 도구 전량 파악, 우리 코드로 대체 가능한 영역 vs Ubersuggest만 제공하는 고유 데이터 판별
2. **SEO/GEO 정보수집 채널 전략** — Google·네이버·Bing 등 필수 채널별 API·자동화 경로 종합 설계

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키·비밀번호 생성/추측 금지. 시크릿 필요 시 보고
- 헌법 4조 3항: 내부 기술 스택 상세 외부 유출 금지. 보고서는 내부 전용
- ch7: 범위 밖 작업 금지. 본 건은 **리서치+설계만** — MCP 연결 실행, 코드 작성은 범위 밖

---

## 권한

- **워크플로우(Workflow) 사용 허가**: 병렬 리서치 에이전트 활용하여 채널별 동시 조사 가능
- 웹 검색(WebSearch/WebFetch) 무제한
- 프로젝트 코드 읽기 (현행 GSC/GA4 수집 코드 확인용)

---

## 작업 내용

### Phase 1: Ubersuggest MCP 전수 분석

#### 1-1. MCP 도구 37개 전량 목록화

Ubersuggest MCP 서버(`https://ubersuggest-mcp.neilpatelapi.com/mcp`)가 제공하는 도구를 전수 파악한다.

- 공식 문서, MCP 페이지(app.neilpatel.com/en/mcp), 블로그, 리뷰에서 37개 도구의 이름·기능·입출력 확인
- 카테고리별 분류: 도메인 분석 / 키워드 리서치 / 백링크 / 사이트 감사 / 경쟁 분석 / AI 가시성 / 기타

#### 1-2. 대체 가능성 판정

각 도구에 대해 아래 기준으로 판정:

| 판정 | 의미 |
|------|------|
| **자체 대체 가능** | Google/네이버 공식 API로 동일 데이터 확보 가능 |
| **부분 대체** | 유사 데이터는 있으나 깊이·범위가 다름 |
| **Ubersuggest 고유** | 다른 무료/저비용 경로로 얻을 수 없는 데이터 |

판정 시 비교 대상:
- GSC API (현재 사용 중)
- GA4 API (현재 사용 중)
- Google Ads 키워드 플래너 API
- 네이버 검색광고 API (키워드 도구)
- 네이버 서치어드바이저 API
- Bing Webmaster Tools API
- 무료 대안 도구 (Google Trends, AnswerThePublic 등)

#### 1-3. 비용 대비 가치 산정

- Ubersuggest 무료 크레딧(현재 10개)으로 가능한 범위
- Individual 플랜($80/년)에서 추가되는 것
- MCP 연결 시 크레딧 소모 구조 (조회당 크레딧 차감 여부)

### Phase 2: SEO/GEO 정보수집 채널 전략

#### 2-1. 채널별 전수 조사 (워크플로우 병렬 실행)

각 채널에 대해 동일 포맷으로 조사:

**Google 채널군**:
- GSC API — 현행 수집 범위, 미수집 데이터, 쿼리 한도(25,000행), 래그
- GA4 Data API — 현행 수집 범위, 퍼널·이벤트·경로 데이터
- Google Ads 키워드 플래너 API — 접근 방법(Ads 계정 필요 여부), 검색량 정밀도(광고 집행 유무에 따른 차이), 자동화 가능성
- Google Trends API (비공식) — 데이터 형태, 자동화 경로
- Google Business Profile API — 게시물·리뷰·인사이트 자동 수집

**네이버 채널군**:
- 네이버 검색광고 API (키워드 도구) — 한국 검색 시장 63% 커버, 월간 검색량·경쟁도·CPC, API 접근 방법
- 네이버 서치어드바이저 API — 사이트 등록·색인 상태·검색 노출 데이터
- 네이버 데이터랩 — 트렌드·검색어 통계

**기타 채널**:
- Bing Webmaster Tools API — 일본 시장 Bing 36% 급등 감안
- AnswerThePublic — 질문형 키워드 수집
- Google PageSpeed Insights API — Core Web Vitals

#### 2-2. 현행 코드 확인

프로젝트 내 현재 GSC/GA4 수집 코드를 확인하고 수집 범위를 매핑한다:
- `scripts/` 내 수집 스크립트
- GitHub Actions 워크플로우 (.github/workflows/)
- PF_AUTOPILOT 수집 파이프라인

#### 2-3. 자동화 가능성 매트릭스

| 채널 | API 존재 | 인증 방식 | 무료 한도 | 자동화 난이도 | 우선순위 |
|------|---------|----------|----------|-------------|---------|

---

## 산출물

1. **`REPORT_20260714_M1막내_Ubersuggest_MCP_전수분석.md`**
   - 37개 도구 목록 + 대체 가능성 판정표
   - 연결 권고/비권고 + 근거

2. **`REPORT_20260714_M1막내_SEO_GEO_정보수집전략.md`**
   - 채널별 조사 결과 + 자동화 매트릭스
   - 우선순위 정렬된 구현 로드맵 제안
   - 시타델 편입 설계 초안 (어느 채널을 어떤 주기로 수집할지)

배치: `monkos-ops/ops/reports/2026-07/`

---

## 워크플로우 설계 가이드

Phase 2-1의 채널 조사는 **워크플로우 병렬 실행**을 권장한다:

```
Phase 1: Ubersuggest MCP 분석 (단일 에이전트)
  → MCP 도구 37개 전수 파악 + 대체 판정

Phase 2: 채널별 병렬 리서치 (워크플로우)
  → Google 채널군 에이전트 (GSC/GA4/Ads KP/Trends/GBP)
  → 네이버 채널군 에이전트 (검색광고/서치어드바이저/데이터랩)
  → 기타 채널 에이전트 (Bing/AnswerThePublic/PageSpeed)
  → 현행 코드 분석 에이전트 (scripts/ + Actions + AUTOPILOT)

Phase 3: 종합 (단일 에이전트)
  → 전 채널 결과 통합 + 매트릭스 작성 + 시타델 편입 설계
```

---

## 완료 기준

- [ ] Ubersuggest MCP 37개 도구 전량 목록 + 판정표 완성
- [ ] 연결 권고/비권고 결론 + 근거 1단락
- [ ] SEO/GEO 채널 8개+ 조사 완료
- [ ] 자동화 매트릭스 + 우선순위 로드맵
- [ ] 시타델 편입 설계 초안
- [ ] 보고서 2건 배치 + 커밋 + 푸시
- [ ] 완료 보고 (✅❌💡⏳📁🔀 형식)
