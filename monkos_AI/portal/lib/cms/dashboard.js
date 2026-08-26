import { firestore, log, GA4_PROPERTY_ID, ADMIN_UIDS } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { bq } from '../tracking.js';
import { Storage } from '@google-cloud/storage';

const usersCol = firestore.collection('users');
const txCol = firestore.collection('transactions');
const gensCol = firestore.collection('generations');
const gcsBucket = new Storage().bucket(process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos');

function toDateStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.slice(0, 10);
  if (val.toDate) return val.toDate().toISOString().slice(0, 10);
  if (val._seconds) return new Date(val._seconds * 1000).toISOString().slice(0, 10);
  return '';
}

function toISOStr(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (val.toDate) return val.toDate().toISOString();
  if (val._seconds) return new Date(val._seconds * 1000).toISOString();
  return '';
}

function toKSTStr(val) {
  if (!val) return '';
  let d;
  if (typeof val === 'string') { d = new Date(val); if (isNaN(d.getTime())) return ''; }
  else if (val.toDate) d = val.toDate();
  else if (val._seconds) d = new Date(val._seconds * 1000);
  else return '';
  const kst = new Date(d.getTime() + 9 * 3600000);
  return kst.toISOString().replace('T', ' ').slice(0, 16);
}

function isTestUser(uid) {
  return ADMIN_UIDS.includes(uid);
}

let analyticsClient;
try {
  analyticsClient = new BetaAnalyticsDataClient();
} catch (err) {
  log(`[Dashboard] GA4 클라이언트 초기화 실패: ${err.message}`, 'WARNING');
}

function todayKST() {
  const d = new Date(Date.now() + 9 * 3600000);
  return d.toISOString().slice(0, 10);
}

function monthStartKST() {
  const d = new Date(Date.now() + 9 * 3600000);
  return d.toISOString().slice(0, 7) + '-01';
}

function daysAgoDate(days) {
  const d = new Date(Date.now() + 9 * 3600000 - days * 86400000);
  return d.toISOString().slice(0, 10);
}

function parseDays(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const d = parseInt(url.searchParams.get('days') || '30', 10);
  return Math.min(Math.max(d, 1), 90);
}

export async function handleDashboardSummary(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const today = todayKST();
    const yesterday = daysAgoDate(1);

    const [usersSnap, txSnap] = await Promise.all([usersCol.get(), txCol.get()]);

    let totalUsers = 0, todaySignups = 0, yesterdaySignups = 0;
    let activeToday = 0, totalCredits = 0;

    usersSnap.forEach(doc => {
      const data = doc.data();
      if (isTestUser(doc.id)) return;
      totalUsers++;
      totalCredits += data.credits || 0;
      const created = toDateStr(data.createdAt);
      if (created === today) todaySignups++;
      if (created === yesterday) yesterdaySignups++;
      const lastLogin = toDateStr(data.lastLogin);
      if (lastLogin === today) activeToday++;
    });

    const payingUserIds = new Set();
    let todayCharges = 0, yesterdayCharges = 0;
    let todayRevenue = 0, yesterdayRevenue = 0;
    let todayConsumed = 0, yesterdayConsumed = 0;

    txSnap.forEach(doc => {
      const d = doc.data();
      if (isTestUser(d.userId)) return;
      const date = toDateStr(d.createdAt);
      if (d.type === 'charge') {
        payingUserIds.add(d.userId);
        const rev = (d.metadata && typeof d.metadata.amount === 'number') ? d.metadata.amount : 0;
        if (date === today) { todayCharges++; todayRevenue += rev; }
        if (date === yesterday) { yesterdayCharges++; yesterdayRevenue += rev; }
      }
      if (d.type === 'use') {
        const c = Math.abs(d.amount || 0);
        if (date === today) todayConsumed += c;
        if (date === yesterday) yesterdayConsumed += c;
      }
    });

    const conversionRate = totalUsers > 0 ? Math.round((payingUserIds.size / totalUsers) * 1000) / 10 : 0;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalUsers,
      todaySignups, yesterdaySignups,
      todayCharges, yesterdayCharges,
      activeToday,
      todayRevenue, yesterdayRevenue,
      conversionRate,
      todayConsumed, yesterdayConsumed,
      totalCredits,
      payingUsers: payingUserIds.size,
    }));
  } catch (err) {
    log(`[Dashboard] summary 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardUsers(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const days = parseDays(req);
    const since = daysAgoDate(days);
    const snapshot = await usersCol.get();

    const dailyMap = {};
    const byProvider = {};
    const recentUsers = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const provider = data.provider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + 1;

      const created = toDateStr(data.createdAt);
      if (created >= since) {
        dailyMap[created] = (dailyMap[created] || 0) + 1;
      }

      const createdISO = toISOStr(data.createdAt);
      recentUsers.push({
        id: doc.id,
        name: data.name || '',
        provider,
        email: data.email || '',
        credits: data.credits || 0,
        createdAt: createdISO,
      });
    });

    recentUsers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      daily,
      byProvider,
      total: snapshot.size,
      recentUsers: recentUsers.slice(0, 20),
    }));
  } catch (err) {
    log(`[Dashboard] users 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardCredits(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const usersSnap = await usersCol.get();
    let totalCredits = 0;
    const distribution = { zero: 0, low: 0, mid: 0, high: 0 };

    usersSnap.forEach(doc => {
      const c = doc.data().credits || 0;
      totalCredits += c;
      if (c === 0) distribution.zero++;
      else if (c <= 5) distribution.low++;
      else if (c <= 20) distribution.mid++;
      else distribution.high++;
    });

    const txSnap = await txCol.orderBy('createdAt', 'desc').limit(50).get();
    const recentTransactions = txSnap.docs.map(doc => {
      const d = doc.data();
      return {
        userId: d.userId || '',
        amount: d.amount || 0,
        type: d.type || '',
        description: d.description || '',
        createdAt: d.createdAt || '',
      };
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ distribution, totalCredits, recentTransactions }));
  } catch (err) {
    log(`[Dashboard] credits 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardUsers360(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const showTest = url.searchParams.get('test') === '1';
    const days = parseInt(url.searchParams.get('days') || '30', 10);
    const since = daysAgoDate(Math.min(Math.max(days, 1), 90));

    const [usersSnap, txSnap] = await Promise.all([usersCol.get(), txCol.get()]);

    const txByUser = {};
    txSnap.forEach(doc => {
      const d = doc.data();
      const uid = d.userId;
      if (!uid) return;
      if (!txByUser[uid]) txByUser[uid] = [];
      txByUser[uid].push({
        type: d.type,
        amount: d.amount || 0,
        createdAt: toISOStr(d.createdAt),
        date: toDateStr(d.createdAt),
        description: d.description || '',
        metadata: d.metadata || {},
      });
    });

    const dailyMap = {};
    const byProvider = {};
    const users = [];

    usersSnap.forEach(doc => {
      const data = doc.data();
      const uid = doc.id;
      const test = isTestUser(uid);
      if (test && !showTest) return;

      const provider = data.provider || 'unknown';
      if (!test) {
        byProvider[provider] = (byProvider[provider] || 0) + 1;
        const created = toDateStr(data.createdAt);
        if (created >= since) {
          dailyMap[created] = (dailyMap[created] || 0) + 1;
        }
      }

      const userTx = txByUser[uid] || [];
      const charges = userTx.filter(t => t.type === 'charge');
      const uses = userTx.filter(t => t.type === 'use');
      const hasGenerate = uses.some(t => t.description.includes('generate'));
      const hasDownload = uses.some(t => t.description.includes('download'));

      let funnelStage = 2;
      if (hasGenerate) funnelStage = 3;
      if (charges.length > 0) funnelStage = Math.max(funnelStage, 4);
      if (hasDownload) funnelStage = 5;

      const totalPaid = charges.reduce((sum, t) =>
        sum + ((t.metadata && typeof t.metadata.amount === 'number') ? t.metadata.amount : 0), 0);
      const generateCount = uses.filter(t => t.description.includes('generate')).length;

      const sortedTx = userTx.length > 0
        ? [...userTx].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [];
      const lastTxDate = sortedTx.length > 0 ? sortedTx[0].createdAt : '';
      const lastLoginISO = toISOStr(data.lastLogin);
      const lastActivity = (lastTxDate && lastLoginISO)
        ? (lastTxDate > lastLoginISO ? lastTxDate : lastLoginISO)
        : (lastTxDate || lastLoginISO);

      users.push({
        id: uid, name: data.name || '', email: data.email || '',
        provider,
        createdAt: toKSTStr(data.createdAt),
        createdAtRaw: toISOStr(data.createdAt),
        funnelStage, generateCount,
        hasCharge: charges.length > 0,
        totalPaid, chargeCount: charges.length,
        credits: data.credits || 0,
        lastActivity: lastActivity ? toKSTStr(lastActivity) : '',
        lastActivityRaw: lastActivity || '',
        isTest: test,
        transactions: sortedTx.slice(0, 20),
        signupSource: data.signupSource || null,
        referrer: data.acquisition?.referrer || null,
      });
    });

    users.sort((a, b) => (b.createdAtRaw || '').localeCompare(a.createdAtRaw || ''));

    const daily = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ users, daily, byProvider, total: users.length }));
  } catch (err) {
    log(`[Dashboard] users360 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

let citadelCache = { data: null, ts: 0 };
const CITADEL_CACHE_TTL = 3600000;

export async function handleDashboardCitadel(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const now = Date.now();
  if (citadelCache.data && (now - citadelCache.ts) < CITADEL_CACHE_TTL) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(citadelCache.data));
  }

  try {
    const startDate = daysAgoDate(7);
    const endDate = todayKST();

    let ga4 = { sessions7d: 0, sessionsDaily: 0, newUsers7d: 0, dataDate: endDate };
    if (analyticsClient) {
      try {
        const [response] = await analyticsClient.runReport({
          property: `properties/${GA4_PROPERTY_ID}`,
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'newUsers' },
          ],
        });
        for (const row of response.rows || []) {
          ga4.sessions7d += parseInt(row.metricValues[0].value, 10);
          ga4.newUsers7d += parseInt(row.metricValues[1].value, 10);
        }
        ga4.sessionsDaily = Math.round(ga4.sessions7d / 7);
      } catch (err) {
        log(`[CITADEL] GA4 조회 실패: ${err.message}`, 'WARNING');
      }
    }

    let funnel = { spec_select: 0, photo_upload: 0, generate_click: 0, preview_view: 0, begin_checkout: 0, purchase: 0 };
    let bqEvents = { page_view: 0, auth_login: 0, auth_signup: 0, credit_charge: 0, api_generate: 0 };
    try {
      const [rows] = await bq.query({
        query: `SELECT event_name, COUNT(*) as cnt
                FROM \`monkos.monkos_tracking.events\`
                WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
                GROUP BY event_name`,
        location: 'asia-northeast3',
      });
      for (const row of rows) {
        const name = row.event_name;
        const cnt = parseInt(row.cnt, 10);
        if (name in bqEvents) bqEvents[name] = cnt;
        if (name === 'spec_select') funnel.spec_select = cnt;
        if (name === 'photo_upload') funnel.photo_upload = cnt;
        if (name === 'api_generate') funnel.generate_click = cnt;
        if (name === 'preview_view') funnel.preview_view = cnt;
        if (name === 'credit_charge') funnel.begin_checkout = cnt;
        if (name === 'purchase') funnel.purchase = cnt;
      }
    } catch (err) {
      log(`[CITADEL] BQ 조회 실패: ${err.message}`, 'WARNING');
    }

    const result = {
      ga4,
      funnel,
      bqEvents,
      secrets: { sm: 44, gh: 18 },
      channels: {
        live: ['GSC Search Analytics', 'GA4 Data API', 'Google Indexing API', 'IndexNow', 'BQ User Tracking', 'AI Referral', 'SEO Health Check'],
        ready: ['Naver 검색광고 API', 'Naver DataLab', 'Bing WMT API', 'PageSpeed Insights'],
        off: ['BQ→대시보드 시각화', '색인 피드백 루프', '키워드 시계열 DB', '경쟁사 모니터링', 'AI 인용 추적', 'Naver 서치어드바이저'],
      },
    };

    citadelCache = { data: result, ts: now };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[CITADEL] 종합 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardTraffic(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (!analyticsClient) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'GA4 클라이언트 미초기화' }));
    return;
  }

  try {
    const days = parseDays(req);
    const startDate = daysAgoDate(days);
    const endDate = todayKST();

    const [response] = await analyticsClient.runReport({
      property: `properties/${GA4_PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'newUsers' },
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'averageSessionDuration' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date', orderType: 'ALPHANUMERIC' }, desc: true }],
    });

    const daily = [];
    let totalSessions = 0, totalNewUsers = 0, totalDuration = 0, rowCount = 0;

    for (const row of response.rows || []) {
      const raw = row.dimensionValues[0].value;
      const date = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
      const newUsers = parseInt(row.metricValues[0].value, 10);
      const activeUsers = parseInt(row.metricValues[1].value, 10);
      const sessions = parseInt(row.metricValues[2].value, 10);
      const avgDuration = parseFloat(row.metricValues[3].value);

      daily.push({ date, newUsers, activeUsers, sessions });
      totalSessions += sessions;
      totalNewUsers += newUsers;
      totalDuration += avgDuration;
      rowCount++;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      daily,
      summary: {
        totalSessions,
        totalNewUsers,
        avgSessionDuration: rowCount ? Math.round(totalDuration / rowCount) : 0,
      },
    }));
  } catch (err) {
    log(`[Dashboard] traffic 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardUserDetail(req, res, userId) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const userDoc = await usersCol.doc(userId).get();
    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'User not found' }));
    }

    const u = userDoc.data();
    const profile = {
      id: userId,
      name: u.name || '',
      email: u.email || '',
      provider: u.provider || 'unknown',
      picture: u.picture || null,
      credits: u.credits || 0,
      createdAt: toISOStr(u.createdAt),
      lastLogin: toISOStr(u.lastLogin),
      isTest: isTestUser(userId),
    };

    const acquisition = {
      signupSource: u.signupSource || null,
      referrer: u.acquisition?.referrer || null,
      landingUrl: u.acquisition?.landingUrl || null,
      firstVisit: u.acquisition?.firstVisit ? toISOStr(u.acquisition.firstVisit) : null,
      source: u.acquisition?.referrer ? 'firestore' : null,
    };

    if (!acquisition.referrer) {
      try {
        const [bqAcq] = await bq.query({
          query: `WITH user_sessions AS (
                    SELECT session_id FROM \`monkos.monkos_tracking.identity_map\` WHERE user_id = @userId
                  ),
                  first_external AS (
                    SELECT e.referer, e.page_path, e.event_timestamp,
                           ROW_NUMBER() OVER (ORDER BY e.event_timestamp ASC) as rn
                    FROM \`monkos.monkos_tracking.events\` e
                    JOIN user_sessions us ON e.session_id = us.session_id
                    WHERE e.event_name = 'page_view'
                      AND e.event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
                      AND e.referer IS NOT NULL AND e.referer != ''
                      AND e.referer NOT LIKE '%monkos.ai%'
                      AND e.referer NOT LIKE '%monkos-portal%'
                  )
                  SELECT referer, page_path, event_timestamp FROM first_external WHERE rn = 1`,
          params: { userId },
          location: 'asia-northeast3',
        });
        if (bqAcq.length > 0) {
          acquisition.referrer = bqAcq[0].referer;
          acquisition.landingUrl = bqAcq[0].page_path;
          acquisition.firstVisit = bqAcq[0].event_timestamp?.value || bqAcq[0].event_timestamp || '';
          acquisition.source = 'bq_traced';
        }
      } catch (e) {
        log(`[Dashboard] BQ acquisition 역추적 실패: ${e.message}`, 'WARNING');
      }
    }

    const [txSnap, gensSnap] = await Promise.all([
      txCol.where('userId', '==', userId).orderBy('createdAt', 'desc').limit(50).get(),
      gensCol.where('userId', '==', userId).orderBy('createdAt', 'desc').limit(50).get(),
    ]);

    const transactions = txSnap.docs.map(doc => {
      const d = doc.data();
      return {
        type: d.type || '',
        amount: d.amount || 0,
        createdAt: toISOStr(d.createdAt),
        description: d.description || '',
        provider: d.metadata?.provider || null,
      };
    });

    const charges = transactions.filter(t => t.type === 'charge');
    const uses = transactions.filter(t => t.type === 'use');
    const hasGenerate = uses.some(t => t.description.includes('generate'));
    const hasDownload = uses.some(t => t.description.includes('download'));
    let funnelStage = 2;
    if (hasGenerate) funnelStage = 3;
    if (charges.length > 0) funnelStage = Math.max(funnelStage, 4);
    if (hasDownload) funnelStage = 5;

    const totalPaid = charges.reduce((sum, t) => sum + ((t.provider || t.amount > 0) ? 0 : 0), 0);
    const generateCount = uses.filter(t => t.description.includes('generate')).length;

    const totalPaidKRW = txSnap.docs
      .filter(d => d.data().type === 'charge')
      .reduce((sum, d) => {
        const m = d.data().metadata;
        return sum + ((m && typeof m.amount === 'number') ? m.amount : 0);
      }, 0);

    const generations = await Promise.all(gensSnap.docs.map(async doc => {
      const g = doc.data();
      let originalUrl = null, generatedUrl = null;
      try {
        if (g.gcsOriginal) {
          [originalUrl] = await gcsBucket.file(g.gcsOriginal).getSignedUrl({ action: 'read', expires: Date.now() + 3600000 });
        }
        if (g.gcsGenerated) {
          [generatedUrl] = await gcsBucket.file(g.gcsGenerated).getSignedUrl({ action: 'read', expires: Date.now() + 3600000 });
        }
      } catch (e) {
        log(`[Dashboard] 서명 URL 실패: ${e.message}`, 'WARNING');
      }
      return {
        id: doc.id,
        service: g.service || '',
        style: g.style || '',
        slug: g.slug || null,
        gcsOriginal: g.gcsOriginal || '',
        gcsGenerated: g.gcsGenerated || '',
        status: g.status || 'active',
        createdAt: g.createdAt || '',
        originalUrl,
        generatedUrl,
      };
    }));

    let timeline = [];
    try {
      const [rows] = await bq.query({
        query: `SELECT event_name, event_timestamp, page_path, referer, params
                FROM \`monkos.monkos_tracking.events\`
                WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
                  AND (user_id = @userId OR session_id IN (
                    SELECT session_id FROM \`monkos.monkos_tracking.identity_map\`
                    WHERE user_id = @userId
                  ))
                  AND NOT REGEXP_CONTAINS(COALESCE(page_path, ''), r'\\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
                  AND NOT STARTS_WITH(COALESCE(page_path, ''), '/js/')
                  AND NOT STARTS_WITH(COALESCE(page_path, ''), '/css/')
                  AND NOT STARTS_WITH(COALESCE(page_path, ''), '/assets/')
                  AND NOT STARTS_WITH(COALESCE(page_path, ''), '/fonts/')
                ORDER BY event_timestamp DESC LIMIT 200`,
        params: { userId },
        location: 'asia-northeast3',
      });
      timeline = rows.map(r => ({
        eventName: r.event_name,
        timestamp: r.event_timestamp?.value || r.event_timestamp || '',
        pagePath: r.page_path || '',
        referer: r.referer || '',
      }));
    } catch (e) {
      log(`[Dashboard] BQ timeline 조회 실패: ${e.message}`, 'WARNING');
    }

    const sortedTx = [...transactions].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const lastTxDate = sortedTx.length > 0 ? sortedTx[0].createdAt : '';
    const lastLoginISO = toISOStr(u.lastLogin);
    const lastActivity = (lastTxDate && lastLoginISO)
      ? (lastTxDate > lastLoginISO ? lastTxDate : lastLoginISO)
      : (lastTxDate || lastLoginISO);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      profile,
      acquisition,
      funnelStage,
      funnelLabels: ['방문', '가입', '생성', '결제', '다운로드'],
      stats: {
        generateCount,
        totalPaid: totalPaidKRW,
        chargeCount: charges.length,
        lastActivity: lastActivity || null,
      },
      generations,
      transactions,
      timeline,
    }));
  } catch (err) {
    log(`[Dashboard] userDetail 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleDashboardChannels(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const days = parseInt(new URL(req.url, `http://${req.headers.host}`).searchParams.get('days') || '7', 10);

    const [[channels], [directRows]] = await Promise.all([
      bq.query({
        query: `WITH external_visits AS (
                  SELECT referer, page_path, event_timestamp
                  FROM \`monkos.monkos_tracking.events\`
                  WHERE event_name = 'page_view'
                    AND event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
                    AND referer IS NOT NULL AND referer != ''
                    AND referer NOT LIKE '%monkos.ai%'
                    AND referer NOT LIKE '%monkos-portal%'
                    AND NOT REGEXP_CONTAINS(page_path, r'\\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
                    AND NOT STARTS_WITH(page_path, '/js/')
                    AND NOT STARTS_WITH(page_path, '/css/')
                    AND NOT STARTS_WITH(page_path, '/assets/')
                    AND (user_agent IS NULL OR NOT REGEXP_CONTAINS(user_agent, r'(?i)(bot|crawler|spider|ahref|semrush|yandex|gptbot|bingbot|googlebot)'))
                    -- 취약점 스캐너 제외 (2026-08-26): UA·리퍼러를 위조하므로 UA 필터로는 안 걸린다.
                    -- 실측 오염: (직접 접속) 93% + google.com 상위 착지가 /.env·/.env.bak 계열
                    AND NOT REGEXP_CONTAINS(page_path, r'(?i)(^/\\.|wp-admin|wp-content|wp-includes|wp-login|xmlrpc|\\.php|\\.env|\\.git|/vendor/|phpmyadmin|\\.aws|\\.ssh|/cgi-bin/|\\.sql$|\\.bak$|/backup)')
                )
                SELECT
                  NET.HOST(referer) as source_domain,
                  COUNT(*) as visits,
                  ARRAY_AGG(DISTINCT page_path ORDER BY page_path LIMIT 5) as top_landings,
                  ARRAY_AGG(DISTINCT referer ORDER BY referer LIMIT 5) as sample_urls
                FROM external_visits
                GROUP BY source_domain
                ORDER BY visits DESC
                LIMIT 15`,
        params: { days },
        location: 'asia-northeast3',
      }),
      bq.query({
        query: `SELECT COUNT(*) as cnt
                FROM \`monkos.monkos_tracking.events\`
                WHERE event_name = 'page_view'
                  AND event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
                  AND (referer IS NULL OR referer = '')
                  AND NOT REGEXP_CONTAINS(page_path, r'\\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
                  AND NOT STARTS_WITH(page_path, '/js/')
                  AND NOT STARTS_WITH(page_path, '/css/')
                  AND NOT STARTS_WITH(page_path, '/assets/')
                  AND (user_agent IS NULL OR NOT REGEXP_CONTAINS(user_agent, r'(?i)(bot|crawler|spider|ahref|semrush|yandex|gptbot|bingbot|googlebot)'))
                  -- 스캐너 제외 — 직접 접속 집계가 이들로 부풀어 93%를 차지했다 (2026-08-26)
                  AND NOT REGEXP_CONTAINS(page_path, r'(?i)(^/\\.|wp-admin|wp-content|wp-includes|wp-login|xmlrpc|\\.php|\\.env|\\.git|/vendor/|phpmyadmin|\\.aws|\\.ssh|/cgi-bin/|\\.sql$|\\.bak$|/backup)')`,
        params: { days },
        location: 'asia-northeast3',
      }),
    ]);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      days,
      channels: channels.map(r => ({
        domain: r.source_domain,
        visits: parseInt(r.visits, 10),
        topLandings: r.top_landings || [],
        sampleUrls: r.sample_urls || [],
      })),
      directVisits: parseInt(directRows[0]?.cnt || 0, 10),
    }));
  } catch (err) {
    log(`[Dashboard] channels 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
