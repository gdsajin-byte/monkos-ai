---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_SPECS
---

# SPECS 허브 페이지 리디자인 — 대륙 카드 + 4탭 구조

## 배경

현재 specs 허브(`/specs`)는 국가 5그룹 플랫 리스팅, 26건. 철창이 시안 + IDPASS 앱 대륙 카드 디자인을 기반으로 허브 페이지를 리디자인한다.

**디자인 방향**: 라이트 배경 유지 + 대륙 카드만 컬러풀 그라데이션. 다크 테마 아님.

## 참조

- **철창이 시안**: 대륙/국가/문서/규격 4탭 + 히어로 수치 배지 + 대륙 카드 2열 그리드
- **IDPASS 앱 대륙 색상** (`SpecData.swift` continentMeta):

| 대륙 | 그라데이션 | 점 색상 |
|------|----------|--------|
| 아시아 | #1A3A2A → #2D5A3A | #00D4AA |
| 유럽 | #1A1A3A → #3A2A5A | #A78BFA |
| 아메리카 | #1A2A3A → #2A3A5A | #3B82F6 |
| 아프리카 | #3A2A1A → #5A3A1A | #FFB020 |
| 오세아니아 | #1A2A2A → #1A3A4A | #FF6B9D |
| 중동 | #2A2A1A → #4A3A1A | #F59E0B |

- **IDPASS 앱 대륙 이미지**: `apps/MonkosCrop/MonkosCrop/Resources/cont_*.jpg` (6장)

## 작업

### 1. 허브 페이지 구조 변경 (`render-specs.js` 허브 렌더링 부분)

```
[Header: MONKOS GUIDE + "무료 AI 크롭 →" CTA]

[4탭 네비] 대륙 | 국가 | 문서 | 규격
  - 초기 탭: 대륙
  - 탭 전환은 같은 페이지 내 JS 토글 (SPA 아님, SEO 유지)

[히어로]
  🌐 GLOBAL PHOTO SPEC GUIDE
  H1: "증명사진 규격 가이드"
  부제: "전세계 200국가 이상의 여권, 비자 등 증명사진 규격 정보 제공 및 규격 맞춤 서비스."
  수치 배지: "200+ 국가" | "500+ 규격" | "35+ 공식 검증"

[대륙 카드 그리드 — 2열]
  각 카드:
  - 배경: IDPASS 앱 대륙 그라데이션 색상 (라이트 배경 위에 카드만 컬러풀)
  - 좌상단: 영문 대륙명 (소문자 레터스페이싱)
  - 중앙: 한글 대륙명 (큰 폰트)
  - 하단: "N개국"
  - 우상단: 점 색상 (accent dot)
  - 클릭 → 해당 대륙 국가 목록 필터

[푸터]
  © 2026 MONKOS · 규격 정보는 공식 출처 기반 검증. 최종 규정은 발급 기관 확인.
```

### 2. 대륙 이미지 웹용 배치

`cont_*.jpg` 6장을 WebP로 변환 → `portal/public/images/continents/`

```bash
# 600px 리사이즈 + WebP
for f in cont_asia.jpg cont_europe.jpg cont_americas.jpg cont_africa.jpg cont_oceania.jpg cont_middleeast.jpg; do
  name=$(basename "$f" .jpg)
  sips -Z 600 "apps/MonkosCrop/MonkosCrop/Resources/$f" --out "/tmp/$name.tmp.png"
  cwebp -q 80 "/tmp/$name.tmp.png" -o "monkos_AI/portal/public/images/continents/$name.webp"
done
```

cwebp 없으면 sips JPEG 변환 후 사용.

### 3. 국가 탭 (2번째 탭)

기존 허브의 국가 그룹 리스팅을 이 탭에 배치. 국기 이모지 + 국가명 + 문서 수.

### 4. 문서 탭 (3번째 탭)

여권 / 비자 / 면허 / 신분증 / 이력서 / 기타 — 문서 유형별 그룹핑.

### 5. 규격 탭 (4번째 탭)

사이즈별 그룹핑: 35×45mm (ICAO) / 51×51mm / 50×70mm / 기타.

### 6. i18n

기존 3언어(ko/ja/en) 유지. 탭명·히어로·수치 배지·푸터 번역.

| 키 | ko | en | ja |
|---|---|---|---|
| tab_continent | 대륙 | Continent | 大陸 |
| tab_country | 국가 | Country | 国 |
| tab_document | 문서 | Document | 書類 |
| tab_size | 규격 | Size | サイズ |
| hero_title | 증명사진 규격 가이드 | Photo Spec Guide | 証明写真 規格ガイド |
| stat_countries | 국가 | Countries | カ国 |
| stat_specs | 규격 | Specs | 規格 |
| stat_verified | 공식 검증 | Verified | 公式検証 |
| select_continent | 대륙을 선택하세요 | Select a continent | 大陸を選択 |

### 7. CSS

- 라이트 배경 유지 (`#f6f7fb`)
- 대륙 카드만 그라데이션 (위 색상표 참조)
- 카드 텍스트: 흰색 (다크 카드 위)
- 탭 active: accent (#6c4fff) 밑줄
- 반응형: 768px 이하 → 카드 1열

## 배포

- `monkos_AI/portal/deploy.sh prod`

## ⚠️ 준수 조항

- 배포는 반드시 deploy.sh 경유 (법률 ch5 2조)
- 기존 specs 상세 페이지(`/specs/{slug}`)에 영향 없음을 확인
- SEO: 기존 허브의 JSON-LD (ItemList) 유지, sitemap URL 변경 없음
- 대륙 이미지 출처: IDPASS 앱 자체 에셋 (저작권 문제 없음)
