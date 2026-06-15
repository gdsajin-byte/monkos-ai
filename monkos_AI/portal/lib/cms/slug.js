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

/**
 * 약한(깨진) 슬러그 판정 — 한글 제목에서 숫자/잔해만 남은 경우를 잡는다.
 * 예: `5-10`, `14-vs`, `47-20x`, `ai`, `3` → true (AI 슬러그 재생성 유도).
 * 4자 미만이거나 영문자가 3자 미만이면 약한 슬러그로 본다.
 */
function isWeakSlug(slug) {
  if (!slug || slug.length < 4) return true;
  if (slug.replace(/[^a-z]/g, '').length < 3) return true;
  return false;
}

export { generateSlug, generateSlugFromAI, sanitizeSlug, isWeakSlug };
