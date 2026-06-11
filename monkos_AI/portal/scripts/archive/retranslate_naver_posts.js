/**
 * 네이버 복구 콘텐츠 재번역 — KO 원본 → JA/EN 덮어쓰기
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/retranslate_naver_posts.js
 *   cd monkos_AI/portal && node scripts/retranslate_naver_posts.js --execute
 *
 * 기본: dry-run (대상 목록만 출력). --execute 시 실제 번역 실행.
 * ⚠️ 프로덕션 Firestore + Gemini API 사용.
 *   GCP 인증 필요: gcloud auth application-default login
 *
 * 대상: source='naver' + lang='ko' 원본 (막내1 복구 완료 기준)
 */

import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';

const execute = process.argv.includes('--execute');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');
const ai = new GoogleGenAI({ vertexai: true, project: 'monkos', location: 'us-central1' });

const DELAY_MS = 500;

// translate.js 동일 프롬프트
const TRANSLATE_PROMPT = {
  ja: `あなたは韓国語→日本語の専門翻訳者です。
以下のブログ記事を自然な日本語に翻訳してください。
- マークダウン書式はそのまま維持
- 技術用語は適切な日本語表現に
- SEOを意識した自然な文体
- タイトルと本文を両方翻訳
- 画像マークダウン ![alt](URL) は絶対に削除・変更しないこと。URLはそのまま保持`,

  en: `You are a professional Korean→English translator.
Translate the following blog post into natural English.
- Keep markdown formatting intact
- Use appropriate English technical terms
- Write in an SEO-friendly, natural tone
- Translate both title and body
- NEVER remove or modify image markdown ![alt](URL). Preserve all image URLs exactly as-is`,
};

const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内)"}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars)"}`,
};

async function translatePost(slug, originalDoc, lang) {
  const prompt = `${TRANSLATE_PROMPT[lang]}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang]}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 8192,
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('빈 응답');

  const translated = JSON.parse(text);

  // 번역 검증
  if (translated.title === originalDoc.title) {
    throw new Error('원문 그대로 반환됨');
  }

  // 이미지 보존 검증
  const originalImages = (originalDoc.content.match(/!\[.*?\]\(.*?\)/g) || []);
  const translatedImages = (translated.content.match(/!\[.*?\]\(.*?\)/g) || []);

  if (originalImages.length > translatedImages.length) {
    const missingImages = originalImages.filter(img => {
      const url = img.match(/\((.*?)\)/)?.[1];
      return url && !translated.content.includes(url);
    });
    if (missingImages.length > 0) {
      translated.content += '\n\n' + missingImages.join('\n\n');
      console.log(`    이미지 ${missingImages.length}개 복원`);
    }
  }

  return translated;
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  네이버 복구 콘텐츠 재번역`);
  console.log(`  모드: ${execute ? '⚠️  EXECUTE (실제 번역+저장)' : '🔍 DRY RUN (대상 목록만)'}`);
  console.log(`========================================\n`);

  // 네이버 KO 원본 조회
  const snap = await blogCollection
    .where('source', '==', 'naver')
    .where('lang', '==', 'ko')
    .get();

  console.log(`[조회] 네이버 KO 원본: ${snap.docs.length}건\n`);

  if (snap.docs.length === 0) {
    console.log('대상 없음. 종료.');
    return;
  }

  // 대상 목록 출력
  const targets = snap.docs.map(doc => ({
    slug: doc.id,
    title: doc.data().title,
    updatedAt: doc.data().updatedAt,
  }));

  for (const t of targets) {
    console.log(`  ${t.slug}`);
    console.log(`    제목: ${t.title.substring(0, 60)}`);
    console.log(`    수정일: ${t.updatedAt}\n`);
  }

  if (!execute) {
    console.log(`🔍 DRY RUN 완료. 재번역하려면 --execute 플래그를 추가하세요.`);
    console.log(`   node scripts/retranslate_naver_posts.js --execute\n`);
    return;
  }

  // 실제 번역 실행
  let jaOk = 0, enOk = 0, errors = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const slug = doc.id;
    console.log(`\n[번역] ${slug}`);

    for (const lang of ['ja', 'en']) {
      const translatedSlug = `${slug}-${lang}`;
      try {
        console.log(`  → ${lang} 번역 중...`);
        const translated = await translatePost(slug, data, lang);

        const existingDoc = await blogCollection.doc(translatedSlug).get();
        const now = new Date().toISOString();

        if (existingDoc.exists) {
          await blogCollection.doc(translatedSlug).update({
            title: translated.title,
            content: translated.content,
            summary: (translated.summary || '').substring(0, 160),
            thumbnail: data.thumbnail || '',
            tags: data.tags || [],
            published: data.published || false,
            updatedAt: now,
            translatedAt: now,
            autoTranslated: true,
          });
          console.log(`  ✅ ${lang} 업데이트: ${translatedSlug}`);
        } else {
          await blogCollection.doc(translatedSlug).set({
            slug: translatedSlug,
            title: translated.title,
            content: translated.content,
            summary: (translated.summary || '').substring(0, 160),
            thumbnail: data.thumbnail || '',
            tags: data.tags || [],
            lang,
            published: data.published || false,
            author: data.author || 'MONKOS',
            createdAt: now,
            updatedAt: now,
            translatedAt: now,
            viewCount: 0,
            originalSlug: slug,
            autoTranslated: true,
          });
          console.log(`  ✅ ${lang} 신규 생성: ${translatedSlug}`);
        }

        if (lang === 'ja') jaOk++; else enOk++;
        await new Promise(r => setTimeout(r, DELAY_MS));
      } catch (err) {
        errors++;
        console.log(`  ❌ ${lang} 실패: ${err.message}`);
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`  재번역 완료`);
  console.log(`  JA: ${jaOk}건 / EN: ${enOk}건 / 에러: ${errors}건`);
  console.log(`========================================\n`);
}

main().catch(err => {
  console.error('[retranslate] 에러:', err.message);
  process.exit(1);
});
