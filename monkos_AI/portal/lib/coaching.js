/** 담당: 막내3 (리파인) */

import { log, parseJsonBody } from './shared/config.js';
import { chatWithMonkos } from './chat-engine.js';
import { buildCoachingPrompt, buildQCInstruction, READY_KEYWORDS } from './prompts.js';

// === 챗봇 API ===
export async function handleWebChat(req, res) {
  try {
    const { message, sessionId, lang } = await parseJsonBody(req);
    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'message 필드 필수' }));
      return;
    }
    const sid = sessionId || `anon_${Date.now()}`;
    log(`[Chat][${sid}] ${message.substring(0, 100)}`);

    const reply = await chatWithMonkos('web', sid, message);
    log(`[Chat][${sid}] → ${reply.substring(0, 100)}`);

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

// === AI QC API (photolab MPA → monkos.ai) ===
export async function handleQC(req, res) {
  try {
    const { original, generated, gender = 'male', age = 'adult', style } = await parseJsonBody(req);
    if (!original || !generated) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'original, generated 필수' }));
      return;
    }

    // data: prefix 제거
    const origBase64 = original.includes(',') ? original.split(',')[1] : original;
    const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;

    const qcPrompt = buildQCInstruction(gender, age);

    const text = await chatWithMonkos('qc', 'qc', 'QC 판정해주세요.', {
      image: origBase64,
      image2: genBase64,
      systemPromptOverride: qcPrompt,
    });

    try {
      const result = JSON.parse(text);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ identity: 'ERROR', raw: text }));
    }
  } catch (err) {
    log(`[QC] 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
