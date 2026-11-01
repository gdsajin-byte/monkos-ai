/**
 * 블로그 자동번역 — Gemini 2.0 Flash
 * 한국어 원본 → 일본어/영어 자동 생성
 */
import { ai, firestore, log, TEXT_MODEL } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { notifySearchEngines } from './seo.js';

function hasKorean(str) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str);
}

async function ensureEnglishBase(title, candidateBase) {
  if (!hasKorean(candidateBase)) return candidateBase;
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. First TRANSLATE the blog title meaning into English, then convert to a URL slug. Do NOT romanize Korean — translate the MEANING. Lowercase, hyphens only, max 60 chars, ASCII only. Return ONLY the slug.\n\nTitle: ${title}` }] }],
      config: { maxOutputTokens: 64, temperature: 0.1 },
    });
    const slug = (response.candidates?.[0]?.content?.parts?.[0]?.text || '')
      .trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
    if (slug.length >= 3) return slug;
  } catch (err) {
    log(`[CMS] translate baseSlug AI 생성 실패: ${err.message}`, 'WARN');
  }
  return 'post-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

const TRANSLATE_PROMPT = {
  // KO 원본 → JA/EN
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

  // JA 원본 → KO/EN
  ja_to_ko: `あなたは日本語→韓国語の専門翻訳者です。
以下のブログ記事を自然な韓国語に翻訳してください。
- マークダウン書式はそのまま維持
- 技術用語は適切な韓国語表現に
- SEOを意識した自然な文体
- タイトルと本文を両方翻訳
- 画像マークダウン ![alt](URL) は絶対に削除・変更しないこと。URLはそのまま保持`,

  ja_to_en: `You are a professional Japanese→English translator.
Translate the following blog post into natural English.
- Keep markdown formatting intact
- Use appropriate English technical terms
- Write in an SEO-friendly, natural tone
- Translate both title and body
- NEVER remove or modify image markdown ![alt](URL). Preserve all image URLs exactly as-is`,
};

const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内、SEO用)", "tags": ["日本語タグ1", "日本語タグ2", "日本語タグ3"]}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars, for SEO)", "tags": ["English tag1", "English tag2", "English tag3"]}`,
  ko: `다음 JSON 형식으로 응답하세요:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내, SEO용)", "tags": ["한국어 태그1", "한국어 태그2", "한국어 태그3"]}`,
};

export async function translateAndSaveBlogPost(slug, originalDoc) {
  const srcLang = originalDoc.lang || 'ko';
  let targetLangs;
  if (srcLang === 'ko') {
    targetLangs = ['ja', 'en'];
  } else if (srcLang === 'ja') {
    targetLangs = ['ko', 'en'];
  } else {
    targetLangs = ['ko', 'ja'];
  }

  const blogCollection = firestore.collection('blog_posts');

  for (const lang of targetLangs) {
    try {
      // 원본 언어에 따라 프롬프트 키 결정
      let promptKey;
      if (srcLang === 'ko') {
        promptKey = lang; // 'ja' or 'en'
      } else if (srcLang === 'ja') {
        promptKey = lang === 'ko' ? 'ja_to_ko' : 'ja_to_en';
      } else {
        promptKey = lang; // EN 원본 — 미래용 fallback
      }
      const originalTags = (originalDoc.tags || []).join(', ');
      const prompt = `${TRANSLATE_PROMPT[promptKey] || TRANSLATE_PROMPT[lang]}

Original tags for reference: ${originalTags}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang] || JSON_INSTRUCTION.en}`;

      const response = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 32768,
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('빈 응답');

      let translated;
      try {
        translated = JSON.parse(text);
      } catch (parseErr) {
        try {
          const sanitized = text
            .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
            .replace(/[\x00-\x1f]/g, ' ');
          translated = JSON.parse(sanitized);
          log(`[CMS] JSON 수리 성공 (${lang})`);
        } catch {
          const titleMatch = text.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const contentMatch = text.match(/"content"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/);
          const summaryMatch = text.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          const tagsMatch = text.match(/"tags"\s*:\s*\[(.*?)\]/);
          if (titleMatch && contentMatch) {
            translated = {
              title: titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
              content: contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
              summary: summaryMatch ? summaryMatch[1].replace(/\\"/g, '"') : '',
              tags: tagsMatch ? tagsMatch[1].match(/"([^"]*)"/g)?.map(t => t.replace(/"/g, '')) || [] : [],
            };
            log(`[CMS] JSON regex 추출 성공 (${lang})`);
          } else {
            log(`[CMS] 번역 JSON 원문 (앞 500자): ${text.substring(0, 500)}`, 'ERROR');
            throw new Error(`JSON 파싱 실패 (원본+수리+regex 전부 실패): ${parseErr.message}`);
          }
        }
      }

      // 번역 검증: 타이틀이 원본과 동일하면 번역 실패로 판단
      if (translated.title === originalDoc.title) {
        log(`[CMS] 자동번역 실패 — 원문 그대로 반환됨 (${lang})`, 'ERROR');
        continue;
      }

      // 이미지 보존 검증: 원본 이미지가 번역에서 누락되면 끝에 복원
      const originalImages = (originalDoc.content.match(/!\[.*?\]\(.*?\)/g) || []);
      const translatedImages = (translated.content.match(/!\[.*?\]\(.*?\)/g) || []);

      if (originalImages.length > translatedImages.length) {
        const missingImages = originalImages.filter(img => {
          const url = img.match(/\((.*?)\)/)?.[1];
          return url && !translated.content.includes(url);
        });
        if (missingImages.length > 0) {
          translated.content += '\n\n' + missingImages.join('\n\n');
          log(`[CMS] 이미지 ${missingImages.length}개 복원 (${lang})`);
        }
      }

      let baseSlug = (originalDoc.baseSlug || slug).replace(/-(kr|ja|en)$/, '');
      if (hasKorean(baseSlug)) {
        baseSlug = await ensureEnglishBase(originalDoc.title, baseSlug);
        log(`[CMS] 한글 baseSlug 교정: "${slug}" → "${baseSlug}"`);
      }
      const translatedSlug = `${baseSlug}-${lang}`;
      const existingDoc = await blogCollection.doc(translatedSlug).get();
      const now = new Date().toISOString();

      if (existingDoc.exists) {
        await blogCollection.doc(translatedSlug).update({
          title: translated.title,
          content: translated.content,
          summary: (translated.summary || originalDoc.summary || '').substring(0, 160),
          thumbnail: originalDoc.thumbnail || '',
          tags: translated.tags && translated.tags.length > 0 ? translated.tags : (originalDoc.tags || []),
          published: originalDoc.published || false,
          updatedAt: now,
          translatedAt: now,
          autoTranslated: true,
        });
      } else {
        await blogCollection.doc(translatedSlug).set({
          slug: translatedSlug,
          title: translated.title,
          content: translated.content,
          summary: (translated.summary || originalDoc.summary || '').substring(0, 160),
          thumbnail: originalDoc.thumbnail || '',
          tags: translated.tags && translated.tags.length > 0 ? translated.tags : (originalDoc.tags || []),
          lang,
          published: originalDoc.published || false,
          author: originalDoc.author || 'MONKOS',
          createdAt: now,
          updatedAt: now,
          translatedAt: now,
          viewCount: 0,
          originalSlug: baseSlug,
          autoTranslated: true,
        });
      }

      if (originalDoc.published) {
        const translatedUrl = `https://monkos.ai/${lang}/blog/${baseSlug}`;
        notifySearchEngines(translatedUrl);
      }

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
    const srcLang = data.lang || 'ko';
    const targets = srcLang === 'ko' ? ['ja', 'en'] : srcLang === 'ja' ? ['ko', 'en'] : ['ko', 'ja'];

    // 백그라운드 번역 시작
    translateAndSaveBlogPost(slug, data).catch(err => {
      log(`[CMS] 백그라운드 번역 에러: ${err.message}`, 'ERROR');
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `${slug} 번역 시작 (${targets.join(', ')})` }));
  } catch (err) {
    log(`[CMS] 번역 트리거 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
