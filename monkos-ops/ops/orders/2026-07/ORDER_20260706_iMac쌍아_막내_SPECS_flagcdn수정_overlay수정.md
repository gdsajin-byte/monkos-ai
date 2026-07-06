---
type: order
date: 2026-07-06
device: iMac
agent: 쌍아 → 막내
status: 대기
---

**[2026-07-06 14:44 KST]** iMac/쌍아 → 막내

# SPECS 국기 이미지 + 대륙 카드 overlay 수정

## 배경
- `flagcdn.com` URL 구조 변경으로 국가 카드 flag 이미지 전체 404 → 깨진 이미지 노출
- 대륙 카드 gradient overlay 불투명도 `CC`(80%)가 너무 높아 배경 이미지가 심하게 물들어 보임

## 수정 대상 파일
`monkos_AI/portal/lib/cms/render-specs.js`

---

## 수정 1 — countryFlag() URL 수정

**위치**: `countryFlag` 함수 (현재 line ~431)

**현재 코드:**
```js
function countryFlag(countrySlug, size = 32) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toLowerCase();
  if (code.length !== 2) return '';
  const w = size;
  const h = Math.round(size * 0.75);
  return `<img src="https://flagcdn.com/w${w * 2}/${code}.webp" alt="${code}" width="${w}" height="${h}" class="flag-icon" loading="lazy">`;
}
```

**수정 후:**
```js
function countryFlag(countrySlug, size = 32) {
  const code = (COUNTRY_SLUG_TO_ISO[countrySlug] || countrySlug).toLowerCase();
  if (code.length !== 2) return '';
  const w = size;
  const h = Math.round(size * 0.75);
  // flagcdn.com 지원 너비: 20, 40, 80, 160, 320, 640 (2025년 이후 64 등 비표준 404)
  const VALID_WIDTHS = [20, 40, 80, 160, 320, 640];
  const target = w * 2;
  const cdnW = VALID_WIDTHS.find(s => s >= target) || 640;
  return `<img src="https://flagcdn.com/w${cdnW}/${code}.webp" alt="${code}" width="${w}" height="${h}" class="flag-icon" loading="lazy" onerror="this.style.display='none'">`;
}
```

- `w * 2` (retina 기준) 이상인 가장 작은 유효 사이즈로 스냅
- `onerror` 핸들러 추가 (CDN 장애 시 깨진 아이콘 대신 숨김 처리)

---

## 수정 2 — 대륙 카드 overlay 불투명도 낮추기

**위치**: continent-card 렌더링 (`return \`<div class="continent-card"...` 부분, line ~1183)

**현재 코드:**
```js
<div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}CC,${cm.gradient[1]}CC)">
```

**수정 후:**
```js
<div class="overlay" style="background:linear-gradient(135deg,${cm.gradient[0]}88,${cm.gradient[1]}88)">
```

- `CC`(80%) → `88`(53%)로 낮춰 배경 이미지가 자연스럽게 비치도록

---

## 완료 조건
1. `monkos.ai/specs` → 대륙 선택 → 국가 목록: 국기 이미지 정상 표시
2. 대륙 카드 배경 이미지 50% 이상 비쳐보임 (색 편향 완화)
3. 배포 후 rev 번호 보고

## ⚠️ 준수 조항
- 헌법 4조 2항: 파괴적 명령 금지
- 배포: `./deploy.sh prod` 경유 필수 (ch5 2조)
- 완료 보고: 수발신 헤더 + ✅ 형식, COMPLETION 파일 생성 필수
