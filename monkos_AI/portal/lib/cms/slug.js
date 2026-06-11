/**
 * 블로그 슬러그 생성·정규화 단일 모듈
 */

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function generateSlugFromAI(aiInstance, title) {
  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. First TRANSLATE the blog title meaning into English, then convert to a URL slug. Do NOT romanize Korean — translate the MEANING. Lowercase, hyphens only, max 60 chars, ASCII only. Return ONLY the slug.\n\nTitle: ${title}` }] }],
      config: { maxOutputTokens: 64, temperature: 0.1 },
    });
    const slug = (response.candidates?.[0]?.content?.parts?.[0]?.text || '')
      .trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
    if (slug.length >= 3) return slug;
  } catch (err) {
    console.warn(`[CMS] AI slug 생성 실패: ${err.message}`);
  }
  return 'post-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

function sanitizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export { generateSlug, generateSlugFromAI, sanitizeSlug };
