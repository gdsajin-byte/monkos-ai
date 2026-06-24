/**
 * CMS SSR — 게시판 목록 + 상세 + 글쓰기
 */
import { escapeHtml, layoutHead, layoutNav, layoutFooter, layoutShell } from './render-shell.js';
import { firestore, log } from '../shared/config.js';

const boardCollection = firestore.collection('board_posts');

// 게시판 목록 — fragment
export async function boardListFragment(req) {
  const url = new URL(req.url, 'https://monkos.ai');
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const perPage = 20;

  const snapshot = await boardCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
  const allPosts = snapshot.docs.map(doc => {
    const d = doc.data();
    return { id: doc.id, author: d.author, title: d.title, category: d.category, hasReply: Array.isArray(d.replies) && d.replies.length > 0, createdAt: d.createdAt };
  });
  const totalPages = Math.ceil(allPosts.length / perPage);
  const posts = allPosts.slice((page - 1) * perPage, page * perPage);

  const seoMeta = `<meta property="og:title" content="Board | MONKOS AI">
<meta property="og:description" content="MONKOS customer board">
<meta property="og:type" content="website">
<meta property="og:url" content="https://monkos.ai/board">
<link rel="canonical" href="https://monkos.ai/board">`;

  const rowsHtml = posts.map(p => `
      <a href="/board/${escapeHtml(p.id)}" class="board-row">
        <span class="board-cat">${escapeHtml(p.category || '')}</span>
        <span class="board-title">${escapeHtml(p.title)}${p.hasReply ? ' <span class="board-replied">answered</span>' : ''}</span>
        <span class="board-meta">${escapeHtml(p.author || '')} &middot; ${(p.createdAt || '').substring(0, 10)}</span>
      </a>`).join('');

  let paginationHtml = '';
  if (totalPages > 1) {
    const links = [];
    if (page > 1) links.push(`<a href="/board?page=${page - 1}">&laquo;</a>`);
    for (let i = 1; i <= totalPages; i++) {
      links.push(i === page ? `<span class="pg-current">${i}</span>` : `<a href="/board?page=${i}">${i}</a>`);
    }
    if (page < totalPages) links.push(`<a href="/board?page=${page + 1}">&raquo;</a>`);
    paginationHtml = `<div class="pagination">${links.join('')}</div>`;
  }

  const pageStyle = `
.board-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.board-header h1 { font-size: 28px; font-weight: 700; color: var(--text-bright); }
.btn-write {
  padding: 10px 20px; background: var(--accent); color: var(--bg);
  border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-write:hover { background: var(--accent2); }
.board-list { display: flex; flex-direction: column; gap: 2px; }
.board-row {
  display: grid; grid-template-columns: 80px 1fr 140px; gap: 12px; align-items: center;
  padding: 14px 16px; background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); transition: border-color 0.2s;
}
.board-row:hover { border-color: var(--border-hover); }
.board-cat { font-size: 12px; color: var(--accent); background: var(--surface2); padding: 3px 10px; border-radius: 10px; text-align: center; }
.board-title { font-size: 14px; font-weight: 500; color: var(--text-bright); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.board-replied { font-size: 11px; color: var(--success); background: rgba(52,211,153,0.15); padding: 2px 8px; border-radius: 8px; margin-left: 6px; }
.board-meta { font-size: 12px; color: var(--text-dim); text-align: right; }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 32px; }
.pagination a, .pagination .pg-current { padding: 8px 14px; border-radius: 6px; font-size: 14px; }
.pagination a { background: var(--surface); color: var(--text-dim); border: 1px solid var(--border); }
.pagination a:hover { border-color: var(--accent); color: var(--accent); }
.pg-current { background: var(--accent); color: var(--bg); font-weight: 600; }
@media (max-width: 600px) {
  .board-row { grid-template-columns: 1fr; gap: 4px; }
  .board-meta { text-align: left; }
}`;

  const bodyContent = `
  <div class="board-header">
    <h1>Board</h1>
    <a href="/board/write" class="btn-write">Write</a>
  </div>
  <div class="board-list">
    ${rowsHtml || '<p style="color:var(--text-dim);text-align:center;padding:40px">No posts yet.</p>'}
  </div>
  ${paginationHtml}`;

  return { title: 'Board | MONKOS AI', description: 'MONKOS customer board', seoMeta, htmlLang: 'ko', pageStyle, bodyContent, pageScript: null };
}

// GET /board — 게시판 목록 (기존 호출 호환)
export async function renderBoardList(req, res) {
  try {
    const parts = await boardListFragment(req);
    const lang = req.lang || parts.htmlLang || 'ko';
    // Board는 container max-width가 다름
    const html = `${layoutHead(parts.title, parts.description, parts.seoMeta || '', lang)}
${parts.pageStyle ? `<style>${parts.pageStyle}</style>` : ''}
</head>
<body>
${layoutNav(lang)}
<div class="container" style="max-width:900px;">
  ${parts.bodyContent}
</div>
${layoutFooter(lang)}
<script>window.__LANG__='${lang}';window.__REGION__='${req.paymentRegion || 'global'}';</script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 게시판 목록 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// 게시판 상세 — fragment
export async function boardPostFragment(req) {
  const id = decodeURIComponent(req.url.split('/board/')[1]?.split('?')[0] || '');
  if (!id || id === 'write') return null;

  const doc = await boardCollection.doc(id).get();
  if (!doc.exists || !doc.data().published) return null;

  const post = doc.data();
  const repliesHtml = (post.replies || []).map(r => `
      <div class="reply-item">
        <div class="reply-author">MONKOS</div>
        <div class="reply-text">${escapeHtml(r.text)}</div>
        <div class="reply-date">${(r.createdAt || '').substring(0, 10)}</div>
      </div>`).join('');

  const pageStyle = `
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
.board-post { max-width: 800px; margin: 0 auto; }
.board-post-header { margin-bottom: 24px; }
.board-post-header h1 { font-size: 24px; font-weight: 700; color: var(--text-bright); margin-bottom: 8px; }
.board-post-meta { font-size: 13px; color: var(--text-dim); display: flex; gap: 16px; }
.board-post-body {
  background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px;
  padding: 24px; font-size: 15px; line-height: 1.8; white-space: pre-wrap; color: var(--text);
  margin-bottom: 24px;
}
.replies-section h3 { font-size: 16px; color: var(--text-bright); margin-bottom: 12px; }
.reply-item {
  background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  padding: 16px; margin-bottom: 8px;
}
.reply-author { font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 4px; }
.reply-text { font-size: 14px; color: var(--text); line-height: 1.6; white-space: pre-wrap; }
.reply-date { font-size: 12px; color: var(--text-dim); margin-top: 8px; }
.btn-delete {
  margin-top: 16px; padding: 8px 16px; background: transparent;
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-dim); font-size: 13px; cursor: pointer;
}
.btn-delete:hover { border-color: #f87171; color: #f87171; }`;

  const bodyContent = `
  <a href="/board" class="post-back">&larr; Back to Board</a>
  <div class="board-post">
    <div class="board-post-header">
      <h1>${escapeHtml(post.title)}</h1>
      <div class="board-post-meta">
        <span>${escapeHtml(post.author || '')}</span>
        <span>${escapeHtml(post.category || '')}</span>
        <span>${(post.createdAt || '').substring(0, 10)}</span>
      </div>
    </div>
    <div class="board-post-body">${escapeHtml(post.content)}</div>
    ${repliesHtml ? `<div class="replies-section"><h3>Replies</h3>${repliesHtml}</div>` : ''}
    <button class="btn-delete" onclick="deletePost('${escapeHtml(doc.id)}')">Delete</button>
  </div>`;

  const pageScript = `
async function deletePost(id) {
  const pw = prompt('Enter password to delete');
  if (!pw) return;
  try {
    const r = await fetch('/api/board/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await r.json();
    if (data.success) { alert('Deleted'); location.href = '/board'; }
    else alert(data.error || 'Failed');
  } catch { alert('Error'); }
}`;

  return { title: `${post.title} | Board`, description: 'MONKOS Board', seoMeta: null, htmlLang: 'ko', pageStyle, bodyContent, pageScript };
}

// GET /board/:id — 게시글 상세 (기존 호출 호환)
export async function renderBoardPost(req, res) {
  try {
    const parts = await boardPostFragment(req);
    if (!parts) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found');
    }
    parts.paymentRegion = req.paymentRegion;
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 게시판 상세 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}

// 게시판 글쓰기 — fragment
export async function boardWriteFragment(req) {
  const pageStyle = `
.write-form { max-width: 700px; margin: 0 auto; }
.write-form h1 { font-size: 24px; font-weight: 700; color: var(--text-bright); margin-bottom: 24px; }
.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 13px; color: var(--text-dim); margin-bottom: 6px; font-weight: 500; }
.form-row input, .form-row select, .form-row textarea {
  width: 100%; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 14px; outline: none;
  font-family: inherit;
}
.form-row input:focus, .form-row select:focus, .form-row textarea:focus { border-color: var(--accent); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.btn-submit {
  padding: 14px 32px; background: var(--accent); color: var(--bg);
  border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer;
  margin-top: 8px;
}
.btn-submit:hover { background: var(--accent2); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.post-back { display: inline-block; margin-bottom: 24px; color: var(--text-dim); font-size: 14px; }
.post-back:hover { color: var(--accent); }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }`;

  const bodyContent = `
  <a href="/board" class="post-back">&larr; Back to Board</a>
  <div class="write-form">
    <h1>Write</h1>
    <div class="form-grid">
      <div class="form-row">
        <label>Nickname</label>
        <input type="text" id="author" maxlength="50" placeholder="Your name">
      </div>
      <div class="form-row">
        <label>Password (for delete)</label>
        <input type="password" id="password" maxlength="50" placeholder="Password">
      </div>
    </div>
    <div class="form-grid">
      <div class="form-row">
        <label>Title</label>
        <input type="text" id="title" maxlength="200" placeholder="Title">
      </div>
      <div class="form-row">
        <label>Category</label>
        <select id="category">
          <option value="후기">후기 (Review)</option>
          <option value="문의">문의 (Inquiry)</option>
          <option value="건의">건의 (Suggestion)</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <label>Content</label>
      <textarea id="content" rows="10" maxlength="5000" placeholder="Write your message..."></textarea>
    </div>
    <button class="btn-submit" id="submitBtn" onclick="submitPost()">Submit</button>
  </div>`;

  const pageScript = `
async function submitPost() {
  const btn = document.getElementById('submitBtn');
  const body = {
    author: document.getElementById('author').value.trim(),
    title: document.getElementById('title').value.trim(),
    content: document.getElementById('content').value.trim(),
    password: document.getElementById('password').value,
    category: document.getElementById('category').value,
  };
  if (!body.author || !body.title || !body.content || !body.password) {
    alert('All fields are required');
    return;
  }
  btn.disabled = true;
  try {
    const r = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (r.ok && data.id) {
      location.href = '/board/' + data.id;
    } else {
      alert(data.error || 'Failed');
      btn.disabled = false;
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false;
  }
}`;

  return { title: 'Write | Board', description: 'Write a post on MONKOS board', seoMeta: null, htmlLang: 'ko', pageStyle, bodyContent, pageScript };
}

// GET /board/write — 글쓰기 폼 (기존 호출 호환)
export async function renderBoardWrite(req, res) {
  try {
    const parts = await boardWriteFragment(req);
    parts.paymentRegion = req.paymentRegion;
    const html = layoutShell(parts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    log(`[CMS] 글쓰기 렌더 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
