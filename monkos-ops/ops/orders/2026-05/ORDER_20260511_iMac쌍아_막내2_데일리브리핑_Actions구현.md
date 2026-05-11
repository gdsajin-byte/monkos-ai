---
type: order
from: iMac/쌍아
to: iMac/막내2
date: 2026-05-11
project: 데일리 브리핑 자동화
priority: 높음
portfolio: PF_AUTOPILOT
deadline: 금일 내
---

# 지시서: 데일리 브리핑 GitHub Actions 구현

## 배경

- PF_AUTOPILOT Phase 2 "데일리 브리핑" 착수
- GitHub Secrets 등록 완료: `GCP_SA_KEY`, `GA4_PROPERTY_ID`, `GSC_SITE_URL`
- SA: `yong-a-orchestrator@monkos.iam.gserviceaccount.com` — roles/editor로 GA4+GSC API 접근 실측 확인 완료
- GA4 Property ID: `521406894` (monkos-3c6e4)
- GSC Site URL: `sc-domain:monkos.ai`
- 모바일 막내 설계(5/10)를 기반으로 구현

## 아키텍처

```
매일 05:00 KST (cron: '0 20 * * *' UTC)
  → GitHub Actions VM 기동
  → GCP_SA_KEY 디코드 → SA 인증
  → GA4 Data API → 어제 세션/유입/전환
  → GSC API → 어제 클릭/노출/CTR/순위
  → 뉴스 크롤링 → 정부자금/AI 모델/업계
  → SEO 스캔 → monkos.ai 주요 페이지 HEAD 체크
  → briefing.md 생성
  → git commit + push
  → GitHub Issue 생성 (라벨: 일일보고) → 작가님 폰 푸시
```

## 임무

### 1. 브리핑 스크립트 — `.github/scripts/daily_briefing.py`

Python 스크립트. 아래 4축을 수집하여 마크다운 생성.

**축1: 성과 (GA4+GSC)**

```python
# GA4 — google-analytics-data 라이브러리
# 지표: sessions, totalUsers, newUsers, screenPageViews, conversions
# 차원: date, sessionDefaultChannelGroup
# 기간: 어제 vs 전주 동요일

# GSC — google-api-python-client (webmasters v3)
# 지표: clicks, impressions, ctr, position
# 차원: query (상위 10), page (상위 10)
# 기간: 어제 vs 7일 전
```

**축2: SEO 스캔**

주요 페이지 목록에 HTTP HEAD 요청. 200 아닌 건만 보고.

```python
PAGES = [
    "https://monkos.ai",
    "https://monkos.ai/kr",
    "https://monkos.ai/jp",
    "https://idphoto-kr.monkos.ai",
    "https://idphoto-jp.monkos.ai",
    "https://monk.kr",
    "https://monk.kr/blog",
    "https://image.monkos.ai",
]
```

**축3: 뉴스 크롤링**

| 소스 | URL | 필터 |
|------|-----|------|
| 기업마당 | bizinfo.go.kr 공고 목록 | AI, SW, 소상공인, 창업 |
| Anthropic Blog | anthropic.com/news 또는 RSS | 모델, API, SDK |
| Google AI Blog | blog.google/technology/ai 또는 RSS | Gemini, Vertex |

- RSS 우선. RSS 없으면 requests + BeautifulSoup으로 최신 항목 3건 추출
- 각 항목: 제목 + URL + 날짜
- 수집 실패 시 해당 소스 스킵 (전체 실패 방지)

**축4: 이상 감지**

- GA4 세션 전주 대비 -30% 이상 하락 → 🔴 긴급
- GSC 노출 전주 대비 -30% 이상 하락 → 🔴 긴급
- SEO 스캔 200 아닌 페이지 → 🔴 긴급
- 정부자금 마감 D-7 이내 → 🟠 주목

**출력 형식** — `monkos-ops/ops/briefings/BRIEFING_YYYYMMDD.md`

```markdown
---
type: briefing
date: YYYY-MM-DD
generated: auto (PF_AUTOPILOT)
---

# 데일리 브리핑 YYYY-MM-DD

## 🔴 긴급 (즉시 대응)
- (이상 감지 건만. 없으면 "없음")

## 📊 성과
| 지표 | 어제 | 전주 동요일 | 변동 |
|------|------|-----------|------|
| GSC 클릭 | N | N | +N% |
| GSC 노출 | N | N | +N% |
| GA4 세션 | N | N | +N% |
| GA4 신규 사용자 | N | N | +N% |

### GSC 상위 검색어 (Top 10)
| 검색어 | 클릭 | 노출 | CTR | 순위 |

### GSC 상위 페이지 (Top 10)
| 페이지 | 클릭 | 노출 | CTR |

## 🔧 SEO 스캔
- (200 아닌 건만. 전부 200이면 "✅ 전 페이지 정상")

## 📰 뉴스
### 정부자금
- [제목](URL) — 날짜

### AI/기술
- [제목](URL) — 날짜

## 🟡 참고
- (기타 특이사항)
```

### 2. 워크플로우 — `.github/workflows/daily-briefing.yml`

```yaml
name: Daily Briefing

on:
  schedule:
    - cron: '0 20 * * *'  # UTC 20:00 = KST 05:00
  workflow_dispatch:  # 수동 실행 가능

jobs:
  briefing:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install google-analytics-data google-api-python-client google-auth requests beautifulsoup4
      - name: Generate briefing
        env:
          GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
          GA4_PROPERTY_ID: ${{ secrets.GA4_PROPERTY_ID }}
          GSC_SITE_URL: ${{ secrets.GSC_SITE_URL }}
        run: python .github/scripts/daily_briefing.py
      - name: Commit and push
        run: |
          git config user.name "monkos-autopilot"
          git config user.email "autopilot@monkos.ai"
          git add monkos-ops/ops/briefings/
          git commit -m "[briefing] $(date +%Y-%m-%d) 데일리 브리핑 자동 생성" || exit 0
          git push
      - name: Create Issue
        if: success()
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          DATE=$(date +%Y-%m-%d)
          BODY=$(cat monkos-ops/ops/briefings/BRIEFING_${DATE}.md)
          gh issue create \
            --title "📊 데일리 브리핑 ${DATE}" \
            --body "${BODY}" \
            --label "일일보고"
```

### 3. 의존성 — `.github/scripts/requirements.txt`

```
google-analytics-data>=0.18.0
google-api-python-client>=2.100.0
google-auth>=2.23.0
requests>=2.31.0
beautifulsoup4>=4.12.0
```

### 4. briefings 폴더 생성

```bash
mkdir -p monkos-ops/ops/briefings
```

### 5. GitHub 라벨 생성

```bash
gh label create "일일보고" --color "0075ca" --description "PF_AUTOPILOT 자동 브리핑" --repo gdsajin-byte/monk_project
```

## ⚠️ 준수 조항

- **헌법 4조 1항**: 스크립트에 시크릿 하드코딩 절대 금지. 환경변수(`${{ secrets.* }}`)로만 접근
- **헌법 4조 1항**: `echo`/`print`로 시크릿 값 출력 금지 (Actions 로그 마스킹되나 원칙)
- **ch6**: 커밋 메시지 `[briefing]` 카테고리 사용
- 크롤링 실패 시 해당 소스만 스킵 — 전체 워크플로우 실패 방지
- SA 키 디코드는 메모리에서만 처리. 파일로 저장 시 워크플로우 종료 후 자동 삭제됨 (VM 폐기)

## 테스트

1. `workflow_dispatch`로 수동 실행하여 첫 브리핑 생성 확인
2. Issue 생성 + 라벨 부착 확인
3. briefings/ 폴더에 md 파일 적립 확인
4. GA4/GSC 데이터 정합성 (MCP 조회 결과와 대조)

## 완료 기준

- [ ] `daily_briefing.py` 작성 + 4축 수집 동작
- [ ] `daily-briefing.yml` 워크플로우 배치
- [ ] `workflow_dispatch` 수동 실행 → 첫 브리핑 생성 성공
- [ ] Issue 자동 생성 + 라벨 확인
- [ ] COMPLETION 보고서 → 세션 로그 어펜드 → PF_AUTOPILOT 히스토리 1행 어펜드
