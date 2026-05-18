/**
 * CMS 고객 게시판 API 핸들러
 * Firestore board_posts 컬렉션
 * 공개 API (4) + 관리자 API (4)
 */
import { firestore, log, parseJsonBody, createHmac } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const boardCollection = firestore.collection('board_posts');
const HMAC_KEY = 'monkos-board-pw';
const PER_PAGE = 20;

// 스팸 방지: IP 기반 1분 내 중복 작성 차단
const recentPosts = new Map();
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [ip, ts] of recentPosts) {
    if (ts < cutoff) recentPosts.delete(ip);
  }
}, 30_000);

function hashPassword(pw) {
  return createHmac('sha256', HMAC_KEY).update(pw).digest('hex');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function extractId(url, prefix) {
  const parts = url.split(prefix);
  return parts[1] ? decodeURIComponent(parts[1].split('?')[0].split('/')[0]) : null;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

// === 공개 API ===

// GET /api/board — 목록 (페이지네이션)
export async function handleBoardPublicList(req, res) {
  try {
    const url = new URL(req.url, 'https://monkos.ai');
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const category = url.searchParams.get('category');

    let query = boardCollection.where('published', '==', true).orderBy('createdAt', 'desc');
    if (category) {
      query = boardCollection.where('published', '==', true).where('category', '==', category).orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    const allPosts = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        author: d.author,
        title: d.title,
        category: d.category,
        hasReply: Array.isArray(d.replies) && d.replies.length > 0,
        createdAt: d.createdAt,
      };
    });

    const totalPages = Math.ceil(allPosts.length / PER_PAGE);
    const posts = allPosts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ posts, page, totalPages }));
  } catch (err) {
    log(`[CMS] 게시판 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// GET /api/board/:id — 상세
export async function handleBoardPublicGet(req, res) {
  try {
    const id = extractId(req.url, '/api/board/');
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists || !doc.data().published) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    const d = doc.data();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      id: doc.id,
      author: d.author,
      title: d.title,
      content: escapeHtml(d.content),
      category: d.category,
      replies: (d.replies || []).map(r => ({ text: escapeHtml(r.text), createdAt: r.createdAt })),
      createdAt: d.createdAt,
    }));
  } catch (err) {
    log(`[CMS] 게시판 상세 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// POST /api/board — 글 작성
export async function handleBoardPublicCreate(req, res) {
  try {
    const ip = getClientIp(req);

    // 스팸 방지
    if (recentPosts.has(ip)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '잠시 후 다시 시도해 주세요 (1분)' }));
    }

    const body = await parseJsonBody(req);
    const { author, title, content, password, category } = body;

    if (!author || !title || !content || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '닉네임, 제목, 내용, 비밀번호는 필수입니다' }));
    }

    if (title.length > 200 || content.length > 5000 || author.length > 50) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '입력 길이 제한 초과' }));
    }

    const now = new Date().toISOString();
    const docRef = boardCollection.doc();
    const post = {
      author: escapeHtml(author),
      title: escapeHtml(title),
      content,
      password: hashPassword(password),
      category: category || '후기',
      lang: 'ko',
      published: true,
      replies: [],
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(post);
    recentPosts.set(ip, Date.now());
    log(`[CMS] 게시글 작성: ${docRef.id} by ${author}`);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: docRef.id }));
  } catch (err) {
    log(`[CMS] 게시글 작성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// DELETE /api/board/:id — 삭제 (비밀번호 검증)
export async function handleBoardPublicDelete(req, res) {
  try {
    const id = extractId(req.url, '/api/board/');
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const body = await parseJsonBody(req);
    if (!body.password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '비밀번호 필요' }));
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    if (doc.data().password !== hashPassword(body.password)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '비밀번호가 일치하지 않습니다' }));
    }

    await boardCollection.doc(id).delete();
    log(`[CMS] 게시글 삭제 (본인): ${id}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[CMS] 게시글 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === 관리자 API ===

// GET /api/admin/board — 전체 목록 (비공개 포함)
export async function handleBoardAdminList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const snapshot = await boardCollection.orderBy('createdAt', 'desc').get();
    const posts = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        author: d.author,
        title: d.title,
        category: d.category,
        published: d.published,
        hasReply: Array.isArray(d.replies) && d.replies.length > 0,
        createdAt: d.createdAt,
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ posts }));
  } catch (err) {
    log(`[CMS] 게시판 관리 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// POST /api/admin/board/:id/reply — 답글 작성
export async function handleBoardAdminReply(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const urlParts = req.url.split('/api/admin/board/')[1];
    const id = urlParts ? decodeURIComponent(urlParts.split('/reply')[0]) : null;
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    const body = await parseJsonBody(req);
    if (!body.text) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '답글 내용 필요' }));
    }

    const replies = doc.data().replies || [];
    replies.push({ text: body.text, createdAt: new Date().toISOString() });

    await boardCollection.doc(id).update({ replies, updatedAt: new Date().toISOString() });
    log(`[CMS] 게시판 답글: ${id}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, replies }));
  } catch (err) {
    log(`[CMS] 답글 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// DELETE /api/admin/board/:id — 강제 삭제
export async function handleBoardAdminDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = extractId(req.url, '/api/admin/board/');
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    await boardCollection.doc(id).delete();
    log(`[CMS] 게시판 강제 삭제: ${id}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[CMS] 강제 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// PUT /api/admin/board/:id/toggle — 공개/비공개 토글
export async function handleBoardAdminToggle(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const urlParts = req.url.split('/api/admin/board/')[1];
    const id = urlParts ? decodeURIComponent(urlParts.split('/toggle')[0]) : null;
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await boardCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    const newPublished = !doc.data().published;
    await boardCollection.doc(id).update({ published: newPublished, updatedAt: new Date().toISOString() });
    log(`[CMS] 게시판 토글: ${id} → ${newPublished ? '공개' : '비공개'}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, published: newPublished }));
  } catch (err) {
    log(`[CMS] 토글 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
