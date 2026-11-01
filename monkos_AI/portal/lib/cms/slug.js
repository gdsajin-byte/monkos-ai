/**
 * 블로그 슬러그 생성·정규화 단일 모듈
 */
import { TEXT_MODEL } from '../shared/config.js';

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
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. First TRANSLATE the blog title meaning into English, then convert to a URL slug. Do NOT romanize Korean — translate the MEANING. Lowercase, hyphens only, max 60 chars, ASCII only. Return ONLY the slug.\n\nTitle: ${title}` }] }],
      // 3.x 사고 토큰이 64 상한을 잠식해 슬러그가 잘린다(10-22 실측 finish=MAX_TOKENS) → 사고 최소
      config: { maxOutputTokens: 64, temperature: 0.1, thinkingConfig: { thinkingLevel: 'MINIMAL' } },
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

/**
 * URL 형태 입력 판정 — 2026-07-25 재발 방지 (CITADEL P3).
 * 사고: 슬러그 입력란에 `https://monkos.ai/admin/blog-edit.html`이 통째로 들어가
 *       위생처리만 거쳐 `https:monkosaiadminblog-edithtml`로 색인됐다(ko/ja/en 3건).
 * sanitizeSlug는 "정규화"만 하므로 쓰레기 입력을 조용히 통과시킨다 → 입력단에서 거부한다.
 * 정상 슬러그는 `[a-z0-9-]`만 쓰므로 아래 조건에 걸리지 않는다.
 */
function isUrlLikeSlug(input) {
  if (typeof input !== 'string') return false;
  const s = input.trim().toLowerCase();
  if (!s) return false;
  if (s.includes('/')) return true;                              // 경로 구분자 — 정상 슬러그엔 없다
  if (/^[a-z][a-z0-9+.-]*:/.test(s)) return true;                // 스킴 또는 그 잔해 (https:, mailto:)
  if (/[a-z0-9-]+\.(com|net|org|ai|kr|io|co|jp|dev|app)(\b|$)/.test(s)) return true;  // 도메인
  if (/\.(html?|php|aspx?|jsp)(\b|$)/.test(s)) return true;      // 파일 확장자
  return false;
}

export { generateSlug, generateSlugFromAI, sanitizeSlug, isWeakSlug, isUrlLikeSlug };
