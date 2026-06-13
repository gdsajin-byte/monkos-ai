---
name: 꾸스펙스
description: specs 페이지 콘텐츠 보강 + 디자인 방향 — 블로그↔specs 연동, 경쟁사 벤치마크 기반
---

> 원천: PF_SPECS Phase 3~4 + PF_KKU Phase 1
> 꾸+M2/쌍아가 specs 페이지 콘텐츠를 가꿀 때 호출.

## 1단계 — 대상 규격 로드

1. 대상 슬러그를 확인한다 (예: `us-visa`).
2. 현재 데이터를 Read한다:
   ```
   monkos_AI/portal/lib/cms/specs-data.json
   ```
3. 해당 항목의 현재 충실도를 진단한다:

| 필드 | 있으면 ✅ | 없으면 ❌ (보강 대상) |
|------|----------|---------------------|
| details (ko/en/ja) | 상세 규정 텍스트 | 작성 필요 |
| rejectionReasons (ko/en/ja) | 반려 사유 TOP 5 | 작성 필요 |
| faqs (ko/en/ja) | Q&A 3~5쌍 | 작성 필요 |
| officialSource | 공식 발급처 URL | 조사 필요 |
| 블로그 연동 | 관련 블로그 글 존재 여부 | `/꾸블로그`로 생성 |

## 2단계 — 콘텐츠 보강

### 작성 원칙

- 규격 수치는 `specs-data.json` 정본 그대로 (추측 금지)
- **다단위 표기**: mm + inch + px 병기 (Photo Aid 패턴 — 롱테일 SEO 효과)
- **반려 사유**: 실제 대사관/기관 기준, 구체적 사례 ("배경에 그림자" → "벽에서 30cm 이상 떨어져 촬영하세요")
- **FAQ**: 검색 의도 기반 Q&A ("배경색은 흰색만?" "안경 착용 가능?" "아기 사진은?")
- 한국어 우선, 영어/일본어 순차 확장

### specs-data.json 편집 가능 필드

꾸+M2/쌍아가 보강하는 필드 (코드 구조 변경 아님):

```json
{
  "us-visa": {
    "details": { "ko": "...", "en": "...", "ja": "..." },
    "rejectionReasons": { "ko": [...], "en": [...], "ja": [...] },
    "faqs": { "ko": [{"q": "...", "a": "..."}], ... },
    "officialSource": "https://travel.state.gov/..."
  }
}
```

### 편집 금지 필드 (PF_CROP 정본 관할)

- `size`, `pixels`, `dpi`, `background`, `headHeight` — countries.jsonl 정본
- `slug`, `country`, `type` — URL/ID 체계

## 3단계 — 블로그↔specs 상호 링크

### specs → 블로그 (render-specs.js 수정 필요 시 막내 지시)

- "관련 콘텐츠" 섹션에 블로그 링크 추가
- 예: `/specs/us-visa` 페이지 하단에 "미국비자사진 완벽가이드" 블로그 링크

### 블로그 → specs (블로그 본문에 삽입)

- `/꾸블로그` 스킬의 CTA 가이드 참조
- "규격 상세 보기 → monkos.ai/specs/{slug}"

## 4단계 — 검증 + 배포

1. JSON 유효성 체크: `node -e "JSON.parse(require('fs').readFileSync('monkos_AI/portal/lib/cms/specs-data.json'))"`
2. dev 서버 확인 (가능한 경우)
3. 배포: `deploy.sh` 경유 (막내 또는 iMac/쌍아)
4. PF_KKU + PF_SPECS 히스토리 어펜드

---

## 레퍼런스 인사이트 — 경쟁사 specs 페이지 디자인

> 꾸가 디자인 방향을 잡을 때 참고. 각 경쟁사의 강점을 MONKOS 맥락에서 재해석.

### Photo Aid — 프리미엄 신뢰 설계 ($16.95)

| 요소 | 구현 | MONKOS 시사점 |
|------|------|--------------|
| **Before/After 슬라이더** | Hero에 인터랙티브 슬라이더 + 치수선 오버레이 (2x2in 표기) | specs 상세에 Before/After 추가 → 시각적 설득력 |
| **스펙 카드 6개** | 아이콘+용어/정의 쌍 (Print size, Digital size, Head size, Background, Expression, Lighting) | 현재 테이블 → 카드 UI로 전환 검토 |
| **전문가 바이라인** | 저자+검증자 프로필 (BIPP 회원, LinkedIn 링크) | 규격 데이터 출처 신뢰도 강화 |
| **경쟁 비교 테이블** | PPO vs 사진관 vs DIY — 8항목 체크/X | "MONKOS vs 사진관 vs 셀프" 비교 테이블 |
| **미디어 배지** | Bloomberg, NYT, Forbes, CNN 로고 바 | 미디어 노출 시 활용 |
| **CTA 6회 반복** | 페이지 전체에 "Upload photo" 반복 배치 | 현재 3티어 CTA 1회 → 스크롤 중간 추가 검토 |
| **JSON-LD 7~8개** | Article + HowTo + AggregateRating + Person×2 + Organization + WebPage | 현재 3종 → Person(저자) 추가 검토 |

### Visafoto — 기능주의 직결 전환 (₩8,500)

| 요소 | 구현 | MONKOS 시사점 |
|------|------|--------------|
| **도구+정보 일체형** | 규격 페이지 = 업로드 페이지 (분리 안 함) | specs 상세에 크롭 위젯 인라인 임베딩 (Phase 2 목표) |
| **Before/After 나란히** | Source vs Result 2컬럼, 심플 | 가이드 이미지에 Before/After 추가 |
| **Requirements 허브** | 전 국가×문서 테이블 = 대량 내부링크 | 현재 허브의 대륙→국가 퍼널 유지 + 테이블 뷰 옵션 |
| **Try before buy** | 무료 미리보기 → 결제 후 다운로드 | MONKOS 무료 크롭은 이미 우위 ★ |
| **Footer 링크 30개+** | 주요 국가 specs 링크 대량 배치 | 내부링크 보강 (SEO) |

### iDPhotoDIY — 무료 + 광고 모델

| 요소 | 구현 | MONKOS 시사점 |
|------|------|--------------|
| **완전 무료** | 광고(AdSense) 수익 | MONKOS 무료 크롭과 동일 포지션 |
| **120국+ 드롭다운** | 싱글 페이지에서 국가 선택 | UX 참고 (현재 MONKOS는 대륙→용도→국가 3단계) |
| **DIY 포지셔닝** | AI 없이 수동 크롭 | MONKOS는 AI 자동 + 수동 선택 가능 = 상위 |

### Biometrisches-Passbild — 단일국가 특화 (€9.95)

| 요소 | 구현 | MONKOS 시사점 |
|------|------|--------------|
| **독일 전문** | 생체 여권사진 규격 극상세 (아기 예외까지) | 국가별 상세도를 높이는 모델. Tier 1 국가에 적용 |
| **실물 배송** | 디지털+인화 하이브리드, 무료 우편배송 | 한국 사진관 연계 가능성 (오프라인 전환) |

### MakePassportPhoto — AI 퍼스트 + 소셜 프루프 ($2.99~$3.99)

| 요소 | 구현 | MONKOS 시사점 |
|------|------|--------------|
| **3단 가격** | Free / $2.99 / $3.99 | MONKOS 3티어와 유사 구조 |
| **소셜 프루프 알림** | 실시간 "○○님이 방금 구매" 팝업 | 전환율 부스터 검토 |
| **PWA** | manifest.json, 앱처럼 설치 | specs 페이지 PWA 검토 |

---

## MONKOS 경쟁 우위 정리 (꾸가 콘텐츠에 녹일 포인트)

| 차별점 | 경쟁사 대비 | 콘텐츠 활용 |
|--------|-----------|------------|
| **무료 크롭** | Photo Aid $16.95, Visafoto ₩8,500 | "무료로 규격 맞추기" 강조 |
| **445건 규격** | 대부분 200국 수준 | "세계 최대급 규격 DB" |
| **3티어 선택** | 대부분 유료 단일가 | "필요한 만큼만 — 무료부터 스튜디오까지" |
| **네이버 SEO** | 글로벌 경쟁사 전무 | 한국 시장 독점 가능 ★ |
| **IDPASS 앱 연동** | 웹만 or 앱만 | "웹에서 확인 → 앱에서 크롭" 원스톱 |
| **실사 가이드 이미지** | SVG 또는 없음 (Visafoto) | 25장 WebP 실사 이미 확보 |
