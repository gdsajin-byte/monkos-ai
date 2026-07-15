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

## 규칙

- **에셋 완비 = 노출 조건**: thumbnail이 없는 아이템은 자동 비노출 (includeInactive=true 제외)
- 본 컴포넌트는 의상 커머스 비전(벤더 카탈로그 납품)의 시험 모델 — specs 부속이 아닌 공유 컴포넌트
