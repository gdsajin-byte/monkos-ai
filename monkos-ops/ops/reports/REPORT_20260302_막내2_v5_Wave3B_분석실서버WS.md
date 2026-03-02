---
type: report
id: REPORT_20260302_막내2_v5_Wave3B_분석실서버WS
date: "2026-03-02 18:21 KST"
from: 막내2
to: 쌍아
status: completed
result: success
references:
  - monkos-ops/ops/orders/ORDER_20260302_iMac쌍아_막내2_v5_Wave3B_분석실서버WS.md
---

# v5 Wave 3-B — 분석실(result) + 서버 WS 코칭 v5 키 연결 완료 보고

> **[2026-03-02 18:21 KST] iMac/막내2 → iMac/쌍아**

---

## 산출물

| 파일 | 변경 내용 |
|------|----------|
| **result.js** | generate API v5 필드 전환 + PHOTO_SPECS 키 6곳 + updateSpecButtons v5 + 주석 |
| **result.html** | 규격 탭 버튼 ID/onclick 2곳 (passport/id) |
| **server.js** | WS set-format 핸들러 + COACHING/STYLE v5 alias + 기본값 4곳 교체 |

---

## 변경 상세

### 1. result.js — generate API v5 전환 (L210-224)
- `style` → `format`, `purpose`/`expression`/`tie`/`background` **삭제**
- `suitColor`, `shirtColor`, `tieColor`, `tiePattern`, `bgColor` **추가**
- 모든 값 `store.*` 직접 참조 (loadSessionData 제거)
- `v: 5` 플래그 추가 → 서버 buildPromptV5 분기 작동

### 2. result.js — PHOTO_SPECS 참조 6곳
- `store.style` → `store.format` (6건 전체 교체, 잔류 0건)
- L22 주석: `{ id_photo: dataUrl, resume: dataUrl }` → `{ passport: dataUrl, id: dataUrl }`

### 3. result.js — updateSpecButtons() (L505-533)
- SPEC_DESC 키: `id_photo`/`resume` → `passport`/`id`
- forEach 배열: `['id_photo', 'resume']` → `['passport', 'id']`
- 조건 분기: `key === 'id_photo'` → `key === 'passport'`

### 4. result.html — 규격 탭 버튼 (L250-255)
- `btn-spec-id_photo` → `btn-spec-passport`, onclick 인자 `'passport'`
- `btn-spec-resume` → `btn-spec-id`, onclick 인자 `'id'`

### 5. server.js — WS set-format 핸들러 (L950)
- `msg.type === 'set-style'` → `msg.type === 'set-format' || msg.type === 'set-style'`
- `msg.format || msg.style` 우선순위 적용 (v4 하위호환)
- 매핑: `id`/`resume` → `'id'`, 나머지 → `'passport'`

### 6. server.js — COACHING/STYLE alias + 기본값
- `COACHING_INSTRUCTIONS.passport = .id_photo`, `.id = .resume` (L142-143)
- `STYLE_PROMPTS.passport = .id_photo`, `.id = .resume` (L170-171)
- 세션 초기값: `photoStyle: 'passport'` (L915)
- `connectGeminiLive()` 기본값: `'passport'` (L441)
- `generatePhoto()` 기본값: `style='passport', gender='f'` (L498)
- 폴백: `COACHING_INSTRUCTIONS.passport`, `STYLE_PROMPTS.passport` (L460, L500)

---

## 변경하지 않은 것 (확인)

| 대상 | 상태 |
|------|------|
| `buildPrompt()` (v4, L257) | ✅ 유지 |
| `buildPromptV5()` (Wave 2-B 산출물) | ✅ 변경 없음 |
| `PURPOSE_PROMPTS` (L249-255) | ✅ 유지 |
| `getOutfitPrompt()` (L177-195) | ✅ 유지 |
| camera.js, thankyou.js | ✅ 미수정 (막내1 영역) |
| shared.js, config.js, prep.js, charge.html | ✅ 미수정 |
| IDENTITY_PRESERVATION | ✅ 미수정 |
| GEMINI_API_KEY | ✅ 미수정 |

---

## 검증 결과

| # | 점검 항목 | 결과 |
|---|----------|------|
| 1 | result.js `store.style` 참조 0건 | ✅ |
| 2 | result.js `store.format` 참조 존재 (6건) | ✅ |
| 3 | generate 호출에 `v: 5` 플래그 | ✅ |
| 4 | generate 호출에 `style` 없음, `format` 있음 | ✅ |
| 5 | `tieColor`, `tiePattern`, `bgColor` 있음 | ✅ |
| 6 | `expression`, `purpose`, `tie`, `background` 없음 | ✅ |
| 7 | `updateSpecButtons`에서 `['passport', 'id']` | ✅ |
| 8 | result.html `id_photo`/`resume` 0건 | ✅ |
| 9 | result.html `btn-spec-passport`, `btn-spec-id` 존재 | ✅ |
| 10 | server.js `set-format` 핸들링 존재 | ✅ |
| 11 | `COACHING_INSTRUCTIONS.passport` 존재 | ✅ |
| 12 | `STYLE_PROMPTS.passport` 존재 | ✅ |
| 13 | 세션 초기값 `photoStyle: 'passport'` | ✅ |
| 14 | `buildPrompt()` 삭제 안 됨 | ✅ |
| 15 | `node --check result.js` 통과 | ✅ |
| 16 | `node --check server.js` 통과 | ✅ |

---

**— iMac/막내2 Wave 3-B 완료 —**
