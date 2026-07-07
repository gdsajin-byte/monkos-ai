import { firestore, log, GA4_PROPERTY_ID, ADMIN_UIDS } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

const usersCol = firestore.collection('users');
const txCol = firestore.collection('transactions');

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
