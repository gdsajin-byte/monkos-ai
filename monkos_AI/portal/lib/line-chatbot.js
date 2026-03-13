/**
 * LINE Messaging API 웹훅 핸들러
 * kakao-chatbot.js 패턴 미러링
 */

import { createHmac } from 'crypto';
import { log, parseRawBody, LINE_MESSAGING_CHANNEL_SECRET, LINE_MESSAGING_ACCESS_TOKEN, LINE_MESSAGING_API } from './shared/config.js';
import { chatWithMonkos } from './chat-engine.js';

// === LINE 웹훅 서명 검증 ===
function verifySignature(rawBody, signature) {
  const expected = createHmac('SHA256', LINE_MESSAGING_CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64');
  return signature === expected;
}

// === LINE Reply API 호출 ===
async function replyMessage(replyToken, text) {
  // LINE 텍스트 제한: 2,000자
  const trimmed = text.length > 2000 ? text.substring(0, 1997) + '...' : text;
  try {
    await fetch(LINE_MESSAGING_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text: trimmed }],
      }),
    });
  } catch (err) {
    log(`[LineChat] Reply API 에러: ${err.message}`, 'ERROR');
  }
}

// === LINE 웹훅 핸들러 ===
export async function handleLineWebhook(req, res) {
  try {
    const rawBody = await parseRawBody(req);
    const signature = req.headers['x-line-signature'];

    // 서명 검증
    if (!signature || !verifySignature(rawBody, signature)) {
      log('[LineChat] 서명 검증 실패', 'WARNING');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid signature' }));
      return;
    }

    const body = JSON.parse(rawBody);
    const events = body.events || [];

    // LINE은 200 아니면 재전송하므로 먼저 200 응답
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));

    // 이벤트 비동기 처리
    for (const event of events) {
      try {
        // follow 이벤트 (친구 추가)
        if (event.type === 'follow') {
          await replyMessage(event.replyToken, 'MONKOSへようこそ！🎉\nAI証明写真のことなら何でもお聞きください。\nhttps://idphoto-jp.monkos.ai');
          continue;
        }

        // 텍스트 메시지 처리
        if (event.type === 'message' && event.message.type === 'text') {
          const sid = `line_${event.source.userId}`;
          const text = event.message.text;
          log(`[LineChat][${sid}] ${text.substring(0, 100)}`);

          const reply = await chatWithMonkos('line', sid, text);
          log(`[LineChat][${sid}] → ${reply.substring(0, 100)}`);

          await replyMessage(event.replyToken, reply);
        }
      } catch (err) {
        log(`[LineChat] 이벤트 처리 에러: ${err.message}`, 'ERROR');
      }
    }
  } catch (err) {
    log(`[LineChat] 웹훅 에러: ${err.message}`, 'ERROR');
    // 아직 응답 안 보냈으면 200 반환 (재전송 방지)
    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    }
  }
}
