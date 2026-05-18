/** 담당: 막내3 (리파인) */

import { log, parseJsonBody } from './shared/config.js';
import { chatWithMonkos } from './chat-engine.js';
import { buildCoachingPrompt, READY_KEYWORDS, SYSTEM_PROMPT_KR, SYSTEM_PROMPT_JP, SYSTEM_PROMPT } from './prompts.js';

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
    const ch = channel || 'web';
    log(`[Chat][${ch}][${sid}] ${message.substring(0, 100)}`);

    // lang 분기: ko → KR 프롬프트, ja → JP, 그 외 → 다국어 자동
    const promptByLang = lang === 'ko' ? SYSTEM_PROMPT_KR
                       : lang === 'ja' ? SYSTEM_PROMPT_JP
                       : undefined; // chat-engine 기본(SYSTEM_PROMPT_KR) 사용
    const reply = await chatWithMonkos(ch, sid, message, promptByLang ? { systemPromptOverride: promptByLang } : {});
    log(`[Chat][${ch}][${sid}] → ${reply.substring(0, 100)}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ reply, sessionId: sid }));
  } catch (err) {
    log(`[Chat] 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

// === AI 코칭 API (photolab MPA → monkos.ai) ===
export async function handleCoaching(req, res) {
  try {
    const { image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = await parseJsonBody(req);
    if (!image) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'image 필수' }));
      return;
    }

    const fields = { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression };
    const prompt = buildCoachingPrompt(fields);

    const text = await chatWithMonkos('coaching', 'coaching', '이 사진의 자세, 조명, 표정을 체크해주세요.', {
      image,
      systemPromptOverride: prompt,
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
