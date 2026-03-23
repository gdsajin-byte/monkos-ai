/**
 * CMS 블로그 CRUD API 핸들러
 * Firestore blog_posts 컬렉션
 */
import { firestore, ai, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { translateAndSaveBlogPost } from './translate.js';

const blogCollection = firestore.collection('blog_posts');

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
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: `Convert this blog title to an English URL slug. Rules: lowercase, hyphens only, max 60 chars, ASCII only. Return ONLY the slug, nothing else.\n\nTitle: ${title}` }] }],
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

    let slug = sanitizeSlug(body.slug || generateSlug(title));
    if (!slug) {
      slug = await generateSlugFromAI(title);
      log(`[CMS] AI slug 생성: "${title}" → "${slug}"`);
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

    // Google 색인 등록 ping
    if (post.published) {
      try {
        await fetch(`https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml`);
        log(`[CMS] Google sitemap ping 완료: ${slug}`);
      } catch (e) {
        log(`[CMS] Google sitemap ping 실패: ${e.message}`, 'WARN');
      }
    }

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

    await blogCollection.doc(slug).update(updates);
    log(`[CMS] 블로그 수정: ${slug}`);

    const updated = await blogCollection.doc(slug).get();
    const updatedData = updated.data();

    // Google 색인 등록 ping
    if (updatedData.published) {
      try {
        await fetch(`https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml`);
        log(`[CMS] Google sitemap ping 완료: ${slug}`);
      } catch (e) {
        log(`[CMS] Google sitemap ping 실패: ${e.message}`, 'WARN');
      }
    }

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
