/**
 * D1 거래내역 원장 API
 *
 * POST /api/tx — 거래 기록 (monkos_AI → D1)
 * GET  /api/tx — 거래 조회 (userId 기반)
 *
 * 인증: X-API-Key 헤더 (env.TX_API_KEY)
 * D1 바인딩: env.DB (monk-services-db)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

function verifyApiKey(request, env) {
  const key = request.headers.get('X-API-Key');
  if (!env.TX_API_KEY || key !== env.TX_API_KEY) {
    return false;
  }
  return true;
}

// === POST: 거래 기록 ===
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!verifyApiKey(request, env)) {
    return json({ error: '인증 실패' }, 401);
  }

  const db = env.DB;
  if (!db) {
    return json({ error: 'D1 바인딩 없음' }, 500);
  }

  try {
    const body = await request.json();
    const { userId, amount, type, service, provider, balanceAfter, description, referenceId, metadata } = body;

    if (!userId || amount === undefined || !type) {
      return json({ error: 'userId, amount, type 필수' }, 400);
    }

    // type 검증
    const validTypes = ['charge', 'use', 'refund', 'bonus'];
    if (!validTypes.includes(type)) {
      return json({ error: `type은 ${validTypes.join(', ')} 중 하나` }, 400);
    }

    const metadataJson = metadata ? JSON.stringify(metadata) : null;

    const result = await db.prepare(`
      INSERT INTO shared_credit_transactions
        (user_id, amount, type, service, provider, balance_after, description, reference_id, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      amount,
      type,
      service || null,
      provider || null,
      balanceAfter ?? null,
      description || null,
      referenceId || null,
      metadataJson
    ).run();

    return json({ success: true, id: result.meta?.last_row_id });
  } catch (err) {
    console.error('[tx] POST 에러:', err);
    return json({ error: err.message }, 500);
  }
}

// === GET: 거래 조회 ===
export async function onRequestGet(context) {
  const { request, env } = context;

  if (!verifyApiKey(request, env)) {
    return json({ error: '인증 실패' }, 401);
  }

  const db = env.DB;
  if (!db) {
    return json({ error: 'D1 바인딩 없음' }, 500);
  }

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const type = url.searchParams.get('type');
    const service = url.searchParams.get('service');

    if (!userId) {
      return json({ error: 'userId 파라미터 필수' }, 400);
    }

    // 동적 WHERE 절
    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (type) {
      where += ' AND type = ?';
      params.push(type);
    }
    if (service) {
      where += ' AND service = ?';
      params.push(service);
    }

    // 총 건수
    const countResult = await db.prepare(
      `SELECT COUNT(*) as total FROM shared_credit_transactions ${where}`
    ).bind(...params).first();

    // 거래 목록
    const rows = await db.prepare(
      `SELECT * FROM shared_credit_transactions ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all();

    return json({
      total: countResult?.total || 0,
      limit,
      offset,
      transactions: rows.results || [],
    });
  } catch (err) {
    console.error('[tx] GET 에러:', err);
    return json({ error: err.message }, 500);
  }
}

// === OPTIONS (CORS) ===
export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}
