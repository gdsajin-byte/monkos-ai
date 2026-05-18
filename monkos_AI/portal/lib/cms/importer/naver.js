/**
 * 네이버 블로그 크롤러
 * Source: https://blog.naver.com/monkos_ai
 * 전략: RSS 우선 → 실패 시 모바일 HTML fallback
 */
import { Storage } from '@google-cloud/storage';
import { firestore, log, GCS_BUCKET } from '../../shared/config.js';
import { translateAndSaveBlogPost } from '../translate.js';

const gcsStorage = new Storage();
const gcsBucket = gcsStorage.bucket(GCS_BUCKET);

const BLOG_ID = 'monkos_ai';
const RSS_URL = `https://rss.blog.naver.com/${BLOG_ID}.xml`;
const blogCollection = firestore.collection('blog_posts');
const DELAY_MS = 500;

// 허용 카테고리 → Firestore 필드 매핑
const CATEGORY_MAP = {
  'MONKOS AI': { category: 'AI', author: 'MONKOS' },
  "SHIN's AI story": { category: 'AI', author: '신작가' },
  "HAN's BEAUTY": { category: '메이크업', author: '한송이' },
  "KKU's DESIGN": { category: '사진', author: '꾸' },
};

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) || 'untitled';
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractXmlTag(xml, tag) {
  const cdataRe = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`);
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();

  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const plainMatch = xml.match(plainRe);
  return plainMatch ? plainMatch[1].trim() : '';
}

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const tagStr = extractXmlTag(block, 'tag');
    items.push({
      title: extractXmlTag(block, 'title'),
      link: extractXmlTag(block, 'link'),
      description: extractXmlTag(block, 'description'),
      pubDate: extractXmlTag(block, 'pubDate'),
      category: extractXmlTag(block, 'category'),
      tags: tagStr ? tagStr.split(',').map(t => t.trim()).filter(Boolean) : [],
    });
  }
  return items;
}

function matchCategory(rssCategory) {
  if (!rssCategory) return null;
  const cat = rssCategory.trim();
  for (const [name, info] of Object.entries(CATEGORY_MAP)) {
    if (cat === name || cat.includes(name)) return info;
  }
  return null;
}

function extractPostId(url) {
  const match = url.match(/\/(\d+)$/);
  return match ? match[1] : null;
}

function extractThumbnail(html) {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]*src="(https?:\/\/[^"]*)"[^>]*>/);
  return imgMatch ? imgMatch[1] : null;
}

function normalizeTitle(title) {
  return (title || '').replace(/[\s\u3000·・―—–\-_.,!?！？。、：:；;()（）「」『』【】\[\]]/g, '').toLowerCase();
}

async function isDuplicate(sourceUrl, title, slug) {
  // 1. sourceUrl 일치
  const snapUrl = await blogCollection.where('sourceUrl', '==', sourceUrl).limit(1).get();
  if (!snapUrl.empty) return true;

  // 2. 동일 title (정규화 후 비교)
  if (title) {
    const normalized = normalizeTitle(title);
    const allPublished = await blogCollection.where('published', '==', true).get();
    for (const doc of allPublished.docs) {
      if (normalizeTitle(doc.data().title) === normalized) return true;
    }
  }

  // 3. 동일 slug 존재
  if (slug) {
    const docSnap = await blogCollection.doc(slug).get();
    if (docSnap.exists) return true;
  }

  return false;
}

async function fetchMobileContent(postId) {
  const url = `https://m.blog.naver.com/${BLOG_ID}/${postId}`;
  try {
    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });
    if (!res.ok) return null;
    const html = await res.text();

    // SmartEditor 3
    let match = html.match(/<div class="se-main-container">([\s\S]*?)<\/div>\s*<!--/);
    if (match) return match[1];

    // SmartEditor 2
    match = html.match(/<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    if (match) return match[1];

    // og:description fallback
    match = html.match(/<meta property="og:description" content="([^"]*)"/);
    if (match) return match[1];
  } catch (err) {
    log(`[네이버] 모바일 페이지 fetch 실패 (${postId}): ${err.message}`, 'WARNING');
  }
  return null;
}

/**
 * content 내 pstatic.net 이미지를 GCS로 복사, URL 교체
 * Referer 없이 다운로드 → GCS blog/{slug}/ 업로드
 */
async function copyPstaticToGCS(content, slug) {
  const pstaticRegex = /(https?:\/\/[^\s"']*pstatic\.net[^\s"')*]*)/g;
  const urls = [...new Set(content.match(pstaticRegex) || [])];
  if (urls.length === 0) return content;

  log(`[네이버] pstatic 이미지 ${urls.length}개 GCS 복사: ${slug}`);
  let updated = content;

  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i]);
      if (!res.ok) { log(`[네이버] 이미지 다운로드 실패 (${res.status}): ${urls[i]}`, 'WARNING'); continue; }

      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'jpg';
      const gcsPath = `blog/${slug}/${i}.${ext}`;

      const file = gcsBucket.file(gcsPath);
      await file.save(buffer, { metadata: { contentType }, public: true });

      const gcsUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
      updated = updated.split(urls[i]).join(gcsUrl);
      log(`[네이버] GCS 복사: ${urls[i].substring(0, 60)}… → ${gcsPath}`);
    } catch (err) {
      log(`[네이버] 이미지 GCS 복사 실패: ${err.message}`, 'WARNING');
    }
  }

  return updated;
}

export async function importFromNaver() {
  const stats = { imported: 0, skipped: 0, errors: 0, errorList: [] };

  // === RSS 시도 ===
  log(`[네이버] RSS 시도: ${RSS_URL}`);

  let items = [];
  try {
    const res = await fetch(RSS_URL, {
      headers: { ...HEADERS, 'Accept': 'application/xml,text/xml,*/*' },
    });
    if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
    const xml = await res.text();
    items = parseRSSItems(xml);
    log(`[네이버] RSS 수신: ${items.length}건`);
  } catch (err) {
    log(`[네이버] RSS 실패: ${err.message} — 모바일 fallback 미구현`, 'ERROR');
    stats.errorList.push(`RSS 실패: ${err.message}`);
    return stats;
  }

  // === 카테고리 필터링 + 이관 ===
  for (const item of items) {
    const catInfo = matchCategory(item.category);
    if (!catInfo) {
      stats.skipped++;
      continue;
    }

    const sourceUrl = item.link.replace(/\?fromRss=true&trackingCode=rss$/, '');

    try {
      const slug = generateSlug(item.title);

      if (await isDuplicate(sourceUrl, item.title, slug)) {
        log(`[네이버] skip (중복): ${item.title}`);
        stats.skipped++;
        continue;
      }

      let content = item.description || '';
      const postId = extractPostId(sourceUrl);

      // RSS 본문이 짧으면 모바일에서 전문 fetch
      if (postId && stripHtml(content).length < 1000) {
        log(`[네이버] 모바일 본문 fetch: ${postId}`);
        const fullContent = await fetchMobileContent(postId);
        if (fullContent) content = fullContent;
        await new Promise(r => setTimeout(r, DELAY_MS));
      }

      // pstatic.net 이미지 → GCS 복사
      content = await copyPstaticToGCS(content, slug);

      const summary = stripHtml(content).substring(0, 200);
      const thumbnail = extractThumbnail(content);

      const now = new Date().toISOString();
      let publishedAt = now;
      try {
        publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : now;
      } catch { /* invalid date → now */ }

      const post = {
        slug,
        title: item.title,
        content,
        summary,
        author: catInfo.author,
        lang: 'ko',
        published: true,
        pinned: false,
        category: catInfo.category,
        tags: item.tags.length ? item.tags : [item.category],
        thumbnail: thumbnail || null,
        source: 'naver',
        sourceUrl,
        publishedAt,
        createdAt: now,
        updatedAt: now,
        viewCount: 0,
      };

      await blogCollection.doc(slug).set(post);
      stats.imported++;
      log(`[네이버] 이관 완료: ${item.title} (${catInfo.category}/${catInfo.author})`);

      // 자동번역 (비동기, 실패해도 이관은 유지)
      translateAndSaveBlogPost(slug, post).catch(err => {
        log(`[네이버] 번역 실패: ${item.title} — ${err.message}`, 'WARNING');
      });

      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      stats.errors++;
      stats.errorList.push(`${item.title}: ${err.message}`);
      log(`[네이버] 오류: ${item.title} — ${err.message}`, 'WARNING');
    }
  }

  return stats;
}
