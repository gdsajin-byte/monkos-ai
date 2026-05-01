---
type: order
date: 2026-05-01
from: iMac/쌍아
to: 막내1
subject: specs-data-v2 정본 생성 + @imgly WebWorker 모듈
status: 대기
---

# [2026-05-01 16:14 KST] iMac/쌍아 → 막내1

## 미션

`apps/crop-app/` 에 두 가지 실구현물을 납품하라:
1. 26국 전수조사 기반 `specs-data-v2.json` 정본
2. `@imgly/background-removal` WebWorker 통합 모듈

막내2가 프로토(index.html, style.css, app.js)에 실기능을 연동할 때 import해서 쓸 데이터+엔진 레이어.

## 파트 A: specs-data-v2.json

### 입력
- 전수조사 보고서 4건: `monkos-ops/ops/reports/REPORT_20260430_막내{1~4}_증명사진규격_전수조사.md`
- 기존 정본: `monkos_AI/portal/public/data/specs-data.json`
- PF_CROP Phase 1.5 A/B/C 그룹 분류: `monkos-ops/ops/portfolios/PF_CROP.md`

### 산출물: `apps/crop-app/data/specs-data-v2.json`

```jsonc
{
  "version": "2.0",
  "countries": [
    {
      "id": "korea",
      "flag": "🇰🇷",
      "name": { "ko": "대한민국", "ja": "韓国", "en": "South Korea" },
      "documents": [
        {
          "id": "korea-passport",
          "type": "passport",
          "name": { "ko": "여권", "ja": "パスポート", "en": "Passport" },
          "size": { "w_mm": 35, "h_mm": 45 },
          "px": { "w": 413, "h": 531, "dpi": 300 },
          "group": "A",
          "background": "white",
          "eyePosition": null,
          "aiRestriction": true,
          "officialSource": "https://..."
        }
      ]
    }
  ]
}
```

- group: A(ICAO 35×45 표준 10종), B(사이즈만 다름 12종), C(특수 규정 4종)
- eyePosition: 공식 규정 있는 4건만(미국 비자, 인도 비자, 인도네시아, 베트남). 나머지 null
- aiRestriction: AI 보정 금지 7국 true
- 전수조사 28건 전부 반영. 기존 specs-data.json과 대조하여 누락 없이

## 파트 B: @imgly WebWorker 모듈

### 산출물: `apps/crop-app/src/bg-remove.js` + `apps/crop-app/src/bg-remove-worker.js`

**bg-remove.js** (메인 스레드 API):
```js
export async function removeBG(imageBlob, onProgress) → Promise<Blob>
// onProgress: (phase, percent) => void
// phase: 'loading' | 'processing' | 'done'
```

**bg-remove-worker.js** (Worker):
- @imgly/background-removal import
- 메인 스레드 블로킹 방지
- 진행률 메시지 전달

### 핵심
- @imgly v1.5.5 (CDN, `https://cdn.jsdelivr.net/npm/@anthropic-ai/...` 아님 — imgly 정확한 CDN 경로 확인)
- IndexedDB 캐싱은 imgly 내장이므로 추가 구현 불필요
- Worker 내에서 imgly 로딩 → 추론 → 결과 Blob 반환

## ⚠️ 준수 조항
- `monkos_AI/crop-app/` 수정 금지
- 막내2가 프로토 루트(index.html, style.css, app.js) 작업 중 — `src/`, `data/` 하위로 작업
- 눈 위치: 공식 규정 vs 권장 가이드 구분 (4/30 작가님 지적)
