/**
 * SEO 색인 제외 규칙 — 단일 정본
 * 사이트맵 출력(render-sitemap.js)과 페이지 noindex(render-blog.js)가 공유한다.
 */
import { BLOG_REDIRECTS } from './redirects.js';

// noindex 메타를 붙일 슬러그 (검색 색인 제외 의도)
export const NOINDEX_SLUGS = new Set([
  'claudemax-20x-2개월-실사용-후기',
  'claude-max-20x-2-month-real-usage-review',
]);

// 사이트맵에서 제외할 확정 깨진 슬러그
// (Firestore published=true 이나 라우트가 404 — 데이터 정합성 깨짐. B1 정리 대상)
export const SITEMAP_EXCLUDE_SLUGS = new Set([
  'ai-photo-retouch-natural-vol51',
]);

// 리다이렉트 출발 경로 집합 — 사이트맵에 301 소스 URL을 싣지 않기 위함
export const BLOG_REDIRECT_SOURCE_PATHS = new Set(Object.keys(BLOG_REDIRECTS));

// 유효 블로그 슬러그: 영문자로 시작 + 최소 3자 + [a-z0-9-]만 허용.
// `3`, `ai`, `14-vs`, `5-10`, `https:...` 같은 깨진 슬러그를 걸러낸다.
const VALID_SLUG_RE = /^[a-z][a-z0-9-]{2,}$/;

/**
 * 사이트맵에 실어도 되는 색인 가능 블로그 URL인지 판정.
 * @param {string} baseSlug - 언어 접미사 제거된 슬러그
 * @param {string} path - langPrefix + '/blog/' + baseSlug (예: '/ja/blog/foo')
 */
export function isIndexableBlogUrl(baseSlug, path) {
  if (!VALID_SLUG_RE.test(baseSlug)) return false;
  if (NOINDEX_SLUGS.has(baseSlug)) return false;
  if (SITEMAP_EXCLUDE_SLUGS.has(baseSlug)) return false;
  if (BLOG_REDIRECT_SOURCE_PATHS.has(path)) return false;
  return true;
}
