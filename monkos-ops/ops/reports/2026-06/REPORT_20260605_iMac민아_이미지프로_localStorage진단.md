---
type: report
date: 2026-06-05
device: iMac
agent: 민아
portfolio: PF_IDPHOTO
subject: "[INCIDENT P0] image_pro 만화체 출력 — localStorage 네거티브 주입 원인 확정"
status: 완료
---

# REPORT — image_pro 만화체 출력 원인 확정 (localStorage 네거티브 주입)

**[2026-06-05 19:44 KST] iMac/민아 → 작가님**

---

## 0. 결론

image.monkos.ai의 만화체 출력은 **브라우저 localStorage에 잔류한 anti-photorealistic 네거티브 프롬프트**가 원인이다.

```
localStorage key: monk_negative_prompt
value: "realistic face, real person, photograph, blurry, low quality, text, watermark"
```

프론트엔드(index-v6.js)가 이 값을 매 생성마다 메인 프롬프트에 `. Negative: {값}` 형태로 합쳐서 Vertex AI에 전송. Imagen 4가 "realistic face, real person, photograph"를 회피 지시로 해석하여 일러스트체를 출력했다.

**즉시 조치**: `localStorage.removeItem('monk_negative_prompt')` → 페이지 새로고침으로 정상화.

---

## 1. 발견 경위

### 1-1. 서버 로그 비교

| 시점 | 프롬프트 (서버 수신, 100자 절사) | 결과 |
|------|------|------|
| 06-04 (어제, 정상) | `CRITICAL INSTRUCTION: Maintain the exact facial features...` | VARIATION fixedPrompt가 앞에 붙어 네거티브를 가림 |
| 06-05 (오늘, 만화체) | `한국여성 41세 . Negative: realistic face, real person, photograph...` | fixedPrompt 빠지고 네거티브만 노출 |

### 1-2. 대조 실험

| 조건 | 모델 | 결과 |
|------|------|------|
| API 직접 호출 (네거티브 없음) | fast | **포토리얼** ✅ |
| API 직접 호출 (네거티브 없음) | ultra | **포토리얼** ✅ (12.6s) |
| 작가님 브라우저 (네거티브 있음) | ultra | **만화체** ❌ |

→ 동일 프롬프트, 동일 서버, 동일 모델에서 네거티브 유무만으로 출력 스타일이 결정됨.

### 1-3. localStorage 실측 (작가님 F12 Console)

```javascript
localStorage.getItem('monk_negative_prompt')
// → 'realistic face, real person, photograph, blurry, low quality, text, watermark'

localStorage.getItem('monk_fixed_prompt')
// → ''
```

---

## 2. 값의 출처

- 코드에 하드코딩: **아님** (index-v5.js, index-v6.js 모두 "realistic" 0건)
- 서버 기본값: **아님** (서버는 `negativePrompt=''` 기본)
- 씬 프리셋: **아님** (studio/outdoor/dramatic 프리셋에 "realistic" 없음)
- VARIATION 프리셋: **아님** (fixedPrompt만 존재, 네거티브 필드 없음)
- **추정**: 이전 사용자 또는 과거 테스트 과정에서 UI의 Negative Prompt 필드에 수동 입력 → `localStorage.setItem('monk_negative_prompt', ...)` → 무기한 보존

---

## 3. 구조적 결함 (재발 방지 필요)

### 3-1. 네거티브를 프롬프트 텍스트에 합침

**현행** (index-v6.js):
```javascript
B = [k, O].filter(Boolean).join(". ")    // fixedPrompt + userPrompt
Y = w ? `${B}. Negative: ${w}` : B       // + negative를 텍스트로 합침
Kf.generateBatch(Y, {aspectRatio, safetyLevel, model})  // 합친 채로 전송
```

서버(server.js)는 `negativePrompt`를 별도 파라미터로 받아 Vertex AI에 전달하는 구조가 이미 있다:
```javascript
negativePrompt = ''  // req.body에서 수신
instances = [{ prompt, ...(negativePrompt && { negativePrompt }) }]  // 별도 전달
```

**문제**: 프론트엔드가 이 별도 경로를 쓰지 않고, 프롬프트 문자열에 합쳐서 보냄.

### 3-2. localStorage 무기한 보존

- `monk_negative_prompt`가 한 번 설정되면 모드 전환, 페이지 새로고침, 시간 경과와 무관하게 영구 잔류
- T2I(NEW GENERATE) 모드에서 불필요한 네거티브가 계속 딸려감
- UI에서 Negative Prompt 필드가 접혀 있어 사용자 인지 불가

### 3-3. 수정 방향

| # | 수정 | 영향 | 난이도 |
|---|------|------|--------|
| 1 | 프론트에서 `negativePrompt`를 config 객체로 분리 전송 | 서버가 Vertex AI `negativePrompt` 파라미터로 정상 처리 | 프론트 수정 |
| 2 | T2I 모드 진입 시 부적절한 네거티브 초기화 | VARIATION→T2I 전환 시 잔류 방지 | 프론트 수정 |
| 3 | `enhancePrompt: false` 서버에 추가 | 3/31 P0 권고 미반영 건 (막내3 보고와 동일) | 서버 1줄 |

---

## 4. 병존 이슈 (본 건과 별개)

| 이슈 | 상태 | 원인 | 담당 |
|------|------|------|------|
| RESOURCE_EXHAUSTED | 진행중 | Vertex AI Imagen 4 용량/쿼터 소진 | Google 쪽 (쿼터 확인 필요) |
| enhancePrompt 미설정 | 미적용 | 3/31 P0 권고 미머지 | 막내3 REPORT에서 이미 단정 |
| 06-02 API 키 유출 오더 미완료 | 진행중 | 막내2 COMPLETION 미수 | 재가동 필요 |
| 06-02 OAuth Testing 오더 미완료 | 진행중 | 막내3 COMPLETION 미수 | 재가동 필요 |

---

## 5. 진단 과정에서의 교훈

1. **실서비스 도메인 확인**: `monk.kr`(CF Pages)와 `image.monkos.ai`(Cloud Run)는 localStorage가 다르다. 잘못된 도메인에서 조회하면 빈 값이 나온다.
2. **배포된 JS 버전 확인**: 리포 HTML은 v5를 참조하나 실서비스는 v6. 분석 대상을 잘못 잡으면 헛수고.
3. **서버 로그 절사**: `prompt.substring(0, 100)`으로 100자 절사 — 네거티브가 프롬프트 뒤에 붙어 로그에서 안 보일 수 있다.
4. **막내3 보고와의 상호 보완**: 막내3는 서버 코드/모델/enhancePrompt 축에서 진단, 민아는 프론트엔드/localStorage/실 요청 축에서 진단. 양쪽이 합쳐져야 전체 그림이 완성됨.

---

✅ 원인 확정 (localStorage 네거티브 주입)
✅ 즉시 조치 방안 제시 (localStorage 제거)
💡 구조적 수정 3건 식별 (프론트 네거티브 분리, 모드 전환 초기화, enhancePrompt)
⏳ RESOURCE_EXHAUSTED — Vertex AI 쿼터 확인 별도 필요
📁 `monkos-ops/ops/reports/2026-06/REPORT_20260605_iMac민아_이미지프로_localStorage진단.md`
📁 `monkos-ops/ops/sessions/2026-06/2026-06-05_iMac_민아.md`
