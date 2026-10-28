/**
 * CMS 고객 게시판 API 핸들러
 * Firestore board_posts 컬렉션
 * 공개 API (4) + 관리자 API (4)
 */
import { firestore, log, parseJsonBody, createHmac, randomBytes, sendTelegramMessage, TEAM_CHAT_ID, TELEGRAM_TEAM_API } from '../shared/config.js';
import { sendMail, isMailerConfigured } from '../mailer.js';
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


// === 불편 신고(2026-09-19) — specs 퍼널에서 페이지 이탈 없이 접수되는 비공개 글 ===
// 목적: "어떤 기기인지 짐작만 하는" 상태 해소. 고객은 한 줄만 쓰고, 기기·단계·마지막 에러는 자동 첨부된다.
// context·email·viewTokenHash는 관리자 API 전용 — 공개 응답은 화이트리스트로만 구성한다.
const REPORT_CATEGORY = '신고';
const SUPPORT_LABEL = 'MONKOS 지원';
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const CTX_STR = { slug: 60, lang: 8, market: 8, phase: 24, lastError: 200, lastErrorStage: 24, orderId: 80, payProvider: 16, referrerHost: 120 };
const CTX_NUM = ['vw', 'vh', 'dpr'];
const CTX_BOOL = ['inApp', 'widgetOpened', 'confirmClicked'];

function sanitizeContext(raw) {
  const c = {};
  if (!raw || typeof raw !== 'object') return c;
  for (const [k, max] of Object.entries(CTX_STR)) {
    if (typeof raw[k] === 'string' && raw[k]) c[k] = raw[k].slice(0, max);
  }
  for (const k of CTX_NUM) { if (Number.isFinite(raw[k])) c[k] = Math.round(raw[k] * 100) / 100; }
  for (const k of CTX_BOOL) { if (typeof raw[k] === 'boolean') c[k] = raw[k]; }
  return c;
}

// 접수 자동 답글 — 고정 문안(LLM 생성 아님). 환불·보상·기한·미출시 기능 약속 금지(ch8 5조 — 고객 대면 표현).
const AUTO_REPLY = {
  ko: {
    head: '고객님, 불편을 드려 죄송합니다. 신고가 접수되었습니다. 함께 전달된 기기·화면 정보를 바탕으로 원인을 확인한 뒤 이 글에 답글로 안내드리겠습니다.',
    pay: '그 사이 다시 시도하실 때는 결제수단에서 카드사를 먼저 선택한 뒤 결제하기를 눌러 주세요. 앱 안의 브라우저(네이버·카카오톡 등)라면 크롬·사파리·삼성인터넷 같은 기본 브라우저에서 여는 것이 가장 안정적입니다.',
    download: '그 사이 저장이 되지 않으면 결과 사진을 길게 눌러 "이미지 저장"을 선택해 보세요. 앱 안의 브라우저라면 기본 브라우저에서 여는 것이 가장 안정적입니다.',
    upload: '그 사이 다시 시도하실 때는 JPG 또는 PNG 사진으로, 얼굴이 정면으로 또렷하게 나온 사진을 올려 주세요.',
  },
  en: {
    head: 'We are sorry for the trouble. Your report has been received. We will review it together with the device and screen details that came with it, and reply here.',
    pay: 'If you try again in the meantime, please choose your card issuer in the payment method first, then press Pay. If you are inside an in-app browser, opening the page in Chrome or Safari is the most reliable.',
    download: 'If saving does not work in the meantime, press and hold the result photo and choose "Save image". If you are inside an in-app browser, opening the page in Chrome or Safari is the most reliable.',
    upload: 'If you try again in the meantime, please upload a JPG or PNG photo with your face clearly visible from the front.',
  },
  ja: {
    head: 'ご不便をおかけして申し訳ございません。ご報告を受け付けました。あわせて届いた端末・画面情報をもとに原因を確認し、この投稿への返信でご案内いたします。',
    pay: 'その間に再度お試しの際は、決済方法でカード会社を先に選択してから決済ボタンを押してください。アプリ内ブラウザをご利用の場合は、ChromeやSafariなど標準ブラウザで開くのが最も安定します。',
    download: 'その間に保存できない場合は、結果の写真を長押しして「画像を保存」をお選びください。アプリ内ブラウザをご利用の場合は、標準ブラウザで開くのが最も安定します。',
    upload: 'その間に再度お試しの際は、顔が正面からはっきり写ったJPGまたはPNGの写真をアップロードしてください。',
  },
  es: {
    head: 'Lamentamos las molestias. Hemos recibido su aviso. Lo revisaremos junto con los datos del dispositivo y de la pantalla que llegaron con él, y le responderemos aquí.',
    pay: 'Si vuelve a intentarlo mientras tanto, elija primero el emisor de su tarjeta en el método de pago y luego pulse Pagar. Si está dentro del navegador de una aplicación, abrir la página en Chrome o Safari es lo más fiable.',
    download: 'Si mientras tanto no puede guardar, mantenga pulsada la foto del resultado y elija "Guardar imagen". Si está dentro del navegador de una aplicación, abrir la página en Chrome o Safari es lo más fiable.',
    upload: 'Si vuelve a intentarlo mientras tanto, suba una foto JPG o PNG con el rostro claramente visible de frente.',
  },
};

function autoReplyText(lang, phase) {
  const L = AUTO_REPLY[lang] || AUTO_REPLY.en;
  const tip = phase === 'pay' ? L.pay
    : (phase === 'result' || phase === 'free') ? L.download
    : (phase === 'upload' || phase === 'check' || phase === 'fit') ? L.upload
    : '';
  return tip ? `${L.head}\n\n${tip}` : L.head;
}

function summarizeUa(ua) {
  if (!ua) return '?';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : '기타';
  const br = /NAVER\(/.test(ua) ? '네이버앱' : /KAKAOTALK/.test(ua) ? '카카오톡' : /SamsungBrowser/.test(ua) ? '삼성인터넷' : /Whale/.test(ua) ? '웨일'
    : /Edg\//.test(ua) ? '엣지' : /CriOS|Chrome\//.test(ua) ? '크롬' : /Safari\//.test(ua) ? '사파리' : '기타';
  return `${os}·${br}`;
}

// POST /api/board/report — 불편 신고 접수 (비공개 글 + 맥락 자동 첨부 + 즉시 알림 + 접수 자동 답글)
export async function handleBoardReportCreate(req, res) {
  const json = (status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload)); };
  try {
    const ip = getClientIp(req);
    if (recentPosts.has(ip)) return json(429, { error: '잠시 후 다시 시도해 주세요 (1분)', code: 'RATE_LIMITED' });

    const body = await parseJsonBody(req);
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) return json(400, { error: '내용을 입력해 주세요', code: 'EMPTY' });
    if (content.length > 2000) return json(400, { error: '입력 길이 제한 초과', code: 'TOO_LONG' });
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
    if (email && !EMAIL_RE.test(email)) return json(400, { error: '이메일 형식을 확인해 주세요', code: 'BAD_EMAIL' });

    const ctx = sanitizeContext(body.context);
    const ua = String(req.headers['user-agent'] || '').slice(0, 300);
    const lang = ctx.lang || 'ko';
    const now = new Date().toISOString();
    const viewToken = randomBytes(18).toString('base64url');
    const docRef = boardCollection.doc();
    const post = {
      author: '고객',
      title: `[신고] ${ctx.slug || '-'} · ${ctx.phase || '-'}`,
      content,
      password: hashPassword(randomBytes(24).toString('hex')), // 본인 삭제 미제공 — 추측 불가 값으로 봉인
      category: REPORT_CATEGORY,
      lang,
      published: false,          // 공개 목록·공개 상세에서 제외
      visibility: 'private',     // 열람 링크(key)로만 상세 열람
      viewTokenHash: hashPassword(viewToken),
      email: email || null,
      context: { ...ctx, userAgent: ua },
      replies: [{ text: autoReplyText(lang, ctx.phase), authorLabel: SUPPORT_LABEL, auto: true, createdAt: now }],
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(post);
    recentPosts.set(ip, Date.now());
    log(`[CMS] 불편 신고 접수: ${docRef.id} slug=${ctx.slug || '-'} phase=${ctx.phase || '-'} ${summarizeUa(ua)} vp=${ctx.vw || '?'}x${ctx.vh || '?'} inApp=${ctx.inApp === true}`);

    if (TEAM_CHAT_ID) {
      const lines = [
        '📮 *specs 불편 신고*',
        `${ctx.slug || '-'} · 단계 ${ctx.phase || '-'} · ${lang}`,
        `기기 ${summarizeUa(ua)} · ${ctx.vw || '?'}x${ctx.vh || '?'}${ctx.inApp ? ' · 인앱' : ''}`,
        ctx.lastError ? `마지막 에러: ${ctx.lastError}` : null,
        ctx.orderId ? `주문: ${ctx.orderId}${ctx.widgetOpened ? ' · 위젯 열림' : ''}${ctx.confirmClicked ? ' · 결제하기 클릭' : ''}` : null,
        `내용: ${content.slice(0, 200)}`,
        `관리: https://monkos.ai/admin/board.html`,
      ].filter(Boolean);
      sendTelegramMessage(TEAM_CHAT_ID, lines.join('\n'), TELEGRAM_TEAM_API)
        .catch(err => log(`[CMS] 신고 알림 전송 실패: ${err.message}`, 'WARNING'));
    } else {
      log('[CMS] 신고 알림 생략 — TEAM_CHAT_ID 미설정', 'WARNING');
    }

    return json(201, { id: docRef.id, viewUrl: `/board/${docRef.id}?key=${viewToken}` });
  } catch (err) {
    log(`[CMS] 불편 신고 에러: ${err.message}`, 'ERROR');
    return json(500, { error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' });
  }
}

// 비공개 글 열람 키 검증 — 공개 API·SSR 상세가 공유
export function canViewPrivate(data, key) {
  if (!data || data.visibility !== 'private' || typeof key !== 'string' || !key) return false;
  const h = hashPassword(key);
  // 접수 시 발급한 링크와 답글 알림 메일의 링크가 모두 살아 있어야 한다 — 키를 교체하지 않고 누적한다
  return h === data.viewTokenHash || (Array.isArray(data.viewTokenHashes) && data.viewTokenHashes.includes(h));
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
    const key = new URL(req.url, 'https://monkos.ai').searchParams.get('key');
    if (!doc.exists || (!doc.data().published && !canViewPrivate(doc.data(), key))) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '게시글을 찾을 수 없습니다' }));
    }

    // 응답은 화이트리스트 — context·email·viewTokenHash·password는 어떤 경우에도 내보내지 않는다
    const d = doc.data();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
    res.end(JSON.stringify({
      id: doc.id,
      author: d.author,
      title: d.title,
      content: escapeHtml(d.content),
      category: d.category,
      replies: (d.replies || []).map(r => ({ text: escapeHtml(r.text), authorLabel: r.authorLabel || 'MONKOS', createdAt: r.createdAt })),
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
        visibility: d.visibility || 'public',
        hasReply: Array.isArray(d.replies) && d.replies.length > 0,
        // 접수 자동 답글만 달린 글 = 미답변
        hasHumanReply: Array.isArray(d.replies) && d.replies.some(r => !r.auto),
        content: d.content || '',
        email: d.email || null,
        context: d.context || null,
        replies: (d.replies || []).map(r => ({ text: r.text, authorLabel: r.authorLabel || 'MONKOS', auto: r.auto === true, createdAt: r.createdAt })),
        createdAt: d.createdAt,
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' });
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

    const data = doc.data();
    const replies = data.replies || [];
    const authorLabel = (typeof body.authorLabel === 'string' && body.authorLabel.trim()) ? body.authorLabel.trim().slice(0, 40) : SUPPORT_LABEL;
    replies.push({ text: String(body.text).slice(0, 5000), authorLabel, createdAt: new Date().toISOString() });

    await boardCollection.doc(id).update({ replies, updatedAt: new Date().toISOString() });
    log(`[CMS] 게시판 답글: ${id}`);

    // 이메일을 남긴 신고 글 — 답글 알림 1통. 열람 키는 해시만 보관하므로 답글 시점에 키를 하나 더 발급해 링크에 싣는다(기존 링크 유지).
    let mailed = false;
    if (data.email && data.visibility === 'private') {
      if (isMailerConfigured()) {
        try {
          const newKey = randomBytes(18).toString('base64url');
          const hashes = (Array.isArray(data.viewTokenHashes) ? data.viewTokenHashes : []).concat(hashPassword(newKey)).slice(-10);
          await boardCollection.doc(id).update({ viewTokenHashes: hashes });
          const link = `https://monkos.ai/board/${encodeURIComponent(id)}?key=${newKey}`;
          const M = {
            ko: { s: '[MONKOS] 신고하신 내용에 답글이 등록되었습니다', b: `고객님, 신고하신 내용에 답글이 등록되었습니다.\n아래 링크에서 확인하실 수 있습니다.\n\n${link}\n\n— MONKOS 지원 (info@monkos.ai)` },
            ja: { s: '[MONKOS] ご報告への返信が登録されました', b: `ご報告いただいた内容に返信が登録されました。\n下記リンクからご確認いただけます。\n\n${link}\n\n— MONKOS サポート (info@monkos.ai)` },
            es: { s: '[MONKOS] Hemos respondido a su aviso', b: `Hemos publicado una respuesta a su aviso.\nPuede verla en el siguiente enlace.\n\n${link}\n\n— Soporte MONKOS (info@monkos.ai)` },
            en: { s: '[MONKOS] A reply has been posted to your report', b: `A reply has been posted to your report.\nYou can read it at the link below.\n\n${link}\n\n— MONKOS Support (info@monkos.ai)` },
          };
          const m = M[data.lang] || M.en;
          await sendMail({ to: data.email, subject: m.s, text: m.b });
          mailed = true;
        } catch (mailErr) {
          log(`[CMS] 답글 알림 메일 실패: ${id} — ${mailErr.message}`, 'WARNING');
        }
      } else {
        log(`[CMS] 답글 알림 메일 생략 — 메일러 미설정: ${id}`, 'WARNING');
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, replies, mailed }));
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

    if (doc.data().visibility === 'private') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '비공개 신고 글은 공개로 전환할 수 없습니다 (기기·결제 맥락 포함)', code: 'PRIVATE_LOCKED' }));
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
