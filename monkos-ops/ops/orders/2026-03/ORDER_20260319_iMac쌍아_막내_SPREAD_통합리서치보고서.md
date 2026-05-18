---
type: order
from: iMac/쌍아
to: iMac/막내 (복수 투입 가능)
date: 2026-03-19
priority: 전략
project: SPREAD
---

# ORDER_20260319 — SPREAD 통합 리서치 보고서 작성

**[2026-03-19 16:01 KST] iMac/쌍아 → iMac/막내**

## 배경

SPREAD v2 종합전략 기안서(`monkos-ops/ops/proposals/PROPOSAL_20260319_SPREAD_v2_종합전략.md`)가 작성되었다.
이 기안서를 기반으로, **실행 가능한 구체적 방안**을 리서치하여 통합 보고서로 작성한다.

## 참조 문서 (반드시 읽고 시작)

1. `monkos-ops/ops/proposals/PROPOSAL_20260319_SPREAD_v2_종합전략.md` — SPREAD v2 전체 구조
2. `monkos-ops/works/ops/reports/REPORT_20260319_철창이_채널현황_SNS_SEO점검.md` — 전 채널 현황
3. `monkos-ops/marketing/MARKETING_MASTER_STRATEGY_20260304.md` — 마케팅 종합전략 (확정)
4. `monkos-ops/marketing/COOPERATION_20260225_철창_marketing_pipeline_v2.md` — n8n 파이프라인 설계

## 보고서 구성 (5파트)

### Part 1: 자동화 방안

SPREAD 체계에서 자동화할 수 있는 모든 영역을 조사한다.

| 조사 항목 | 상세 |
|----------|------|
| n8n 워크플로 구체 설계 | GitHub Issues 자동 생성, 티스토리 자동 게시, 텔레그램 알림 — 각각 트리거/노드/설정 구체화 |
| Firestore 트리거 방식 | 블로그 발행 시 n8n 자동 감지 방법 (Webhook? Firestore 리스너? Cloud Functions?) |
| llms.txt 자동 갱신 | 블로그 발행 시 llms.txt에 자동 추가하는 구현 방안 |
| sitemap 자동 갱신 | 현행 동작 확인 + 개선점 |
| OG 이미지 자동 생성 | 블로그 제목+대표이미지 → OG 카드 자동 생성 도구/방법 |
| RSS Feed 구축 | monkos.ai 블로그 RSS Feed 현황 확인 + 미존재 시 구축 방안 (Zapier/Nuelink 등 연동용) |
| 해시태그 자동 추천 | 카테고리/키워드 기반 채널별 해시태그 자동 생성 방안 |
| 크로스포스팅 자동화 | note.com→X 이미 동작 중. 추가 가능한 자동 크로스포스팅 조합 |

### Part 2: SEO/GEO/AEO 최적화

현재 인프라를 기반으로 추가 최적화 방안을 조사한다.

| 조사 항목 | 상세 |
|----------|------|
| GSC 현황 심화 분석 | 철창이 리포트 기반 — http/https 정규화, privacy noindex, 비브랜드 키워드 전략 |
| 구조화 데이터 확장 | 현행 JSON-LD (Article, FAQPage) 외 추가 가능한 스키마 (VideoObject, HowTo, Product 등) |
| Core Web Vitals | monkos.ai 페이지 속도 측정 + 개선 포인트 |
| 백링크 전략 | GitHub→monkos.ai, Medium→monkos.ai, 티스토리→monkos.ai 외 추가 백링크 확보 방안 |
| 이미지 SEO | alt 태그 현황, 이미지 sitemap, WebP 전환 상태 |
| 영상 SEO | YouTube SEO 체크리스트 (제목/설명/태그/자막/챕터/썸네일), video-sitemap |
| AEO (AI Engine Optimization) | AI 검색엔진별 최적화 방법 (ChatGPT, Perplexity, Gemini, Claude) — 각각 어떤 데이터를 우선 수집하는지 |
| 로컬 SEO | 네이버 플레이스/구글 비즈니스 프로필 최적화 체크리스트 |

### Part 3: 부족한 마케팅 영역 보완 전략

SPREAD v2 + 철창이 채널리포트 기반으로 현재 약점을 식별하고 보완 전략을 제시한다.

| 조사 항목 | 상세 |
|----------|------|
| 팔로워 0~2명 채널 | 인스타JP(2), note.com(0), LINE(2) — 초기 팔로워 확보 전략 (유료 없이) |
| 비브랜드 키워드 노출 0 | "AI 증명사진", "여권사진 셀프" 등 검색어 공략 콘텐츠 전략 |
| EN 시장 부재 | Medium 0건, GitHub Issues 2건 — EN 콘텐츠 생산 + 배포 부트스트랩 방안 |
| 쇼트폼 미착수 | 릴스/Shorts/TikTok 시작 전략 — 최소 장비, 편집 도구(무료), 콘텐츠 포맷 |
| 인스타 KR↔온라인 단절 | @monk_photo와 monkos.ai 연결 전략 — 프로필/게시물/스토리 CTA |
| JA 품질 이슈 | X @Photo_monkos, 인스타 소개문, note.com 제목 — 오타/혼재 방지 프로세스 |
| 리뷰/UGC 부재 | 사용자 후기 수집 + 활용 전략 (구글리뷰, 인스타 멘션, 네이버 리뷰) |
| 경쟁사 벤치마크 | AI 증명사진 경쟁사 3~5개 채널 현황 비교 (어떤 채널에서 뭘 하고 있는지) |

### Part 4: 무료 vs 유료 — 효율적 자금 투입 포인트

| 조사 항목 | 상세 |
|----------|------|
| 무료로 할 수 있는 것 전수 | 채널별 무료 기능 총정리 (OG, Intent URL, RSS, JSON-LD, 해시태그, 크로스포스팅 등) |
| 유료 효과 최대 채널 | 채널별 광고 단가, ROI 기대치, 최소 예산 (인스타 부스트, X 프로모션, 네이버 키워드, 구글 Ads) |
| 마이크로 인플루언서 | JP/KR 증명사진·뷰티 분야 마이크로 인플루언서 협업 방안 + 비용 구조 |
| ProductHunt 런치 | 비용 0원, 최대 효과를 위한 준비 체크리스트 (타이밍, 자산, 커뮤니티 빌딩) |
| 유료 도구 비교 | Buffer vs Later vs Hootsuite vs 무료(n8n 자체) — 기능/비용 비교표 |
| Apify 벤치마크 비용 | 20채널 크롤링 실제 비용 시뮬레이션 |
| 광고 예산 시뮬레이션 | 월 5만원 / 10만원 / 30만원 단위별 최적 배분안 |

### Part 5: 실행 방안 (액션 플랜)

Part 1~4 조사 결과를 바탕으로 **구체적 실행 플랜**을 제시한다.

| 항목 | 상세 |
|------|------|
| 즉시 실행 (이번 주) | 비용 0원, 코드/설정 변경만으로 가능한 것 |
| 단기 (2주) | 콘텐츠 생산 + 채널 활성화 첫 단계 |
| 중기 (1~2개월) | 자동화 파이프라인 완성 + KPI 측정 시작 |
| 장기 (3~6개월) | 유료 광고 테스트 + 채널 성숙 + 글로벌 확장 |
| 우선순위 매트릭스 | 효과(High/Low) × 노력(High/Low) 4사분면 정리 |

---

## 산출물

```
monkos-ops/ops/reports/REPORT_20260319_SPREAD_통합리서치.md
```

## 조사 방법

- **웹 리서치 필수** — 최신 도구/방법/비용/사례 조사
- 코드 조사 — monkos_AI/portal/ 하위 현행 구현 확인
- 기존 문서 참조 — 위 4건 반드시 읽고 시작
- 경쟁사/벤치마크 — 실제 서비스 조사

## 완료 조건

- [ ] 5개 파트 전체 작성
- [ ] 각 파트에 구체적 도구명/비용/URL 포함
- [ ] 우선순위 매트릭스 포함
- [ ] 보고서 `monkos-ops/ops/reports/` 에 저장

## ⚠️ 준수 조항

- 리서치 + 보고서 작성만. 코드 수정/배포 하지 않는다
- 내부 기밀(에이전트 호칭 등) 보고서에 포함 금지 — 외부 공유 가능 수준으로 작성
- 비용은 원화(₩) 기준, 달러 병기
