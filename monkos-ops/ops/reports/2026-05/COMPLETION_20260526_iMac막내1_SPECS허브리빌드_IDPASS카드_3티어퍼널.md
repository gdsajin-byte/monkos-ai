---
type: completion
date: 2026-05-26
device: iMac
agent: 막내1
portfolio: PF_SPECS
order: ORDER_20260526_iMac쌍아_막내_SPECS_허브리빌드_IDPASS카드_3티어퍼널.md
status: 완료
---

# COMPLETION — SPECS 허브 리빌드: IDPASS 카드 UX + 3티어 전환 퍼널

## 수행 내역

### Phase A — 허브 리빌드 (`/specs`)

| # | 작업 | 결과 |
|---|------|------|
| A-1 | 용도 카드 2×2 (여권/비자/신분증/기타) | ✅ IDPASS 앱 에셋 WebP 변환, 그라데이션 오버레이 |
| A-2 | 대륙 카드 2×3 (6대륙 배경 이미지) | ✅ cont_*.jpg → WebP 600px 변환, 대륙별 그라데이션 |
| A-3 | 국가 카드 (국기+국가명+용도+사이즈) | ✅ 중복 제거(korea/kr 등 ISO 정규화), 검색바 |
| A-4 | 히어로 섹션 | ✅ 206+ 국가, 445+ 규격, 35+ 공식 검증 |
| A-5 | 다크 테마 디자인 토큰 | ✅ #05080E bg, #0D1117 card, #00D4AA accent |
| A-6 | 반응형 | ✅ 768px 이하 1열, 480px 이하 카드 1열 |

### Phase B — 상세 페이지 리빌드 (`/specs/:type/:country`)

| # | 작업 | 결과 |
|---|------|------|
| B-1 | URL 전환 (`/specs/:type/:country`) | ✅ 445건 라우트 매핑 |
| B-1 | 기존 URL 301 리다이렉트 | ✅ korea-passport → /specs/passport/korea |
| B-2 | 상세 페이지 구조 유지 | ✅ 히어로+테이블+상세+O/X+반려+FAQ |
| B-3 | 3단 티어 CTA | ✅ 무료 활성, AI프리미어·스튜디오 "준비 중" |
| B-4 | JSON-LD (Article+FAQPage+HowTo) | ✅ 기존 트리플 스택 보존 |
| B-5 | 다크 테마 통일 | ✅ 허브와 동일 토큰 |

### Phase C — 데이터 연결

| # | 작업 | 결과 |
|---|------|------|
| C-1 | slug → type/country 파싱 | ✅ 18개 타입 패턴 자동 파싱 |
| C-2 | 대륙·국가 카운트 자동 산출 | ✅ continent 필드 기반 집계 |

## 산출물

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/render-specs.js` | 전면 리빌드 (857줄 → ~680줄) |
| `monkos_AI/portal/public/images/continents/` | 6장 WebP (cont_*.webp) |
| `monkos_AI/portal/public/images/cards/` | 4장 WebP (card_*.webp) |

## 준수 조항

- ✅ deploy.sh 경유 (아직 미배포 — 작가님 승인 대기)
- ✅ 기존 26건 SEO 콘텐츠 손실 없음 (FAQ 9건, 반려사유 7건 확인)
- ✅ 기존 URL 301 리다이렉트 (SEO 자산 보호)
- ✅ specs-data.json 기존 데이터 수정·삭제 없음
