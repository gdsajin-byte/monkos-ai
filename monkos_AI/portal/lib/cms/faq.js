/**
 * CMS FAQ CRUD API 핸들러
 * Firestore faq_items 컬렉션
 */
import { firestore, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const faqCollection = firestore.collection('faq_items');

function extractId(url) {
  const parts = url.split('/api/admin/faq/');
  return parts[1] ? decodeURIComponent(parts[1].split('?')[0]) : null;
}

// GET /api/admin/faq — 전체 목록
export async function handleFaqList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const snapshot = await faqCollection.orderBy('order', 'asc').get();
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ items }));
  } catch (err) {
    log(`[CMS] FAQ 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// POST /api/admin/faq — 항목 추가
export async function handleFaqCreate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = await parseJsonBody(req);
    const { question, answer, category, lang, order, published } = body;

    if (!question || !answer) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '질문과 답변은 필수입니다' }));
    }

    const now = new Date().toISOString();
    const docRef = faqCollection.doc();
    const item = {
      question,
      answer,
      category: category || '일반',
      lang: lang || 'ko',
      order: typeof order === 'number' ? order : 0,
      published: published || false,
      createdAt: now,
      updatedAt: now,
    };

    await docRef.set(item);
    log(`[CMS] FAQ 생성: ${docRef.id}`);

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: docRef.id, ...item }));
  } catch (err) {
    log(`[CMS] FAQ 생성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// PUT /api/admin/faq/:id — 항목 수정
export async function handleFaqUpdate(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = extractId(req.url);
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await faqCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'FAQ를 찾을 수 없습니다' }));
    }

    const body = await parseJsonBody(req);
    const updates = {};
    const allowedFields = ['question', 'answer', 'category', 'lang', 'order', 'published'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    updates.updatedAt = new Date().toISOString();

    await faqCollection.doc(id).update(updates);
    log(`[CMS] FAQ 수정: ${id}`);

    const updated = await faqCollection.doc(id).get();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ id: updated.id, ...updated.data() }));
  } catch (err) {
    log(`[CMS] FAQ 수정 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// DELETE /api/admin/faq/:id — 항목 삭제
export async function handleFaqDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const id = extractId(req.url);
    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'ID 필요' }));
    }

    const doc = await faqCollection.doc(id).get();
    if (!doc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'FAQ를 찾을 수 없습니다' }));
    }

    await faqCollection.doc(id).delete();
    log(`[CMS] FAQ 삭제: ${id}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[CMS] FAQ 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
