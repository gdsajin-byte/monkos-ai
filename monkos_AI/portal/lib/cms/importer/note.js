/**
 * note.com 크롤러
 * Source: https://note.com/monkos_ai
 */
import { firestore, log } from '../../shared/config.js';
import { translateAndSaveBlogPost } from '../translate.js';

const CREATOR = 'monkos_ai';
const API_LIST = `https://note.com/api/v2/creators/${CREATOR}/contents`;
const blogCollection = firestore.collection('blog_posts');
const DELAY_MS = 500;

function detectLang(text) {
  const sample = text.substring(0, 400);
  const jpChars = (sample.match(/[\u3040-\u309F\u30A0-\u30FF]/g) || []).length;
  return jpChars / Math.max(sample.length, 1) >= 0.1 ? 'ja' : 'ko';
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) || 'untitled';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

async function isDuplicate(sourceUrl) {
  const snap = await blogCollection.where('sourceUrl', '==', sourceUrl).limit(1).get();
  return !snap.empty;
}

async function ensureUniqueSlug(slug) {
  const doc = await blogCollection.doc(slug).get();
  if (!doc.exists) return slug;
  return `${slug}-${Date.now().toString(36)}`;
}

function extractContentFromHtml(html) {
  // __NEXT_DATA__ (Next.js embedded JSON)
  const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]);
      const note = data?.props?.pageProps?.note;
      if (note?.body) {
        return {
          body: note.body,
          title: note.name,
          publishedAt: note.publish_at,
          eyecatch: note.eyecatch_url,
        };
      }
    } catch { /* JSON parse 실패 — fallback */ }
  }

  // Fallback: note-body div
  const bodyMatch = html.match(/<div[^>]*class="[^"]*note-common-styles__textnote-body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
  if (bodyMatch) return { body: bodyMatch[1] };

  // Fallback: og:description
  const ogMatch = html.match(/<meta property="og:description" content="([^"]*)"/);
  if (ogMatch) return { body: ogMatch[1] };

  return null;
}

export async function importFromNote() {
  const stats = { imported: 0, skipped: 0, errors: 0, errorList: [] };
  let page = 1;
  let hasMore = true;

  log(`[note.com] 크롤링 시작: ${CREATOR}`);

  while (hasMore) {
    let contents;
    try {
      const res = await fetch(`${API_LIST}?kind=note&page=${page}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      contents = json.data?.contents || [];
      hasMore = !json.data?.isLastPage && contents.length > 0;
    } catch (err) {
      log(`[note.com] 목록 페이지 ${page} 실패: ${err.message}`, 'ERROR');
      stats.errorList.push(`목록 페이지 ${page}: ${err.message}`);
      break;
    }

    for (const item of contents) {
      const sourceUrl = `https://note.com/${CREATOR}/n/${item.key}`;

      try {
        if (await isDuplicate(sourceUrl)) {
          stats.skipped++;
          log(`[note.com] skip (중복): ${item.name}`);
          continue;
        }

        // 개별 포스트 HTML fetch → 본문 추출
        let content = '';
        let title = item.name || '';
        let thumbnail = item.eyecatch || '';
        let publishedAt = item.publishAt || new Date().toISOString();

        const pageRes = await fetch(sourceUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        });

        if (pageRes.ok) {
          const html = await pageRes.text();
          const extracted = extractContentFromHtml(html);
          if (extracted) {
            content = extracted.body || '';
            if (extracted.title) title = extracted.title;
            if (extracted.eyecatch) thumbnail = extracted.eyecatch;
            if (extracted.publishedAt) publishedAt = extracted.publishedAt;
          }
        }

        if (!content && item.body) {
          content = item.body;
        }
        if (!content) {
          content = item.description || item.name || '';
        }

        const textForLang = stripHtml(title + ' ' + content).substring(0, 400);
        const lang = detectLang(textForLang);
        const summary = stripHtml(content).substring(0, 200);

        let slug = generateSlug(title);
        slug = await ensureUniqueSlug(slug);

        const now = new Date().toISOString();
        const post = {
          slug,
          title,
          content,
          summary,
          author: 'MONKOS',
          lang,
          published: true,
          pinned: false,
          category: '',
          tags: [],
          thumbnail: thumbnail || null,
          source: 'note',
          sourceUrl,
          publishedAt,
          createdAt: now,
          updatedAt: now,
          viewCount: 0,
        };

        await blogCollection.doc(slug).set(post);
        stats.imported++;
        log(`[note.com] 이관 완료: ${title} (${lang})`);

        // 자동번역 (비동기, 실패해도 이관은 유지)
        translateAndSaveBlogPost(slug, post).catch(err => {
          log(`[note.com] 번역 실패: ${title} — ${err.message}`, 'WARNING');
        });

        await new Promise(r => setTimeout(r, DELAY_MS));
      } catch (err) {
        stats.errors++;
        stats.errorList.push(`${item.name}: ${err.message}`);
        log(`[note.com] 오류: ${item.name} — ${err.message}`, 'WARNING');
      }
    }

    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  return stats;
}
