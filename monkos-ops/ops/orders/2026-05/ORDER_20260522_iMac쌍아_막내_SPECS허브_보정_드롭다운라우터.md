---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_SPECS
prior: ORDER_20260522_iMac쌍아_막내_SPECS허브_리디자인_대륙카드
---

# SPECS 허브 보정 — 탭/대륙카드 퍼널 삭제 → 드롭다운 라우터

## 배경

이전 지시서(대륙카드+4탭)에서 방향 변경. 허브 페이지는 **라우터 역할만** — 각 `/specs/{slug}` 상세 페이지가 SEO 자체 랜딩으로 독립. 허브에서는 드롭다운으로 빠르게 원하는 규격을 찾아 상세 페이지로 보내주면 된다.

## 삭제 대상

- 4탭 네비 (대륙/국가/문서/규격) **전부 삭제**
- 대륙 카드 그리드 **삭제** (퍼널 동선 불필요)
- 탭 전환 JS 로직 삭제

## 허브 페이지 구조 (변경)

```
[Header: MONKOS GUIDE + "무료 AI 크롭 →" CTA]

[히어로]
  🌐 GLOBAL PHOTO SPEC GUIDE
  H1: "증명사진 규격 가이드"
  부제 + 수치 배지 (200+ 국가 | 500+ 규격 | 35+ 공식 검증)

[국가 검색 바]
  placeholder: "국가명 검색..."
  실시간 타이핑 필터 → 매칭 국가 드롭다운 자동 표시
  국가 선택 시 → 규격 드롭다운 자동 활성화

[선택 영역 — 가로 2열]

  [국가 드롭다운]                    [규격 드롭다운]
  대륙별 optgroup 카테고리:          (국가 선택에 종속, 초기 disabled)
    <optgroup label="아시아">        선택된 국가의 문서 목록:
      한국                           ├─ 여권 (35×45mm)
      일본                           ├─ 비자 (35×45mm)  
      중국                           └─ 운전면허 (30×40mm)
      ...
    <optgroup label="유럽">
      영국
      독일
      ...

  국가 선택 → 규격 드롭다운 옵션 동적 업데이트
  규격 선택 → 해당 /specs/{slug} 페이지로 이동 (location.href)

[푸터]
  © 2026 MONKOS · 규격 정보는 공식 출처 기반 검증.
```

## 기술 구현

### 1. 국가 드롭다운 데이터

specs-data.json의 26건을 대륙별로 그룹핑. SPEC_CONTINENT_MAP 활용.

```html
<select id="country-select">
  <option value="" disabled selected>국가를 선택하세요</option>
  <optgroup label="아시아">
    <option value="korea">한국</option>
    <option value="japan">일본</option>
    ...
  </optgroup>
  <optgroup label="유럽">
    ...
  </optgroup>
</select>
```

### 2. 규격 드롭다운 (종속)

국가 선택 시 해당 국가의 specs 항목만 필터하여 표시.

```html
<select id="spec-select" disabled>
  <option value="" disabled selected>규격을 선택하세요</option>
  <!-- JS로 동적 생성 -->
</select>
```

### 3. 검색 바

```html
<input type="search" id="country-search" placeholder="국가명 검색...">
```

입력 시 국가 드롭다운 옵션을 필터링하거나, 매칭 결과를 검색 바 아래에 리스트로 표시.

### 4. 라우팅

규격 선택 완료 시:
```javascript
specSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    location.href = `/${lang === 'ko' ? '' : lang + '/'}specs/${e.target.value}`;
  }
});
```

### 5. i18n

기존 SPECS_I18N에 추가:

| 키 | ko | en | ja |
|---|---|---|---|
| searchPlaceholder | 국가명 검색... | Search country... | 国名で検索... |
| selectCountry | 국가를 선택하세요 | Select a country | 国を選択 |
| selectSpec | 규격을 선택하세요 | Select a specification | 規格を選択 |

## CSS

- 라이트 배경 유지
- 드롭다운: 큰 사이즈 (높이 48px+, 폰트 16px) — 모바일 터치 친화
- 검색 바: 폭 100%, 둥근 모서리, 돋보기 아이콘
- 반응형: 768px 이하 → 드롭다운 1열 스택

## SEO 유의

- 허브 페이지의 JSON-LD ItemList 유지 (전체 26건 specs 링크 나열)
- 개별 `/specs/{slug}` 페이지는 변경 없음 — 각각 독립 SEO 랜딩
- sitemap 변경 없음

## 배포

- `monkos_AI/portal/deploy.sh prod`

## ⚠️ 준수 조항

- 배포는 반드시 deploy.sh 경유 (법률 ch5 2조)
- 기존 상세 페이지(`/specs/{slug}`)에 영향 없음 확인
- 현재 배포된 탭+대륙카드 버전을 이 드롭다운 버전으로 교체
