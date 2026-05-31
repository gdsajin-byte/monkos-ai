// CF Workers 통합 챗봇 엔진 — Gemma 4 26B + D1 RAG + 채널 분기

import { CHANNEL_CONFIG, buildCoachingPrompt, READY_KEYWORDS } from './_lib/prompts.js';

const MODEL = '@cf/google/gemma-4-26b-a4b-it';

const ALLOWED_ORIGINS = [
  'https://monk.kr',
  'https://monkos.ai',
  'https://idphoto-kr.monkos.ai',
  'https://idphoto-jp.monkos.ai',
];

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Chat-API-Key',
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json' },
  });
}

// === 인증: 외부 호출 시 API Key 검증 ===
function authenticate(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (!origin && !request.headers.get('Referer')) return true;
  const apiKey = request.headers.get('X-Chat-API-Key');
  return apiKey && env.CHAT_API_KEY && apiKey === env.CHAT_API_KEY;
}

// === D1 RAG 검색 (FTS5) ===
async function searchRAG(db, query, channel) {
  const locale = ['idphoto-jp', 'line'].includes(channel) ? 'ja' : 'ko';
  const words = query.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return [];

  const ftsQuery = words.map(w => `"${w.replace(/"/g, '')}"`).join(' OR ');
  try {
    const results = await db.prepare(`
      SELECT rk.id, rk.title, rk.content, rank
      FROM rag_knowledge_fts fts
      JOIN rag_knowledge rk ON fts.rowid = rk.rowid
      WHERE rag_knowledge_fts MATCH ?
        AND rk.is_active = 1
        AND rk.locale IN (?, 'multi')
      ORDER BY rank
      LIMIT 3
    `).bind(ftsQuery, locale).all();
    return results.results || [];
  } catch {
    return fallbackRAG(db, words, locale);
  }
}

async function fallbackRAG(db, words, locale) {
  try {
    const results = await db.prepare(`
      SELECT id, title, content, keywords FROM rag_knowledge
      WHERE is_active = 1 AND locale IN (?, 'multi')
    `).bind(locale).all();

    return (results.results || [])
      .map(doc => {
        let score = 0;
        const kw = (doc.keywords || '').toLowerCase();
        const title = (doc.title || '').toLowerCase();
        const content = (doc.content || '').toLowerCase();
        for (const w of words) {
          const wl = w.toLowerCase();
          if (kw.includes(wl)) score += 10;
          if (title.includes(wl)) score += 5;
          if (content.includes(wl)) score += 2;
        }
        return { ...doc, score };
      })
      .filter(d => d.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  } catch {
    return [];
  }
}

// === D1 규격 검색 ===
async function searchSpecs(db, query) {
  const words = query.split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return [];

  const conditions = words.map(() =>
    `(c.name_ko LIKE ? OR c.name_en LIKE ? OR c.name_ja LIKE ? OR d.name_ko LIKE ? OR d.name_en LIKE ? OR d.type LIKE ?)`
  );
  const params = words.flatMap(w => {
    const q = `%${w}%`;
    return [q, q, q, q, q, q];
  });

  try {
    const sql = `
      SELECT d.*, c.name_ko AS country_ko, c.name_en AS country_en, c.name_ja AS country_ja
      FROM documents d
      JOIN countries c ON d.country_id = c.id
      WHERE d.is_published = 1 AND (${conditions.join(' OR ')})
      LIMIT 5`;
    const stmt = db.prepare(sql);
    const results = await stmt.bind(...params).all();
    return results.results || [];
  } catch {
    return [];
  }
}

function formatSpecs(specs, channel) {
  if (specs.length === 0) return '';
  const isJa = ['idphoto-jp', 'line'].includes(channel);
  const header = isJa ? '\n\n[証明写真規格情報]' : '\n\n[증명사진 규격 정보]';
  const lines = specs.map(s => {
    const country = isJa ? (s.country_ja || s.country_ko) : s.country_ko;
    const name = isJa ? (s.name_ja || s.name_ko) : s.name_ko;
    const size = s.size_display ? `${s.size_display}mm` : '';
    const std = s.standard || '';
    return `- ${country} ${name}: ${size} ${std}`.trim();
  });
  return header + '\n' + lines.join('\n');
}

// === D1 대화 로그 ===
async function logMessage(db, sessionId, channel, role, message) {
  try {
    await db.prepare(`
      INSERT INTO chat_logs (session_id, channel, role, message)
      VALUES (?, ?, ?, ?)
    `).bind(sessionId, channel, role, message.substring(0, 4000)).run();
  } catch { /* 로깅 실패는 무시 */ }
}

async function getHistory(db, sessionId, limit = 20) {
  try {
    const results = await db.prepare(`
      SELECT role, message FROM chat_logs
      WHERE session_id = ?
      ORDER BY id DESC LIMIT ?
    `).bind(sessionId, limit).all();
    return (results.results || []).reverse().map(r => ({
      role: r.role,
      content: r.message,
    }));
  } catch {
    return [];
  }
}

// === 규격 질문 감지 ===
const SPEC_KEYWORDS = [
  '규격', '사이즈', '크기', 'size', 'spec',
  '여권', 'passport', 'パスポート',
  '비자', 'visa', 'ビザ',
  '면허', 'license', '免許',
  '이력서', 'resume', '履歴書',
  'mm', 'px', '픽셀',
];

function isSpecQuestion(message) {
  const lower = message.toLowerCase();
  return SPEC_KEYWORDS.some(kw => lower.includes(kw));
}

// === CORS Preflight ===
export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

// === 메인 핸들러 ===
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.AI) return json({ success: false, error: 'AI binding not configured' }, 500, request);
  if (!authenticate(request, env)) return json({ success: false, error: 'Unauthorized' }, 401, request);

  try {
    const body = await request.json();
    const channel = body.channel || 'monk';
    const config = CHANNEL_CONFIG[channel];
    if (!config) return json({ success: false, error: `Unknown channel: ${channel}` }, 400, request);

    const sessionId = body.sessionId || `anon_${Date.now()}`;
    const userMessages = body.messages || [];
    const singleMessage = body.message;
    const image = body.image;

    let userText = '';
    if (singleMessage) {
      userText = singleMessage;
    } else if (userMessages.length > 0) {
      const last = userMessages[userMessages.length - 1];
      userText = last.content || last.text || '';
    }

    if (!userText && !image) {
      return json({ success: false, error: 'message or messages required' }, 400, request);
    }

    // --- coaching 채널 (stateless + vision) ---
    if (channel === 'coaching') {
      const coachPrompt = buildCoachingPrompt(body.options || body);
      const aiParams = {
        messages: [
          { role: 'system', content: coachPrompt },
          { role: 'user', content: userText || '이 사진의 자세, 조명, 표정을 체크해주세요.' },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      };
      if (image) {
        const dataUri = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
        aiParams.image = dataUri;
      }
      const result = await env.AI.run(MODEL, aiParams);
      const text = result.response || result.choices?.[0]?.message?.content || '';
      const ready = READY_KEYWORDS.some(kw => text.includes(kw));
      return json({ success: true, response: text.trim(), text: text.trim(), ready }, 200, request);
    }

    // --- stateful 채널 ---
    let systemPrompt = config.prompt;

    // RAG 검색
    if (config.rag && env.DB && userText) {
      const ragDocs = await searchRAG(env.DB, userText, channel);
      if (ragDocs.length > 0) {
        const ragContext = ragDocs.map(d => `【${d.title}】${d.content.substring(0, 150)}`).join('\n');
        systemPrompt += '\n\n[참고 지식]\n' + ragContext.substring(0, 500);
      }

      if (isSpecQuestion(userText)) {
        const specs = await searchSpecs(env.DB, userText);
        const specText = formatSpecs(specs, channel);
        if (specText) systemPrompt += specText.substring(0, 300);
      }
    }

    // 대화 히스토리 구성
    let history = [];
    if (userMessages.length > 1) {
      history = userMessages.slice(0, -1).slice(-20).map(m => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content || m.text || '',
      }));
    } else if (env.DB) {
      history = await getHistory(env.DB, sessionId);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userText },
    ];

    let result = await env.AI.run(MODEL, {
      messages,
      temperature: config.temperature,
      max_tokens: 1024,
    });

    let response = (result.response || result.choices?.[0]?.message?.content || '').trim();

    if (!response && messages.length > 1) {
      const fallbackMessages = [
        { role: 'system', content: config.prompt },
        { role: 'user', content: userText },
      ];
      result = await env.AI.run(MODEL, {
        messages: fallbackMessages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });
      response = (result.response || result.choices?.[0]?.message?.content || '').trim();
    }

    // D1 로그 (비동기, 실패 무시)
    if (env.DB) {
      context.waitUntil(
        Promise.all([
          logMessage(env.DB, sessionId, channel, 'user', userText),
          logMessage(env.DB, sessionId, channel, 'assistant', response),
        ])
      );
    }

    return json({
      success: true,
      response,
      reply: response,
      sessionId,
    }, 200, request);

  } catch (error) {
    return json({ success: false, error: error.message || 'Internal server error' }, 500, request);
  }
}
