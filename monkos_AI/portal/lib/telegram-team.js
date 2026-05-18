/** 담당: 막내3 (리파인) */

import { firestore, log, parseJsonBody, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID, TEAM_NOTIFY_SECRET } from './shared/config.js';

// === Telegram Team Bot 웹훅 (@monkos_team_bot) — 팀 협업 전용 ===
export async function handleTelegramTeamWebhook(req, res) {
  try {
    const update = await parseJsonBody(req);
    const msg = update.message;
    if (!msg || !msg.text) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const chatId = msg.chat.id;
    const username = msg.from?.username || msg.from?.first_name || '알수없음';
    const displayName = msg.from?.first_name || username;
    const text = msg.text.trim();

    // /report — 보고서 제출
    if (text.startsWith('/report')) {
      const content = text.replace(/^\/report\s*/, '').trim();
      if (!content) {
        await sendTelegramMessage(chatId, '사용법: /report [보고 내용]', TELEGRAM_TEAM_API);
      } else {
        await firestore.collection('team_reports').add({
          author: displayName,
          authorUsername: username,
          chatId,
          content,
          timestamp: new Date().toISOString(),
          category: 'auto'
        });
        const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        await sendTelegramMessage(chatId, `✅ 보고서 접수 — ${displayName} (${now})`, TELEGRAM_TEAM_API);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // /status — 서비스 상태
    if (text === '/status') {
      let statusMsg = '📊 MONKOS 서비스 상태\n━━━━━━━━━━━━━━\n';
      const services = [
        { name: 'portal', url: 'https://monkos-portal-4jeplpqpua-uc.a.run.app/health' },
        { name: 'idphoto-kr', url: 'https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health' },
        { name: 'idphoto-jp', url: 'https://monkos-idphoto-jp-4jeplpqpua-uc.a.run.app/health' }
      ];
      for (const svc of services) {
        try {
          const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
          const ok = r.ok;
          statusMsg += `${ok ? '🟢' : '🔴'} ${svc.name}: ${ok ? '정상' : '이상'}\n`;
        } catch {
          statusMsg += `🔴 ${svc.name}: 응답없음\n`;
        }
      }
      // 오늘 보고서 수
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const snap = await firestore.collection('team_reports')
          .where('timestamp', '>=', today.toISOString())
          .get();
        statusMsg += `━━━━━━━━━━━━━━\n최근 보고서: ${snap.size}건 (오늘)`;
      } catch {
        statusMsg += '━━━━━━━━━━━━━━';
      }
      await sendTelegramMessage(chatId, statusMsg, TELEGRAM_TEAM_API);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // /help — 도움말
    if (text === '/help' || text === '/start') {
      const helpMsg = '🤖 MONK TeamChat 봇\n━━━━━━━━━━━━━━\n/report [내용] — 보고서 제출\n/status — 서비스 상태 확인\n/help — 이 도움말';
      await sendTelegramMessage(chatId, helpMsg, TELEGRAM_TEAM_API);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // 일반 메시지 — 그룹 대화 간섭 안 함 (무시)
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[TG-TEAM] 웹훅 에러: ${err.message}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}

// === Team 알림 API — 에이전트 → 그룹 알림 ===
export async function handleTeamNotify(req, res) {
  try {
    // 간단 인증 (TEAM_NOTIFY_SECRET 미설정 시 비활성화)
    const secret = req.headers['x-team-secret'] || '';
    if (!TEAM_NOTIFY_SECRET || secret !== TEAM_NOTIFY_SECRET) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    const { message, sender } = await parseJsonBody(req);
    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'message required' }));
      return;
    }

    if (!TEAM_CHAT_ID) {
      log(`[TG-TEAM] 알림 스킵 (TEAM_CHAT_ID 미설정): ${message}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, skipped: true }));
      return;
    }

    const formatted = sender ? `[${sender}] ${message}` : message;
    await sendTelegramMessage(TEAM_CHAT_ID, formatted, TELEGRAM_TEAM_API);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[TG-TEAM] 알림 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
