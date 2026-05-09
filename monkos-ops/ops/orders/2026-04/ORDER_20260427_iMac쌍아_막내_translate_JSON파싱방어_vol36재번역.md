---
type: order
date: 2026-04-27
from: iMac/쌍아
to: iMac/막내
subject: translate.js Gemini JSON 파싱 방어 + vol36 재번역 + 35건 일괄 재번역
priority: 긴급
pf: PF_CITADEL
phase: 2.3
---

# translate.js JSON 파싱 방어 + 재번역

**[2026-04-27 16:47 KST] iMac/쌍아 → iMac/막내**

---

## 배경

vol36(4/27 한송이 발행)이 JA/EN 번역 실패. 원인:

```
[ERROR] 자동번역 실패 (ja): Bad escaped character in JSON at position 722
[ERROR] 자동번역 실패 (en): Bad escaped character in JSON at position 1011
```

Gemini가 `responseMimeType: 'application/json'`으로 반환한 JSON 안에 마크다운 본문의 이스케이프 안 된 특수문자(백슬래시, 따옴표 등)가 포함 → `JSON.parse` 실패.

이건 오늘 slug 스키마 변경과 무관한 **기존부터 잠재된 문제**. 마크다운 본문이 복잡할수록 발생 확률 높음.

---

## 작업 1: translate.js JSON 파싱 방어 코드

**파일**: `monkos_AI/portal/lib/cms/translate.js`

**현재 (103행 부근)**:
```javascript
const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) throw new Error('빈 응답');
const translated = JSON.parse(text);
```

**변경**: JSON.parse 실패 시 3단계 fallback:

### Fallback 1: JSON 수리 (이스케이프 문자 정제)

```javascript
let translated;
try {
  translated = JSON.parse(text);
} catch (e1) {
  // Fallback 1: 이스케이프 문자 수리
  try {
    const sanitized = text
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')  // 잘못된 이스케이프 → 이중 이스케이프
      .replace(/[\x00-\x1f]/g, ' ');             // 제어문자 제거
    translated = JSON.parse(sanitized);
    log(`[CMS] JSON 수리 성공 (${lang})`);
  } catch (e2) {
    // Fallback 2로
  }
}
```

### Fallback 2: regex 추출

JSON 파싱이 완전 실패해도 title/content/summary를 regex로 추출:

```javascript
if (!translated) {
  try {
    const titleMatch = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
    const tagsMatch = text.match(/"tags"\s*:\s*\[(.*?)\]/);
    
    if (titleMatch && contentMatch) {
      translated = {
        title: titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
        summary: summaryMatch ? summaryMatch[1].replace(/\\"/g, '"') : '',
        tags: tagsMatch ? tagsMatch[1].match(/"([^"]*)"/g)?.map(t => t.replace(/"/g, '')) || [] : [],
      };
      log(`[CMS] JSON regex 추출 성공 (${lang})`);
    }
  } catch (e3) {
    // 최종 실패
  }
}

if (!translated) {
  throw new Error(`JSON 파싱 실패 (원본+수리+regex 전부 실패): ${e1.message}`);
}
```

### Fallback 3: 제목만이라도 저장 (최소 보존)

title만 추출 가능한 경우에도 content 없이 저장하진 않음 → 로그만 남기고 skip.
단, 에러 로그에 Gemini 원문 앞 500자를 포함시켜 디버깅 가능하게:

```javascript
log(`[CMS] 번역 JSON 원문 (앞 500자): ${text.substring(0, 500)}`, 'ERROR');
```

---

## 작업 2: vol36 수동 재번역

방어 코드 적용 후 vol36 재번역:

```bash
cd monkos_AI/portal && node -e "
import { translateAndSaveBlogPost } from './lib/cms/translate.js';
import { Firestore } from '@google-cloud/firestore';
const db = new Firestore({ projectId: 'monkos' });
const doc = await db.collection('blog_posts').doc('vol36-kr').get();
await translateAndSaveBlogPost('vol36-kr', doc.data());
const ja = await db.collection('blog_posts').doc('vol36-ja').get();
const en = await db.collection('blog_posts').doc('vol36-en').get();
console.log('vol36-ja:', ja.exists ? 'OK' : 'FAIL');
console.log('vol36-en:', en.exists ? 'OK' : 'FAIL');
"
```

**확인**: vol36-ja, vol36-en 생성 확인 + monkos.ai/ja/blog/vol36, /en/blog/vol36 접속 200 OK

---

## 작업 3: 마이그레이션 원본 35건 일괄 재번역

vol36 성공 확인 후, B-2 마이그레이션된 원본 35건에 대해 일괄 재번역.

기존 `retranslate_crosscontamination.js` 스크립트를 수정하거나 새 스크립트로:
- 35건의 `-kr` doc을 순회
- 각각 `translateAndSaveBlogPost` 호출
- 1초 간격 rate limit
- 결과: `{base}-ja`, `{base}-en` doc 생성 확인

**이미 영문 slug로 정상 생성된 JA/EN 번역본이 있는 원본**: translate.js가 `existingDoc.exists` 체크 후 update하므로 중복 doc은 생성 안 됨 (기존 내용 갱신).

---

## 작업 4: 배포

```bash
cd monkos_AI/portal && ./deploy.sh prod
```

---

## 완료 보고

```
✅/❌ 작업 1: JSON 파싱 방어 코드 (3단계 fallback)
✅/❌ 작업 2: vol36 JA/EN 번역 — vol36-ja: OK/FAIL, vol36-en: OK/FAIL
✅/❌ 작업 3: 35건 일괄 재번역 — 성공 N건 / 실패 N건 (실패 원인)
✅/❌ 작업 4: 배포 rev XXXXX
📁 변경 파일: translate.js
💡 Fallback 경로 사용 건수: N건 (수리 N / regex N)
```

---

## ⚠️ 준수 조항

- **법률 5장 2조**: deploy.sh 경유 필수
- **헌법 4조 1항**: API 키 하드코딩 금지. Vertex AI ADC 사용
- Gemini rate limit: 호출 간 1초 sleep
