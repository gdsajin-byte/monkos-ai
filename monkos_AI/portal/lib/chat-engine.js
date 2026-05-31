/**
 * 통합 챗봇 엔진 — CF Workers (Gemma 4 + D1) 호출 전환
 * 기존 Vertex AI → Workers HTTPS fetch
 */

import { firestore, log } from './shared/config.js';

const CHAT_WORKERS_URL = process.env.CHAT_WORKERS_URL || '';
const CHAT_API_KEY = process.env.CHAT_API_KEY || '';

const csCollection = firestore.collection('cs_conversations');
const TTL_90_DAYS = 90 * 24 * 60 * 60 * 1000;

// === Firestore CS 대화 로깅 (텔레그램 전용, 90일 TTL) ===
export async function logCsConversation(chatId, username, userMessage, botReply) {
  try {
    const docId = `tg_${chatId}`;
    const docRef = csCollection.doc(docId);
    const doc = await docRef.get();
    const entry = { role: 'user', text: userMessage, ts: new Date().toISOString() };
    const replyEntry = { role: 'assistant', text: botReply, ts: new Date().toISOString() };
    const expireAt = new Date(Date.now() + TTL_90_DAYS);

    if (doc.exists) {
      const data = doc.data();
      const messages = data.messages || [];
      messages.push(entry, replyEntry);
      await docRef.update({ messages, updatedAt: new Date().toISOString(), expireAt });
    } else {
      await docRef.set({
        chatId,
        username: username || '',
        channel: 'telegram',
        messages: [entry, replyEntry],
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expireAt,
      });
    }
  } catch (err) {
    log(`[CS Log] 저장 실패: ${err.message}`);
  }
}

// === 통합 챗봇 API — Workers 호출 ===
export async function chatWithMonkos(channel, chatId, userMessage, options = {}) {
  if (!CHAT_WORKERS_URL) {
    throw new Error('CHAT_WORKERS_URL 환경변수가 설정되지 않았습니다');
  }

  const body = {
    channel,
    sessionId: chatId,
    message: userMessage,
  };

  if (options.image) body.image = options.image;
  if (channel === 'coaching') {
    const coachingKeys = ['style', 'purpose', 'gender', 'age', 'clothing', 'clothingColor', 'tie', 'hair', 'expression'];
    body.options = {};
    for (const key of coachingKeys) {
      if (options[key]) body.options[key] = options[key];
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (CHAT_API_KEY) headers['X-Chat-API-Key'] = CHAT_API_KEY;

    const res = await fetch(CHAT_WORKERS_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Workers ${res.status}: ${errBody}`);
    }

    const data = await res.json();
    return data.response || data.reply || '';
  } finally {
    clearTimeout(timeout);
  }
}
