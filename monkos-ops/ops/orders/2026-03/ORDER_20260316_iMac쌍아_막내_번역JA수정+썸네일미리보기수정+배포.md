---
type: ORDER
id: ORDER_20260316_iMac쌍아_막내_번역JA수정+썸네일미리보기수정+배포
date: 2026-03-16
from: iMac/쌍아
to: 막내
priority: P0
status: 대기
---

# 긴급 — JA 자동번역 수정 + 썸네일 미리보기 수정 + 배포

## Task 1: JA 자동번역 — 한글 그대로 나오는 이슈

대상: `monkos_AI/portal/lib/cms/translate.js`

**현상:** KO 발행 시 EN은 정상 번역, JA는 한글 원문이 그대로 저장됨.

**원인 추정:** 프롬프트 마지막 `JSON으로 응답:` 지시가 한국어라 JA 번역 시 Gemini가 혼동.

**수정 1: JA 프롬프트에 JSON 응답 지시를 일본어로 변경**

73행의 공통 JSON 지시 부분을 언어별로 분리:

```javascript
// 기존 (73행)
JSON으로 응답:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내)"}

// 변경: 언어별 JSON 지시
const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内)"}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars)"}`,
  ko: `다음 JSON 형식으로 응답하세요:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내)"}`,
};
```

프롬프트 조립 (64행~) 수정:
```javascript
const prompt = `${TRANSLATE_PROMPT[promptKey] || TRANSLATE_PROMPT[lang]}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang] || JSON_INSTRUCTION.en}`;
```

**수정 2: 번역 실패 시 에러 로그 강화 + 원문 저장 방지**

```javascript
const translated = JSON.parse(text);

// 번역 검증: 타이틀이 원본과 동일하면 번역 실패로 판단
if (translated.title === originalDoc.title) {
  log(`[CMS] 자동번역 실패 — 원문 그대로 반환됨 (${lang})`, 'ERROR');
  continue; // 저장하지 않고 스킵
}
```

**수정 3: `.catch(() => {})` → 에러 로그 유지**

blog.js 129행, 176행:
```javascript
// 기존
translateAndSaveBlogPost(slug, post).catch(() => {});

// 변경
translateAndSaveBlogPost(slug, post).catch(err => {
  log(`[CMS] 백그라운드 번역 에러: ${err.message}`, 'ERROR');
});
```

---

## Task 2: 썸네일 미리보기 — 이미지 반영 안 되는 이슈

대상: `monkos_AI/portal/public/admin/blog-edit.html`

**현상:** 에디터에 이미지를 삽입해도 좌측 미리보기 카드의 썸네일이 갱신되지 않음.

**원인:**
1. `insertImage()` 호출 후 `updatePreview()`가 호출되지 않음
2. WYSIWYG 모드에서 `editor.getMarkdown()`이 이미지 삽입 직후에 마크다운 변환이 지연될 수 있음
3. `editor.on('change')` 이벤트가 WYSIWYG 이미지 삽입에서 바로 트리거되지 않을 수 있음

**수정:**

### 2-1. insertImage 후 미리보기 갱신

```javascript
function insertImage(url, name) {
  editor.exec('addImage', { imageUrl: url, altText: name || 'image' });
  showToast('이미지 삽입 완료');
  // 마크다운 변환 지연 감안
  setTimeout(updatePreview, 300);
}
```

### 2-2. updatePreview에서 WYSIWYG HTML 직접 파싱 (마크다운 fallback)

```javascript
function updatePreview() {
  const title = document.getElementById('title').value || '제목 미입력';
  const summary = document.getElementById('summary').value || '요약 미입력';
  const thumb = document.getElementById('thumbnail').value;
  document.getElementById('previewTitle').textContent = title;
  document.getElementById('previewSummary').textContent = summary;
  const thumbEl = document.getElementById('previewThumb');

  if (thumb) {
    thumbEl.innerHTML = `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">`;
    return;
  }

  // 1차: WYSIWYG HTML에서 직접 img 태그 추출
  const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
  if (wwContainer) {
    const firstImg = wwContainer.querySelector('img');
    if (firstImg && firstImg.src) {
      thumbEl.innerHTML = `<img src="${firstImg.src}" style="width:100%;height:100%;object-fit:cover">`;
      return;
    }
  }

  // 2차: 마크다운에서 추출 (fallback)
  const content = editor.getMarkdown();
  const match = content.match(/!\[.*?\]\((.*?)\)/);
  if (match) {
    thumbEl.innerHTML = `<img src="${match[1]}" style="width:100%;height:100%;object-fit:cover">`;
  } else {
    thumbEl.innerHTML = '<span style="color:var(--text-dim);font-size:11px">썸네일 없음</span>';
  }
}
```

핵심: **WYSIWYG DOM에서 직접 `<img>` 태그를 찾는 것**이 마크다운 파싱보다 확실합니다.

### 2-3. save() 함수의 썸네일 자동 추출도 동일하게 수정

```javascript
// 썸네일 미지정 시 본문 첫 이미지 자동 추출
let thumbnail = document.getElementById('thumbnail').value.trim();
if (!thumbnail) {
  // WYSIWYG DOM에서 직접 추출
  const wwContainer = document.querySelector('.toastui-editor-ww-container .ProseMirror');
  if (wwContainer) {
    const firstImg = wwContainer.querySelector('img');
    if (firstImg && firstImg.src) {
      thumbnail = firstImg.src;
    }
  }
  // fallback: 마크다운
  if (!thumbnail) {
    const imgMatch = content.match(/!\[.*?\]\((.*?)\)/);
    if (imgMatch) thumbnail = imgMatch[1];
  }
  if (thumbnail) {
    document.getElementById('thumbnail').value = thumbnail;
    updatePreview();
  }
}
```

---

## Task 3: 커밋 + 프로덕션 배포

1. 커밋: `[blog] JA 번역 수정 + 썸네일 미리보기 WYSIWYG 대응`
2. `deploy.sh prod` 배포
3. 검증:
   - KO 글 발행 → JA 번역 결과가 일본어인지 확인
   - 에디터에 이미지 삽입 → 좌측 미리보기 카드에 썸네일 즉시 반영
   - 썸네일 미지정 상태에서 발행 → 본문 첫 이미지 자동 세팅 확인

## ⚠️ 준수 조항

- translate.js의 번역 검증 로직: title 비교만으로는 불완전할 수 있으나, 1차 방어로 충분
- `--to-latest` 사용 금지
