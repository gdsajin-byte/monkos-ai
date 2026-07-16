# AttirePicker

공유 의상 피커 컴포넌트. specs · headshot · styler 공용.

## mount

```js
var picker = AttirePicker.mount(el, {
  service: 'idpass',        // use_case 프로파일
  gender: 'm',              // m | f | all
  age: 'adult',             // adult | teen | baby
  lang: 'ko',               // ko | ja | en | es
  upload: true,             // 내 옷 업로드 활성
  warnLightTop: true,       // 흰 배경 밝은 상의 경고
  onChange: function(sel){}  // 선택 변경 콜백
});

picker.getAttireDesc();     // string | null
picker.getAttireImage();    // base64 | null (upload 시)
picker.getSelection();      // { id, attire_desc, attire_image, labels, tags }
```

## 정본

- 카탈로그 정본: `attire-presets.json` (schema_version 2)
- 설계 정본: `monkos-ops/tech/designs/2026-07/DESIGN_20260712_공유의상피커_종합설계.md`
- CSS: `attire-picker.css` (mount 시 자동 주입 — 소비처 link 불필요)

## 타이 토글

- **토글 체계**: 타이는 독립 아이템이 아닌 정장·셔츠 아이템의 **토글 옵션**으로 운용.
- **노출 조건**: `category ∈ {suit, shirt}` AND `attire_desc`에 `"no tie"` 포함 시에만 토글 행 노출. 기본 off.
- **색상**: 솔리드 2종(네이비·차콜). 프리셋 `tieOptions`에 데이터 정의.
- **desc 치환**: `"no tie"` → `tieOptions[].descFragment` 고정 문자열만. 자유 문자열 조립 절대 금지(프롬프트 인젝션 표면 차단).
- **페이로드**: `getSelection()` 반환에 `attireTie: 'navy'|'charcoal'|null` 포함.
- **기존 타이 아이템**: `m_shirt_white_tie_navy_15`, `m_shirt_white_tie_charcoal_16` → `active: false` 강등. 에셋·GCS 원본 보존.

## age 축

- **스키마**: `tags.age: ["adult"]` 배열. 무태그 아이템은 `["adult"]` 간주 (하위호환).
- **피커 3단**: adult · teen · baby. 서버 4단(adult/teen/child/baby) 중 child는 피커에서 teen에 흡수.
- **teen 재사용**: 기존 성인 셔츠(`m_shirt_white_regular_08` 등)에 `age: ["adult","teen"]` 태깅 → teen 선택 시 성인 아이템도 노출.
- **teen 전용**: 카테고리 `polo`·`sweatshirt` 신설, 유니섹스 4종. `age: ["teen"]`만.

## baby recolor

- **원칙**: 영유아는 의상 교체 금지 — **색상 변경(recolor) 전용**.
- **스키마**: 아이템에 `mode: "recolor"` 필드 (기본 `"replace"` 간주).
- **attire_desc**: "Change the color of the current top to {color}. Keep the original garment shape..." 고정 문자열. 자유 조립 금지.
- **렌더**: recolor 아이템은 카드 대신 색 스와치 칩으로 표시 (thumbnail 미기입, swatch.primary만).
- **노출 게이트**: `mode === "recolor"` 아이템은 thumbnail 없어도 swatch로 노출 허용.
- **안내 문구**: age=baby 시 `babyGuide` 텍스트 4언어 노출.
- **서버 안전**: `buildT1Prompt`의 `IDENTITY_PRESERVATION_BABY`가 얼굴·비율 95% 보존 보장.

## 규칙

- **에셋 완비 = 노출 조건**: thumbnail(또는 recolor의 경우 swatch)이 없는 아이템은 자동 비노출 (includeInactive=true 제외)
- 본 컴포넌트는 의상 커머스 비전(벤더 카탈로그 납품)의 시험 모델 — specs 부속이 아닌 공유 컴포넌트
