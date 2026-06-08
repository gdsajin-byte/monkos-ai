/**
 * CMS 블로그 CRUD API 핸들러
 * Firestore blog_posts 컬렉션
 */
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import { firestore, ai, GCS_BUCKET, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { translateAndSaveBlogPost } from './translate.js';
import { publishBlogToGitHub } from './github-issues.js';
import { requestIndexing, appendToLlmsTxt, pingSitemap } from './seo.js';

const blogCollection = firestore.collection('blog_posts');
const ogStorage = new Storage();
const ogBucket = ogStorage.bucket(GCS_BUCKET);

async function generateOgImage(thumbnail, slug) {
  try {
    const imgRes = await fetch(thumbnail);
    if (!imgRes.ok) return null;
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    const ogBuffer = await sharp(imgBuffer)
      .resize(1200, 630, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
    const timestamp = Date.now();
    const gcsPath = `blog/og_${timestamp}_${slug}.jpg`;
    const file = ogBucket.file(gcsPath);
    await file.save(ogBuffer, {
      metadata: { contentType: 'image/jpeg', metadata: { source: 'auto-og-resize' } },
      public: true,
    });
    const url = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
    log(`[CMS] OG 이미지 자동 생성: ${gcsPath} (${(ogBuffer.length / 1024).toFixed(1)}KB)`);
    return url;
  } catch (err) {
    log(`[CMS] OG 이미지 생성 실패: ${err.message}`, 'WARN');
    return null;
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

async function generateSlugFromAI(title) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. First TRANSLATE the blog title meaning into English, then convert to a URL slug. Do NOT romanize Korean — translate the MEANING. Lowercase, hyphens only, max 60 chars, ASCII only. Return ONLY the slug.\n\nTitle: ${title}` }] }],
      config: { maxOutputTokens: 64, temperature: 0.1 },
    });
    const slug = (response.candidates?.[0]?.content?.parts?.[0]?.text || '')
      .trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
    if (slug.length >= 3) return slug;
  } catch (err) {
    log(`[CMS] AI slug 생성 실패: ${err.message}`, 'WARN');
  }
  return 'post-' + new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
}

function sanitizeSlug(slug) {
  return slug
    .replace(/[\/$#\[\].]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function hasKorean(str) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str);
}

function langSuffix(lang) {
  const map = { ko: 'kr', ja: 'ja', en: 'en' };
  return map[lang] || 'kr';
}

function extractSlug(url) {
  const parts = url.split('/api/admin/blog/');
  const raw = parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
  return raw ? sanitizeSlug(raw) : null;
}

// GET /api/admin/blog — 목록 (drafts 포함)
export async function handleBlogList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const snapshot = await blogCollection.orderBy('createdAt', 'desc').get();
    const posts = snapshot.docs.map(doc => ({ slug: doc.id, ...doc.data() }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ posts }));
  } catch (err) {
    log(`[CMS] 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// GET /api/admin/blog/:slug — 상세
export async function handleBlogGet(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const slug = extractSlug(req.url);
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'slug 필요' }));
    }

    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '글을 찾을 수 없습니다' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ slug: doc.id, ...doc.data() }));
  } catch (err) {
    log(`[CMS] 상세 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// POST /api/admin/blog — 생성
export async function handleBlogCreate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = await parseJsonBody(req);
    const { title, content, summary, thumbnail, tags, lang, published, author, pinned, category } = body;

    if (!title || !content) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '제목과 본문은 필수입니다' }));
    }

    // summary 빈값 방지 — 본문에서 자동 추출
    if (!summary && content) {
      body.summary = content
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/^#+\s.*/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 160);
    }

    const postLang = lang || 'ko';
    const suffix = langSuffix(postLang);

    let baseSlug = sanitizeSlug(body.slug || generateSlug(title));
    if (!baseSlug || hasKorean(baseSlug)) {
      baseSlug = await generateSlugFromAI(title);
      log(`[CMS] AI slug 생성: "${title}" → "${baseSlug}"`);
    }
    if (hasKorean(baseSlug)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'slug에 한글이 포���될 수 없습니다. 영문 slug를 직접 지정해주세요.' }));
    }
    baseSlug = baseSlug.replace(/-(kr|ja|en)$/, '');
    const slug = `${baseSlug}-${suffix}`;

    const existing = await blogCollection.doc(slug).get();
    if (existing.exists) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미 존재하는 slug입니다' }));
    }

    const now = new Date().toISOString();
    const post = {
      slug,
      baseSlug,
      title,
      content,
      summary: (summary || '').substring(0, 160),
      thumbnail: thumbnail || (content ? (content.match(/<img[^>]+src="([^"]+)"/)?.[1] || '') : ''),
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      lang: lang || 'ko',
      published: published || false,
      author: author || 'MONKOS',
      pinned: pinned || false,
      category: category || '',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    };

    if (post.published && post.thumbnail) {
      const ogUrl = await generateOgImage(post.thumbnail, slug);
      if (ogUrl) post.ogImage = ogUrl;
    }

    await blogCollection.doc(slug).set(post);
    log(`[CMS] 블로그 생성: ${slug}`);

    if (post.published) {
      const blogUrl = `https://monkos.ai/blog/${slug}`;
      pingSitemap();
      requestIndexing(blogUrl);
      appendToLlmsTxt(slug, post.title);
    }

    // 한국어 원본 발행 시 자동번역 → GitHub Issues (백그라운드 체이닝)
    if (post.published && post.lang === 'ko') {
      translateAndSaveBlogPost(slug, post)
        .then(() => publishBlogToGitHub(slug))
        .catch(err => {
          log(`[CMS] 백그라운드 번역/게시 에러: ${err.message}`, 'ERROR');
        });
    }

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(post));
  } catch (err) {
    log(`[CMS] 생성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// PUT /api/admin/blog/:slug — 수정
export async function handleBlogUpdate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const slug = extractSlug(req.url);
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'slug 필요' }));
    }

    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '글을 찾을 수 없습니다' }));
    }

    const body = await parseJsonBody(req);
    const updates = {};
    const allowedFields = ['title', 'content', 'summary', 'thumbnail', 'tags', 'lang', 'published', 'author', 'pinned', 'category'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (updates.tags !== undefined) {
      updates.tags = Array.isArray(updates.tags) ? updates.tags : (typeof updates.tags === 'string' ? updates.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    }
    if (updates.summary) updates.summary = updates.summary.substring(0, 160);
    // summary 빈값 방지 — 본문에서 자동 추출
    if (!updates.summary && updates.content) {
      updates.summary = updates.content
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/^#+\s.*/gm, '')
        .replace(/\n+/g, ' ')
        .trim()
        .substring(0, 160);
    }
    if (updates.thumbnail === '' && updates.content) {
      const imgMatch = updates.content.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) updates.thumbnail = imgMatch[1];
    }
    updates.updatedAt = new Date().toISOString();

    const prevData = doc.data();
    const effectiveThumbnail = updates.thumbnail ?? prevData.thumbnail;
    const isPublished = updates.published ?? prevData.published;
    if (isPublished && effectiveThumbnail) {
      const ogUrl = await generateOgImage(effectiveThumbnail, slug);
      if (ogUrl) updates.ogImage = ogUrl;
    }

    await blogCollection.doc(slug).update(updates);
    log(`[CMS] 블로그 수정: ${slug}`);

    const updated = await blogCollection.doc(slug).get();
    const updatedData = updated.data();

    if (updatedData.published) {
      const blogUrl = `https://monkos.ai/blog/${slug}`;
      pingSitemap();
      requestIndexing(blogUrl);
      appendToLlmsTxt(slug, updatedData.title);
    }

    // 한국어 원본 발행 시 자동번역 → GitHub Issues (백그라운드 체이닝)
    if (updatedData.published && updatedData.lang === 'ko') {
      translateAndSaveBlogPost(slug, updatedData)
        .then(() => publishBlogToGitHub(slug))
        .catch(err => {
          log(`[CMS] 백그라운드 번역/게시 에러: ${err.message}`, 'ERROR');
        });
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ slug: updated.id, ...updatedData }));
  } catch (err) {
    log(`[CMS] 수정 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// DELETE /api/admin/blog/:slug — 삭제
export async function handleBlogDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const slug = extractSlug(req.url);
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'slug 필요' }));
    }

    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '글을 찾을 수 없습니다' }));
    }

    await blogCollection.doc(slug).delete();
    log(`[CMS] 블로그 삭제: ${slug}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[CMS] 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
