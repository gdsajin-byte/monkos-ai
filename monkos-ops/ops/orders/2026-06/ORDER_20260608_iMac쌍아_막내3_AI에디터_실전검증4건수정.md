---
type: order
date: 2026-06-08
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_PORTAL, PF_OPUS
status: 대기
---

# 지시서 — AI 에디터 Phase 1 실전 검증 4건 수정

**[2026-06-08 15:21 KST] iMac/쌍아 → iMac/막내3**

---

## 배경

민아가 rev 00266 prod 배포 후 실전 검증한 결과, 4개 기능 중 3개에 문제가 확인되었다:

| 기능 | 상태 | 문제 |
|------|------|------|
| 배포·엔드포인트 | ✅ | 3개 라우트 정상 |
| 이미지 생성 | ⚠️ | "배경색 가이드" 글인데 인물 얼굴 생성 — Gemini 프롬프트가 "증명사진"→사람으로 연상 (어휘 편향) |
| OG 썸네일 | ❌ | 한글이 전부 □□□ 두부 — Cloud Run 컨테이너에 한글 폰트 미설치 |
| SEO 제안 | ❌ | 500 에러 — Gemini가 \`\`\`json 코드펜스로 감싸 반환, 파싱 실패 |
| (부수) 파일명 | ⚠️ | 한글 제목 → makeSlug가 빈 문자열 → `ai_..._-.jpg` |

---

## 임무

### Fix 1: SEO 제안 JSON 파싱 (ai.js)

`handleAiSuggest`(ai.js:225~240)에서 `responseMimeType: 'application/json'` 추가:

```js
config: { maxOutputTokens: 256, temperature: 0.3, responseMimeType: 'application/json' },
```

이미 `translate.js:117`에서 동일 패턴 사용 중. 이러면 Gemini가 순수 JSON만 반환하여 코드펜스 문제 해결.

기존 jsonMatch fallback 파싱 로직은 방어용으로 유지.

### Fix 2: OG 썸네일 한글 폰트 (Dockerfile)

`monkos_AI/portal/Dockerfile`의 Stage 2(런타임)에 한글 폰트 설치:

```dockerfile
FROM node:20-slim

# 한글 폰트 — sharp SVG 텍스트 렌더링용
RUN apt-get update && apt-get install -y --no-install-recommends fonts-noto-cjk-extra && \
    rm -rf /var/lib/apt/lists/*
```

`fonts-noto-cjk-extra`는 Noto Sans CJK(한/중/일) 전체 포함. `--no-install-recommends`로 최소 설치.

**주의**: `LABEL` 뒤, `WORKDIR` 전에 배치. 이미지 크기 약 40MB 증가하나 한글 텍스트 렌더링에 필수.

### Fix 3: 이미지 프롬프트 글 유형 판별 (ai.js)

`handleAiImage`(ai.js:57~74)의 Gemini 프롬프트에 글 유형 판별 1단계 추가:

기존 Rules 섹션을 아래로 교체:

```
Rules:
- FIRST determine: is this article about PEOPLE (portraits, faces, human subjects) or about THINGS/CONCEPTS (objects, backgrounds, guides, processes, abstract ideas)?
- If about THINGS/CONCEPTS: absolutely NO people, NO faces, NO human figures. Focus purely on the subject matter (objects, colors, patterns, diagrams, spaces)
- If about PEOPLE: people are acceptable but use generic/diverse representations, never specific real individuals
- Output ONLY the prompt text, nothing else
- Max 200 words
- Be specific and visual
- Include style direction: ${styleHint}
- Do NOT include text/typography/words in the image
```

### Fix 4: makeSlug 한글 fallback (ai.js)

현재 `makeSlug`(ai.js:21~23)는 한글을 전부 제거해서 빈 문자열이 된다:

```js
function makeSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 40);
}
```

영문 slug가 비면 timestamp fallback 추가:

```js
function makeSlug(title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 40);
  return slug || `post-${Date.now()}`;
}
```

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `lib/cms/ai.js` | Fix 1(suggest responseMimeType) + Fix 3(프롬프트 판별) + Fix 4(makeSlug fallback) |
| `Dockerfile` | Fix 2(fonts-noto-cjk-extra 설치) |

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키 생성/추측 금지.
- 헌법 3조 1항: 매 턴 `date`로 KST 취득.
- ch7 1조: 지시서 범위 외 파일 수정 금지.
- ch5 2조: 배포는 `deploy.sh` 경유 필수. 코드 수정만, 배포는 별도 승인.

---

## 검증

수정 후 별도 배포·검증은 쌍아가 진행한다. 코드 수정만 납품.

---

## 납품

- COMPLETION 보고서 불필요 — 수정 완료 후 변경 파일 목록과 함께 보고만.
- 완료 후 `✅❌💡⏳📁🔀` 형식 보고.
