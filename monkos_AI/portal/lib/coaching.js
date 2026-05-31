/** 챗봇 + 코칭 API — Workers 호출 전환 */

import { log, parseJsonBody } from './shared/config.js';
import { chatWithMonkos } from './chat-engine.js';

const READY_KEYWORDS = ['좋아요', '완벽', '촬영하세요', 'OK', '좋습니다', '잘 맞', '훌륭', '지금'];

// === 챗봇 API ===
export async function handleWebChat(req, res) {
  try {
    const { message, sessionId, lang, channel } = await parseJsonBody(req);
    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'message 필드 필수' }));
      return;
    }
    const sid = sessionId || `anon_${Date.now()}`;
    const ch = channel || (lang === 'ja' ? 'idphoto-jp' : 'web');
    log(`[Chat][${ch}][${sid}] ${message.substring(0, 100)}`);

    const reply = await chatWithMonkos(ch, sid, message);
    log(`[Chat][${ch}][${sid}] → ${reply.substring(0, 100)}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ reply, sessionId: sid }));
  } catch (err) {
    log(`[Chat] 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === AI 코칭 API (photolab MPA → monkos.ai → Workers) ===
export async function handleCoaching(req, res) {
  try {
    const { image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = await parseJsonBody(req);
    if (!image) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'image 필수' }));
      return;
    }

    const text = await chatWithMonkos('coaching', 'coaching', '이 사진의 자세, 조명, 표정을 체크해주세요.', {
      image,
      style, purpose, gender, age, clothing, clothingColor, tie, hair, expression,
    });

    const ready = READY_KEYWORDS.some(kw => text.includes(kw));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text, ready }));
  } catch (err) {
    log(`[Coaching] 에러: ${err.message}`, 'ERROR');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: '', ready: false }));
  }
}
