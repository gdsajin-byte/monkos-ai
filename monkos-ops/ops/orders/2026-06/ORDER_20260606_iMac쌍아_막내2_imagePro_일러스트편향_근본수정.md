---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내2
subject: image_pro 일러스트 편향 근본 수정 (네거티브 분리 + enhancePrompt:false)
status: 대기
portfolio: PF_IMAGEN
---

# 지시서: image_pro 일러스트 편향 근본 수정

> **배경**: 2026-06-05 INCIDENT. Premium 생성물이 일러스트/만화체로 나오는 현상.
> **원인 규명 완료**: 민아 진단 — 네거티브 프롬프트가 메인 프롬프트에 텍스트 합산됨 + localStorage 잔존. 막내3 진단 — 3/31 해결한 `enhancePrompt:false`가 리그레션.
> **어제 처리**: ultra 타임아웃만 수정·배포(3a5d2af0). 일러스트 편향 근본 수정은 미착수.

---

## 1. 수정 대상 3건

### 1-1. 백엔드 — `enhancePrompt: false` 추가

**파일**: `apps/monk_imagen4/backend/server.js`

**현재 (L110-114)**:
```javascript
const instances = [
  {
    prompt: prompt,
    ...(negativePrompt && { negativePrompt }),
  }
];
```

**수정**:
```javascript
const instances = [
  {
    prompt: prompt,
    ...(negativePrompt && { negativePrompt }),
    enhancePrompt: false,
  }
];
```

**이유**: Imagen 4 API의 `enhancePrompt` 기본값은 `true`로, 모델이 프롬프트를 자의적으로 해석·확장한다. 인물 사진 요청이 일러스트로 변환되는 핵심 원인. 3/31에 해결했던 건이 코드 리팩터링 과정에서 빠짐(리그레션).

### 1-2. 프론트엔드 — 네거티브 프롬프트 텍스트 합산 제거

현재 프론트엔드가 negativePrompt를 메인 프롬프트에 `. Avoid: {negativePrompt}` 형태로 합산하고 있다. 백엔드가 이미 `negativePrompt`를 별도 파라미터로 Imagen API에 전달하므로, 프론트엔드 합산은 이중 적용이며 프롬프트 오염의 원인이다.

**파일 A**: `apps/monk_imagen4/modules/imagen4-generator/Imagen4Generator.ts`

**현재 (L108-113)**:
```typescript
private async generateDirect(params: GenerationParams): Promise<GenerationResult[]> {
    // Integrate negative prompt into main prompt if provided
    let finalPrompt = params.prompt;
    if (params.negativePrompt && params.negativePrompt.trim()) {
      finalPrompt = `${params.prompt}. Avoid: ${params.negativePrompt}`;
    }
```

**수정**: `generateDirect()`에서 네거티브 합산 제거. prompt를 그대로 사용.
```typescript
private async generateDirect(params: GenerationParams): Promise<GenerationResult[]> {
    const finalPrompt = params.prompt;
```

L118도 수정 — `negativePrompt`를 별도 파라미터로 API에 전달하도록 변경:
```typescript
const response = await this.ai.models.generateImages({
  model: 'imagen-4.0-generate-001',
  prompt: finalPrompt,
  config: {
    numberOfImages: params.imageCount || 4,
    aspectRatio: params.aspectRatio || '1:1',
    safetyFilterLevel: 'block_low_and_above',
    personGeneration: 'allow_adult',
    ...(params.negativePrompt && { negativePrompt: params.negativePrompt }),
    enhancePrompt: false,
  }
});
```

**파일 B**: `apps/monk_imagen4/functions/api/generate.ts`

**현재 (L107)**:
```typescript
prompt: negativePrompt ? `${prompt}. Avoid: ${negativePrompt}` : prompt,
```

**수정**: 네거티브 합산 제거, 별도 파라미터로 분리.
```typescript
prompt: prompt,
...(negativePrompt && { negativePrompt }),
config: {
  ...config,
  enhancePrompt: false,
}
```
※ 이 파일의 전체 request body 구조를 확인하고 `config` 블록에 맞춰 넣을 것. Gemini generateImages API 스펙에 따라 `negativePrompt`가 config 안인지 바깥인지 확인.

### 1-3. 프론트엔드 — 모드 전환 시 네거티브 프롬프트 정리

**파일**: `apps/monk_imagen4/components/Sidebar.tsx`

**현재 (L84)**:
```tsx
onClick={() => { setMode(m.id as SynthesisMode); setError(null); }}
```

**수정**: 모드 전환 시 네거티브 프롬프트 초기화 추가.
```tsx
onClick={() => { setMode(m.id as SynthesisMode); setError(null); clearNegativePrompt(); }}
```

`clearNegativePrompt`는 이미 Sidebar props에 존재하므로 추가 구현 불요. props 구조 확인 후 연결만 하면 됨.

---

## 2. 검증 절차

1. **로컬 빌드**: `cd apps/monk_imagen4 && npm run build` — 타입 에러 없이 빌드 성공
2. **백엔드 실행**: `cd apps/monk_imagen4/backend && node server.js` — 기동 확인
3. **기능 검증** (가능한 범위):
   - `/api/generate` 엔드포인트에 테스트 요청: negativePrompt 별도 전달 확인
   - `enhancePrompt: false`가 Vertex AI 요청 payload에 포함되는지 로그 확인
4. **배포는 하지 않는다**. 코드 수정 + 커밋까지.

---

## 3. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 프로젝트 ID 하드코딩 금지. 기존 환경변수 패턴 유지.
- **ch5 배포**: 배포 금지. 코드 수정 + 커밋까지만. 배포는 작가님 판단.
- **ch7 3조**: 지시서 범위 밖 리팩터링 금지. 3건 수정만 실행.

---

## 4. 참조

| 용도 | 경로 |
|------|------|
| 백엔드 서버 | `apps/monk_imagen4/backend/server.js` (L110-114 instances, L117-126 parameters) |
| 프론트 Generator | `apps/monk_imagen4/modules/imagen4-generator/Imagen4Generator.ts` (L108-113 generateDirect, L56-66 generateViaProxy) |
| CF Workers API | `apps/monk_imagen4/functions/api/generate.ts` (L107 prompt 합산) |
| Sidebar 모드전환 | `apps/monk_imagen4/components/Sidebar.tsx` (L84) |
| PromptSection | `apps/monk_imagen4/components/PromptSection.tsx` (네거티브 UI) |
| 어제 세션로그 | `monkos-ops/ops/sessions/2026-06-05_iMac_쌍아.md` (L69, 75, 89, 91, 94) |
| 3/31 원본 해결 | 세션 기록: enhancePrompt:false로 일러스트 편향 해결 |

---

## 5. 커밋

```
[fix] image_pro 일러스트편향 근본수정 — enhancePrompt:false + 네거티브 프롬프트 분리
```

---

## 6. 완료 기준

- [ ] `server.js` — instances에 `enhancePrompt: false` 추가
- [ ] `Imagen4Generator.ts` — generateDirect()에서 네거티브 합산 제거, config에 negativePrompt 분리 + enhancePrompt:false
- [ ] `generate.ts` — 프롬프트 합산 제거, negativePrompt 별도 파라미터
- [ ] `Sidebar.tsx` — 모드 전환 시 clearNegativePrompt() 호출
- [ ] 빌드 성공 확인
- [ ] 커밋 완료
