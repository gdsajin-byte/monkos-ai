/**
 * 통합 챗봇 엔진 — chatWithMonkos() + CHANNEL_CONFIG + 히스토리
 * 담당: 막내3 (리파인)
 */

import { ai, firestore, log } from './shared/config.js';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_KR, CS_SYSTEM_PROMPT, PREP_SYSTEM_PROMPT, COACHING_INSTRUCTIONS } from './prompts.js';
import { loadCsKnowledge, searchCsKnowledge } from './rag.js';

// === 인메모리 히스토리 ===
const csHistories = new Map();
const CS_HISTORY_TTL = 60 * 60 * 1000;
function cleanupCsHistories() {
  const now = Date.now();
  for (const [key, val] of csHistories) {
    if (now - val.lastAccess > CS_HISTORY_TTL) csHistories.delete(key);
  }
}
setInterval(cleanupCsHistories, 10 * 60 * 1000);

const chatHistories = new Map();
const HISTORY_TTL = 30 * 60 * 1000;
function cleanupHistories() {
  const now = Date.now();
  for (const [key, val] of chatHistories) {
    if (now - val.lastAccess > HISTORY_TTL) chatHistories.delete(key);
  }
}
setInterval(cleanupHistories, 5 * 60 * 1000);

// === Firestore 대화 로깅 컬렉션 ===
const chatLogsCollection = firestore.collection('chat_conversations');
const csCollection = firestore.collection('cs_conversations');

// === Firestore 히스토리 복원 ===
async function loadChatHistory(sessionId) {
  try {
    const docRef = chatLogsCollection.doc(sessionId);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      const messages = (data.messages || []).slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.text }],
      }));
      return { messages, lastAccess: Date.now() };
    }
  } catch (err) {
    log(`[Chat Log] 복원 실패: ${err.message}`);
  }
  return null;
}

// === Firestore 포털 챗봇 대화 저장 ===
async function logChatConversation(sessionId, userMessage, botReply) {
  try {
    const docRef = chatLogsCollection.doc(sessionId);
    const doc = await docRef.get();
    const entry = { role: 'user', text: userMessage, ts: new Date().toISOString() };
    const replyEntry = { role: 'assistant', text: botReply, ts: new Date().toISOString() };

    if (doc.exists) {
      const data = doc.data();
      const messages = data.messages || [];
      messages.push(entry, replyEntry);
      const trimmed = messages.slice(-40);
      await docRef.update({ messages: trimmed, updatedAt: new Date().toISOString() });
    } else {
      await docRef.set({
        sessionId,
        channel: 'web',
        messages: [entry, replyEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    log(`[Chat Log] 저장 실패: ${err.message}`);
  }
}

// === Firestore CS 대화 로깅 ===
export async function logCsConversation(chatId, username, userMessage, botReply) {
  try {
    const docId = `tg_${chatId}`;
    const docRef = csCollection.doc(docId);
    const doc = await docRef.get();
    const entry = { role: 'user', text: userMessage, ts: new Date().toISOString() };
    const replyEntry = { role: 'assistant', text: botReply, ts: new Date().toISOString() };

    if (doc.exists) {
      const data = doc.data();
      const messages = data.messages || [];
      messages.push(entry, replyEntry);
      await docRef.update({ messages, updatedAt: new Date().toISOString() });
    } else {
      await docRef.set({
        chatId,
        username: username || '',
        channel: 'telegram',
        messages: [entry, replyEntry],
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    log(`[CS Log] 저장 실패: ${err.message}`);
  }
}

// === 채널 설정 ===
const CHANNEL_CONFIG = {
  web: {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxOutputTokens: 300,
    historyMap: chatHistories,
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'chat_conversations',
  },
  telegram: {
    systemPrompt: CS_SYSTEM_PROMPT,
    temperature: 0.5,
    maxOutputTokens: 500,
    historyMap: csHistories,
    historyTTL: 60 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'cs_conversations',
  },
  prep: {
    systemPrompt: PREP_SYSTEM_PROMPT,
    temperature: 0.6,
    maxOutputTokens: 400,
    historyMap: new Map(),
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'prep_conversations',
  },
  coaching: {
    systemPrompt: COACHING_INSTRUCTIONS.id_photo,
    temperature: 0.3,
    maxOutputTokens: 50,
    stateless: true,
    historyMap: null,
    logCollection: null,
  },
  qc: {
    systemPrompt: '',
    temperature: 0.2,
    maxOutputTokens: 300,
    stateless: true,
    historyMap: null,
    logCollection: 'qc_results',
    responseMimeType: 'application/json',
  },
  kakao: {
    systemPrompt: SYSTEM_PROMPT + '\n\n[중요] 이 채널은 카카오톡입니다. 반드시 한국어로만 응답하세요.',
    temperature: 0.7,
    maxOutputTokens: 300,
    historyMap: chatHistories,
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'kakao_conversations',
  },
  'idphoto-kr': {
    systemPrompt: SYSTEM_PROMPT_KR,
    temperature: 0.7,
    maxOutputTokens: 300,
    historyMap: chatHistories,
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'idphoto_kr_conversations',
  },
};

// === 통합 챗봇 API ===
export async function chatWithMonkos(channel, chatId, userMessage, options = {}) {
  const config = CHANNEL_CONFIG[channel];
  if (!config) throw new Error(`Unknown channel: ${channel}`);

  const basePrompt = options.systemPromptOverride || config.systemPrompt;

  // --- stateless (coaching/qc) ---
  if (config.stateless) {
    const parts = [];
    if (options.image) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image } });
    if (options.image2) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image2 } });
    parts.push({ text: userMessage });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: basePrompt,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
        ...(config.responseMimeType && { responseMimeType: config.responseMimeType }),
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // --- stateful (web/telegram/prep/kakao) ---
  let history = config.historyMap.get(chatId);
  if (!history) {
    if (channel === 'web') {
      history = await loadChatHistory(chatId);
    }
    if (!history) {
      history = { messages: [], lastAccess: Date.now() };
    }
    config.historyMap.set(chatId, history);
  }
  history.lastAccess = Date.now();

  // RAG
  await loadCsKnowledge();
  const ragDocs = searchCsKnowledge(userMessage);
  let ragContext = '';
  if (ragDocs.length > 0) {
    ragContext = '\n\n[참고 지식]\n' + ragDocs.map(d =>
      `【${d.title}】\n${d.content}`
    ).join('\n\n');
  }

  history.messages.push({ role: 'user', parts: [{ text: userMessage }] });
  if (history.messages.length > config.maxHistory) {
    history.messages = history.messages.slice(-config.maxHistory);
  }

  const systemPrompt = basePrompt + ragContext;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: history.messages,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  history.messages.push({ role: 'model', parts: [{ text }] });

  // 비동기 로깅
  if (channel === 'web') {
    logChatConversation(chatId, userMessage, text).catch(() => {});
  }

  return text;
}
