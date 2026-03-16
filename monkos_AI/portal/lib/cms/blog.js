/**
 * CMS 블로그 CRUD API 핸들러
 * Firestore blog_posts 컬렉션
 */
import { firestore, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { translateAndSaveBlogPost } from './translate.js';

const blogCollection = firestore.collection('blog_posts');

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function sanitizeSlug(slug) {
  return slug
    .replace(/[\/$#\[\].]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
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

    const slug = sanitizeSlug(body.slug || generateSlug(title));
    if (!slug) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '유효한 slug를 생성할 수 없습니다' }));
    }
    const existing = await blogCollection.doc(slug).get();
    if (existing.exists) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미 존재하는 slug입니다' }));
    }

    const now = new Date().toISOString();
    const post = {
      slug,
      title,
      content,
      summary: (summary || '').substring(0, 160),
      thumbnail: thumbnail || (content ? (content.match(/<img[^>]+src="([^"]+)"/)?.[1] || '') : ''),
      tags: tags || [],
      lang: lang || 'ko',
      published: published || false,
      author: author || 'MONKOS',
      pinned: pinned || false,
      category: category || '',
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    };

    await blogCollection.doc(slug).set(post);
    log(`[CMS] 블로그 생성: ${slug}`);

    // 한국어 원본 발행 시 자동번역 (백그라운드)
    if (post.published && post.lang === 'ko') {
      translateAndSaveBlogPost(slug, post).catch(err => {
        log(`[CMS] 백그라운드 번역 에러: ${err.message}`, 'ERROR');
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
    if (updates.summary) updates.summary = updates.summary.substring(0, 160);
    if (updates.thumbnail === '' && updates.content) {
      const imgMatch = updates.content.match(/<img[^>]+src="([^"]+)"/);
      if (imgMatch) updates.thumbnail = imgMatch[1];
    }
    updates.updatedAt = new Date().toISOString();

    await blogCollection.doc(slug).update(updates);
    log(`[CMS] 블로그 수정: ${slug}`);

    const updated = await blogCollection.doc(slug).get();
    const updatedData = updated.data();

    // 한국어 원본 발행 시 자동번역 (백그라운드, 재번역 덮어쓰기)
    if (updatedData.published && updatedData.lang === 'ko') {
      translateAndSaveBlogPost(slug, updatedData).catch(err => {
        log(`[CMS] 백그라운드 번역 에러: ${err.message}`, 'ERROR');
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
