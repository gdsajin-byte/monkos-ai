require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { VertexAI } = require("@google-cloud/vertexai");

admin.initializeApp();

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WRITER_CHAT_ID = process.env.WRITER_CHAT_ID;

// Helper: Send message to Telegram
async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
  return response.json();
}

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: "monkos",
  location: "us-central1",
});

const generativeModel = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
  systemInstruction: {
    parts: [{
      text: `You are MONKOS, an AI assistant for creative professionals.
You specialize in:
- Image generation guidance (Imagen, Stable Diffusion)
- Korean fashion and beauty industry
- Creative workflow optimization
- Technical AI/ML support

Respond in Korean (한국어) unless the user writes in English.
Keep responses concise and helpful.
Be friendly but professional.`
    }]
  }
});

// Health check endpoint
exports.health = functions.https.onRequest((req, res) => {
  res.json({
    status: "ok",
    service: "MONKOS Chat Functions",
    timestamp: new Date().toISOString()
  });
});

// Chat message trigger - log new messages
exports.onNewMessage = functions.firestore
  .document("chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const { chatId, messageId } = context.params;

    console.log(`New message in chat ${chatId}: ${messageId}`);
    console.log(`Content: ${message.content?.substring(0, 100)}...`);

    // TODO: Add Vertex AI LLaMA 4 integration here
    // TODO: Add push notification logic

    return null;
  });

// User profile creation trigger
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL } = user;

  // Create user profile in Firestore
  await admin.firestore().collection("users").doc(uid).set({
    email,
    displayName: displayName || email?.split("@")[0] || "Anonymous",
    photoURL,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Created profile for user: ${uid}`);
  return null;
});

// Chat endpoint - Generate AI response
exports.chat = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use chat."
    );
  }

  const { message, chatHistory = [] } = data;

  if (!message || typeof message !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Message is required and must be a string."
    );
  }

  try {
    // Build chat history for context (support both formats)
    const contents = chatHistory.map(msg => ({
      role: msg.role || (msg.isUser ? "user" : "model"),
      parts: msg.parts || [{ text: msg.text }]
    }));

    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Generate response
    const result = await generativeModel.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.95,
      }
    });

    const response = result.response;
    const text = response.candidates[0]?.content?.parts[0]?.text || "";

    // Log for analytics
    console.log(`Chat response generated for user ${context.auth.uid}`);

    return {
      success: true,
      response: text,
      model: "gemini-2.0-flash-001"
    };

  } catch (error) {
    console.error("Vertex AI error:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Failed to generate AI response."
    );
  }
});

// ============================================
// TELEGRAM INTEGRATION - AI Communication Hub
// ============================================

// Telegram Webhook - Receive messages from writer
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).send('OK');
  }

  try {
    const { message } = req.body;
    if (!message?.text) {
      return res.status(200).send('OK');
    }

    const text = message.text;
    const chatId = message.chat.id;
    const db = admin.firestore();

    // Parse commands: /막내, /쌍아, /용아, /철창, /전체
    const commandMatch = text.match(/^\/(막내|쌍아|용아|철창|전체)\s*(.*)/);

    // AI name mapping (한글 → 영문 ID)
    const aiNameMap = {
      '막내': 'makne',
      '쌍아': 'ssanga',
      '용아': 'yonga',
      '철창': 'cheolchang'
    };

    if (commandMatch) {
      const targetKr = commandMatch[1];
      const target = aiNameMap[targetKr] || targetKr;  // 영문 ID로 변환
      const content = commandMatch[2] || '';

      if (target === '전체') {
        // Broadcast to all AIs
        const snapshot = await db.collection('aiStatus').get();
        let statusMsg = '📊 <b>전체 AI 상태</b>\n\n';
        snapshot.forEach(doc => {
          const data = doc.data();
          const emoji = data.status === 'working' ? '🟢' : data.status === 'waiting' ? '🟡' : '⚪';
          statusMsg += `${emoji} <b>${doc.id}</b>: ${data.lastActivity || '대기 중'}\n`;
        });
        await sendTelegram(chatId, statusMsg || '📊 등록된 AI 없음');
      } else {
        // Send command to specific AI
        await db.collection('commands').doc(target).collection('queue').add({
          command: content,  // night_operator가 기대하는 필드명
          content: content,  // 호환성
          from: 'writer',
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await sendTelegram(chatId, `📤 ${targetKr}(${target})에게 전달: ${content || '(명령 없음)'}`);
      }
    } else if (text === '/상태' || text === '/status') {
      // Quick status check
      await sendTelegram(chatId, '🤖 MONKOS Factory Bot 정상 작동 중');
    } else {
      // Unknown command
      await sendTelegram(chatId,
        '📋 <b>사용 가능한 명령어</b>\n\n' +
        '/막내 [명령] - 막내에게 전달\n' +
        '/쌍아 [명령] - 쌍아에게 전달\n' +
        '/용아 [명령] - 용아에게 전달\n' +
        '/철창 [명령] - 철창에게 전달\n' +
        '/전체 - 전체 상태 확인\n' +
        '/상태 - 봇 상태 확인'
      );
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return res.status(200).send('OK');
  }
});

// AI → Writer notification (callable from AI sessions)
exports.notifyWriter = functions.https.onRequest(async (req, res) => {
  // Allow CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { aiName, type, content, secret } = req.body;

    // Simple auth check (optional - can add API key later)
    if (!aiName || !content) {
      return res.status(400).json({ error: 'aiName and content required' });
    }

    const emoji = {
      'complete': '🔔',
      'error': '🚨',
      'question': '❓',
      'critical': '🔥',
      'waiting': '⏳'
    }[type] || '📢';

    const message = `${emoji} <b>${aiName}</b>\n상태: ${type || 'info'}\n내용: ${content}`;

    await sendTelegram(WRITER_CHAT_ID, message);

    // Log to Firestore
    await admin.firestore().collection('notifications').add({
      aiName,
      type,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Notify error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Get pending commands for AI (polling endpoint)
exports.getCommands = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { aiName } = req.query;
    if (!aiName) {
      return res.status(400).json({ error: 'aiName required' });
    }

    const db = admin.firestore();
    const snapshot = await db
      .collection('commands')
      .doc(aiName)
      .collection('queue')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'asc')
      .limit(10)
      .get();

    const commands = [];
    snapshot.forEach(doc => {
      commands.push({ id: doc.id, ...doc.data() });
    });

    return res.json({ commands });
  } catch (error) {
    console.error('Get commands error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Mark command as completed
exports.completeCommand = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { aiName, commandId, response } = req.body;
    if (!aiName || !commandId) {
      return res.status(400).json({ error: 'aiName and commandId required' });
    }

    await admin.firestore()
      .collection('commands')
      .doc(aiName)
      .collection('queue')
      .doc(commandId)
      .update({
        status: 'completed',
        response: response || '',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return res.json({ success: true });
  } catch (error) {
    console.error('Complete command error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Update AI status (heartbeat)
exports.updateAiStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  try {
    const { aiName, status, lastActivity } = req.body;
    if (!aiName) {
      return res.status(400).json({ error: 'aiName required' });
    }

    await admin.firestore().collection('aiStatus').doc(aiName).set({
      status: status || 'active',
      lastActivity: lastActivity || '',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({ success: true });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ error: error.message });
  }
});
