/**
 * CMS 갤러리 CRUD API 핸들러
 * Firestore gallery_items 컬렉션
 */
import { firestore, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const galleryCollection = firestore.collection('gallery_items');

function extractId(url) {
  const parts = url.split('/api/admin/gallery/');
  return parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
}

// GET /api/admin/gallery — 전체 목록
export async function handleGalleryList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const snapshot = await galleryCollection.orderBy('order', 'asc').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items }));
  } catch (err) {
    log(`[CMS] 갤러리 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// POST /api/admin/gallery — 항목 추가
export async function handleGalleryCreate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = await parseJsonBody(req);
    const { imageUrl, caption, category, lang, order, published } = body;

    if (!imageUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미지 URL은 필수입니다' }));
    }

    const now = new Date().toISOString();
    const docRef = galleryCollection.doc();
    const item = {
      imageUrl,
      caption: caption || '',
      category: category || '일반',
      lang: lang || 'ko',
      order: typeof order === 'number' ? order : 0,
      published: published || false,
      createdAt: now,
    };

    await docRef.set(item);
    log(`[CMS] 갤러리 생성: ${docRef.id}`);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: docRef.id, ...item }));
  } catch (err) {
    log(`[CMS] 갤러리 생성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// PUT /api/admin/gallery/:id — 항목 수정
export async function handleGalleryUpdate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = extractId(req.url);
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await galleryCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '갤러리 항목을 찾을 수 없습니다' }));
    }

    const body = await parseJsonBody(req);
    const updates = {};
    const allowedFields = ['imageUrl', 'caption', 'category', 'lang', 'order', 'published'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    await galleryCollection.doc(id).update(updates);
    log(`[CMS] 갤러리 수정: ${id}`);

    const updated = await galleryCollection.doc(id).get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: updated.id, ...updated.data() }));
  } catch (err) {
    log(`[CMS] 갤러리 수정 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// DELETE /api/admin/gallery/:id — 항목 삭제
export async function handleGalleryDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = extractId(req.url);
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await galleryCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '갤러리 항목을 찾을 수 없습니다' }));
    }

    await galleryCollection.doc(id).delete();
    log(`[CMS] 갤러리 삭제: ${id}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[CMS] 갤러리 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
