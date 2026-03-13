/**
 * 블로그 자동번역 — Gemini 2.0 Flash
 * 한국어 원본 → 일본어/영어 자동 생성
 */
import { ai, firestore, log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const TRANSLATE_PROMPT = {
  ja: `あなたは韓国語→日本語の専門翻訳者です。
以下のブログ記事を自然な日本語に翻訳してください。
- マークダウン書式はそのまま維持
- 技術用語は適切な日本語表現に
- SEOを意識した自然な文体
- タイトルと本文を両方翻訳`,

  en: `You are a professional Korean→English translator.
Translate the following blog post into natural English.
- Keep markdown formatting intact
- Use appropriate English technical terms
- Write in an SEO-friendly, natural tone
- Translate both title and body`,
};

export async function translateAndSaveBlogPost(slug, originalDoc) {
  const targetLangs = ['ja', 'en'];
  const blogCollection = firestore.collection('blog_posts');

  for (const lang of targetLangs) {
    try {
      const prompt = `${TRANSLATE_PROMPT[lang]}

---
# ${originalDoc.title}

${originalDoc.content}
---

JSON으로 응답:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내)"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 4096,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('빈 응답');

      const translated = JSON.parse(text);
      const translatedSlug = `${slug}-${lang}`;

      await blogCollection.doc(translatedSlug).set({
        slug: translatedSlug,
        title: translated.title,
        content: translated.content,
        summary: (translated.summary || originalDoc.summary || '').substring(0, 160),
        thumbnail: originalDoc.thumbnail || '',
        tags: originalDoc.tags || [],
        lang,
        published: originalDoc.published || false,
        author: originalDoc.author || 'MONKOS',
        createdAt: originalDoc.createdAt,
        updatedAt: new Date().toISOString(),
        viewCount: 0,
        originalSlug: slug,
        autoTranslated: true,
      });

      log(`[CMS] 자동번역 완료: ${slug} → ${translatedSlug} (${lang})`);
    } catch (err) {
      log(`[CMS] 자동번역 실패 (${lang}): ${err.message}`, 'ERROR');
    }
  }
}

// POST /api/admin/blog/:slug/translate — 수동 번역 트리거
export async function handleTranslate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const urlParts = req.url.split('/api/admin/blog/')[1];
    const slug = urlParts ? decodeURIComponent(urlParts.split('/translate')[0]) : null;
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'slug 필요' }));
    }

    const blogCollection = firestore.collection('blog_posts');
    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '글을 찾을 수 없습니다' }));
    }

    const data = doc.data();
    if (data.lang !== 'ko') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '한국어 원본만 번역할 수 있습니다' }));
    }

    // 백그라운드 번역 시작
    translateAndSaveBlogPost(slug, data).catch(() => {});

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `${slug} 번역 시작 (ja, en)` }));
  } catch (err) {
    log(`[CMS] 번역 트리거 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
