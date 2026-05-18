/** 담당: 막내2 (Phase 6 통합) */

import { firestore, usersCollection, log, parseJsonBody, sendTelegramMessage, sendTelegramInlineKeyboard, answerCallbackQuery, TELEGRAM_CS_API, TELEGRAM_EVENT_API, TELEGRAM_CHANNEL_ID } from './shared/config.js';
import { chatWithMonkos, logCsConversation } from './chat-engine.js';
import { CS_SYSTEM_PROMPT } from './prompts.js';

// === 다국어 감지 ===
function detectLanguage(msg) {
  const lc = msg.from?.language_code || '';
  if (lc.startsWith('ko')) return 'ko';
  if (lc.startsWith('ja')) return 'ja';
  return 'en';
}

// === 다국어 메시지 ===
const TG_I18N = {
  ko: {
    welcome: '안녕하세요! MONKOS AI입니다 💜\n아래 메뉴에서 원하는 서비스를 선택해주세요.',
    snsMission: '📸 SNS 자랑',
    channelJoin: '🎫 채널가입',
    passportIssue: '🔄 반려 신고',
    csChat: '💬 일반문의',
    csChatReply: '궁금한 점을 자유롭게 메시지로 보내주세요!',
    invalidCode: '유효하지 않은 코드입니다.',
    usedCode: '이미 처리된 코드입니다.',
    gateSuccess: 'MONKOS 채널에 가입해주세요! 💜\n\n채널 가입 후 웹으로 돌아가서 "가입 확인" 버튼을 눌러주세요.',
    gateError: '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    invalidMissionCode: '유효하지 않은 미션 코드입니다.',
    missionReady: '증명사진 결과물을 보내주세요! 📸\n\n캡쳐본이나 다운받은 사진을 이 채팅에 보내주시면 됩니다.',
    missionError: '처리 중 오류가 발생했습니다.',
    linkFirst: '📱 먼저 MONKOS 앱에서 텔레그램 연결을 해주세요!',
    consentRequired: '⚠️ SNS 활용 동의서를 먼저 서명해주세요.\nMONKOS 웹에서 동의서 서명 후 다시 사진을 보내주세요.',
    imageReceived: '사진을 받았습니다! 감사합니다 💜\n\nMONKOS 웹으로 돌아가서 "미션 완료 확인" 버튼을 눌러주세요.',
    deprecatedBonus: '이 보너스는 종료되었습니다.\nMONKOS 앱에서 새로운 이벤트를 확인해주세요! 💜',
  },
  ja: {
    welcome: 'こんにちは！MONKOS AIです 💜\n下のメニューからサービスを選んでください。',
    snsMission: '📸 SNS投稿',
    channelJoin: '🎫 チャンネル参加',
    passportIssue: '🔄 却下報告',
    csChat: '💬 お問い合わせ',
    csChatReply: 'ご質問をお気軽にメッセージしてください！',
    invalidCode: '無効なコードです。',
    usedCode: '既に処理されたコードです。',
    gateSuccess: 'MONKOSチャンネルに参加してください！ 💜\n\n参加後、ウェブに戻って「参加確認」ボタンを押してください。',
    gateError: 'エラーが発生しました。しばらくしてからもう一度お試しください。',
    invalidMissionCode: '無効なミッションコードです。',
    missionReady: '証明写真の結果を送ってください！ 📸\n\nキャプチャやダウンロードした写真を送ってください。',
    missionError: 'エラーが発生しました。',
    linkFirst: '📱 まずMONKOSアプリからテレグラム連携をしてください！',
    consentRequired: '⚠️ まずSNS活用同意書にご署名ください。\nMONKOSウェブで同意書に署名してから、もう一度写真を送ってください。',
    imageReceived: '写真を受け取りました！ ありがとう 💜\n\nMONKOS ウェブに戻って「ミッション完了確認」ボタンを押してください。',
    deprecatedBonus: 'このボーナスは終了しました。\nMONKOSアプリで新しいイベントをご確認ください！ 💜',
  },
  en: {
    welcome: 'Hello! Welcome to MONKOS AI 💜\nPlease select a service from the menu below.',
    snsMission: '📸 SNS Mission',
    channelJoin: '🎫 Join Channel',
    passportIssue: '🔄 Photo Issue',
    csChat: '💬 Contact Us',
    csChatReply: 'Feel free to send us any questions!',
    invalidCode: 'Invalid code.',
    usedCode: 'This code has already been used.',
    gateSuccess: 'Please join the MONKOS channel! 💜\n\nAfter joining, go back to the web and click "Verify Membership".',
    gateError: 'An error occurred. Please try again later.',
    invalidMissionCode: 'Invalid mission code.',
    missionReady: 'Please send your ID photo result! 📸\n\nSend a screenshot or downloaded photo to this chat.',
    missionError: 'An error occurred.',
    linkFirst: '📱 Please link your Telegram from the MONKOS app first!',
    consentRequired: '⚠️ Please sign the SNS consent form first.\nSign on MONKOS web, then send the photo again.',
    imageReceived: 'Photo received! Thank you 💜\n\nGo back to MONKOS web and click "Verify Mission Complete".',
    deprecatedBonus: 'This bonus has ended.\nCheck the MONKOS app for new events! 💜',
  },
};

// === PORTAL_URL (Mini App 웹뷰 URL 기반) ===
const PORTAL_URL = process.env.PORTAL_URL || 'https://monkos.ai';

// === 인라인 키보드 생성 ===
function buildMainKeyboard(lang) {
  const t = TG_I18N[lang] || TG_I18N.en;
  return [
    [
      { text: t.snsMission, web_app: { url: `${PORTAL_URL}/tg/sns-mission.html?lang=${lang}` } },
      { text: t.channelJoin, web_app: { url: `${PORTAL_URL}/tg/channel-join.html?lang=${lang}` } },
    ],
    [
      { text: t.passportIssue, web_app: { url: `${PORTAL_URL}/tg/passport-issue.html?lang=${lang}` } },
      { text: t.csChat, callback_data: 'cs_chat' },
    ],
  ];
}

// === Telegram CS Bot 웹훅 (@monkos_support_bot) — 통합 ===
export async function handleTelegramCSWebhook(req, res) {
  try {
    const update = await parseJsonBody(req);

    // --- callback_query 처리 ---
    if (update.callback_query) {
      const cbq = update.callback_query;
      const cbChatId = cbq.message?.chat?.id;
      const lang = detectLanguage(cbq);
      const t = TG_I18N[lang] || TG_I18N.en;

      if (cbq.data === 'cs_chat') {
        await answerCallbackQuery(cbq.id, '', TELEGRAM_CS_API);
        if (cbChatId) {
          await sendTelegramMessage(cbChatId, t.csChatReply, TELEGRAM_CS_API);
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const msg = update.message;
    if (!msg) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const chatId = msg.chat.id;
    const username = msg.from?.username || msg.from?.first_name || '';
    const lang = detectLanguage(msg);
    const t = TG_I18N[lang] || TG_I18N.en;

    // === /start ===
    if (msg.text && msg.text.startsWith('/start')) {
      const parts = msg.text.trim().split(' ');
      const param = parts[1] || '';
      const telegramId = msg.from?.id;

      // [DEPRECATED] bonus_ 딥링크
      if (param.startsWith('bonus_')) {
        await sendTelegramMessage(chatId, t.deprecatedBonus, TELEGRAM_CS_API);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- GATE_{code}: 게이트 Phase2 — userId ↔ telegramId 매핑 ---
      if (param.startsWith('GATE_')) {
        const code = param.replace('GATE_', '');
        try {
          const codeRef = firestore.collection('telegramGateCodes').doc(code);
          const codeDoc = await codeRef.get();

          if (!codeDoc.exists || codeDoc.data().type !== 'gate') {
            await sendTelegramMessage(chatId, t.invalidCode, TELEGRAM_CS_API);
          } else if (codeDoc.data().used) {
            await sendTelegramMessage(chatId, t.usedCode, TELEGRAM_CS_API);
          } else {
            const userId = codeDoc.data().userId;

            await usersCollection.doc(userId).update({
              telegramId: String(telegramId),
              telegramChatId: String(chatId),
              telegramUsername: username,
              telegramLinkedAt: new Date().toISOString(),
            });

            await firestore.collection('telegram_links').doc(String(chatId)).set({
              chatId,
              userId,
              telegramId: String(telegramId),
              username,
              linkedAt: new Date().toISOString(),
              type: 'gate',
            }, { merge: true });

            await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId), telegramId: String(telegramId) });

            log(`[TG-Gate] 매핑 완료: ${userId} ↔ ${telegramId} (${username})`);

            const channelLink = TELEGRAM_CHANNEL_ID ? `https://t.me/${TELEGRAM_CHANNEL_ID.replace('@', '')}` : 'https://t.me/MonkosChannel';
            await sendTelegramMessage(chatId, `${t.gateSuccess}\n\n[Channel](${channelLink})`, TELEGRAM_CS_API);
          }
        } catch (err) {
          log(`[TG-Gate] 에러: ${err.message}`);
          await sendTelegramMessage(chatId, t.gateError, TELEGRAM_CS_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- MISSION_{code}: 100c 미션 ---
      if (param.startsWith('MISSION_')) {
        const code = param.replace('MISSION_', '');
        try {
          const codeRef = firestore.collection('telegramGateCodes').doc(code);
          const codeDoc = await codeRef.get();

          if (!codeDoc.exists || codeDoc.data().type !== 'mission') {
            await sendTelegramMessage(chatId, t.invalidMissionCode, TELEGRAM_CS_API);
          } else {
            const userId = codeDoc.data().userId;

            await firestore.collection('telegram_links').doc(String(chatId)).set({
              chatId,
              userId,
              telegramId: String(telegramId),
              username,
              missionPending: true,
              missionCode: code,
              linkedAt: new Date().toISOString(),
              type: 'mission',
            }, { merge: true });

            await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId) });

            log(`[TG-Mission] 미션 대기: ${userId} (chatId: ${chatId})`);
            await sendTelegramMessage(chatId, t.missionReady, TELEGRAM_CS_API);
          }
        } catch (err) {
          log(`[TG-Mission] 에러: ${err.message}`);
          await sendTelegramMessage(chatId, t.missionError, TELEGRAM_CS_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- 일반 /start → 인라인 키보드 카드 4장 ---
      await sendTelegramInlineKeyboard(chatId, t.welcome, buildMainKeyboard(lang), TELEGRAM_CS_API);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 이미지 수신: 미션 이미지 (이벤트봇에서 흡수) ===
    if (msg.photo && msg.photo.length > 0) {
      log(`[TG-CS] 이미지 수신: ${username}(${chatId})`);

      const linkDoc = await firestore.collection('telegram_links').doc(String(chatId)).get();
      if (!linkDoc.exists || !linkDoc.data().userId) {
        await sendTelegramMessage(chatId, t.linkFirst, TELEGRAM_CS_API);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      const linkData = linkDoc.data();
      const linkedUserId = linkData.userId;

      const userDoc = await usersCollection.doc(linkedUserId).get();
      if (!userDoc.exists || !userDoc.data()?.snsConsentSigned) {
        await sendTelegramMessage(chatId, t.consentRequired, TELEGRAM_CS_API);
        log(`[TG-Mission] 동의서 미서명 → 이미지 거부: ${linkedUserId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      const fileId = msg.photo[msg.photo.length - 1].file_id;
      await usersCollection.doc(linkedUserId).update({
        missionImageReceived: true,
        missionImageFileId: fileId,
        missionImageAt: new Date().toISOString(),
        missionImageType: 'user_upload',
      });

      await firestore.collection('telegram_links').doc(String(chatId)).update({
        missionPending: false,
        missionImageReceived: true,
        missionImageAt: new Date().toISOString(),
      });

      log(`[TG-Mission] 이미지 수신 완료: ${linkedUserId} (fileId: ${fileId})`);
      await sendTelegramMessage(chatId, t.imageReceived, TELEGRAM_CS_API);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 일반 텍스트: Gemini CS 응답 (language_code 힌트) ===
    if (msg.text) {
      const text = msg.text.trim();
      log(`[TG-CS] ${username}(${chatId}): ${text.substring(0, 100)}`);

      const langHint = lang === 'ko'
        ? '\n\n[사용자 언어: 한국어. 반드시 한국어로 응답하세요.]'
        : lang === 'ja'
          ? '\n\n[ユーザー言語: 日本語。必ず日本語で回答してください。]'
          : '\n\n[User language: English. Always respond in English.]';

      const reply = await chatWithMonkos('telegram', chatId, text, {
        systemPromptOverride: CS_SYSTEM_PROMPT + langHint,
      });
      await sendTelegramMessage(chatId, reply || t.csChatReply, TELEGRAM_CS_API);
      logCsConversation(chatId, username, text, reply).catch(() => {});
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[TG-CS] 웹훅 에러: ${err.message}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}

// === Telegram Event Bot 웹훅 (@monkos_event_bot) — 전환기 하위호환 유지 ===
export async function handleTelegramEventWebhook(req, res) {
  try {
    const update = await parseJsonBody(req);
    const msg = update.message;
    if (!msg) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    const chatId = msg.chat.id;
    const username = msg.from?.username || msg.from?.first_name || '';
    const lang = detectLanguage(msg);

    // === /start 딥링크 (v2: GATE_ / MISSION_ / 일반) ===
    if (msg.text && msg.text.startsWith('/start')) {
      const parts = msg.text.trim().split(' ');
      const param = parts[1] || '';
      const telegramId = msg.from?.id;

      // --- GATE_{code} ---
      if (param.startsWith('GATE_')) {
        const code = param.replace('GATE_', '');
        try {
          const codeRef = firestore.collection('telegramGateCodes').doc(code);
          const codeDoc = await codeRef.get();

          if (!codeDoc.exists || codeDoc.data().type !== 'gate') {
            await sendTelegramMessage(chatId, '유효하지 않은 코드입니다.', TELEGRAM_EVENT_API);
          } else if (codeDoc.data().used) {
            await sendTelegramMessage(chatId, '이미 처리된 코드입니다.', TELEGRAM_EVENT_API);
          } else {
            const userId = codeDoc.data().userId;

            await usersCollection.doc(userId).update({
              telegramId: String(telegramId),
              telegramChatId: String(chatId),
              telegramUsername: username,
              telegramLinkedAt: new Date().toISOString(),
            });

            await firestore.collection('telegram_links').doc(String(chatId)).set({
              chatId,
              userId,
              telegramId: String(telegramId),
              username,
              linkedAt: new Date().toISOString(),
              type: 'gate',
            }, { merge: true });

            await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId), telegramId: String(telegramId) });

            log(`[TG-Gate] 매핑 완료: ${userId} ↔ ${telegramId} (${username})`);

            const channelLink = TELEGRAM_CHANNEL_ID ? `https://t.me/${TELEGRAM_CHANNEL_ID.replace('@', '')}` : 'https://t.me/MonkosChannel';
            await sendTelegramMessage(chatId, `MONKOS 채널에 가입해주세요! 💜\n\n채널 가입 후 웹으로 돌아가서 "가입 확인" 버튼을 눌러주세요.\n\n[채널 가입하기](${channelLink})`, TELEGRAM_EVENT_API);
          }
        } catch (err) {
          log(`[TG-Gate] 에러: ${err.message}`);
          await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', TELEGRAM_EVENT_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- MISSION_{code} ---
      if (param.startsWith('MISSION_')) {
        const code = param.replace('MISSION_', '');
        try {
          const codeRef = firestore.collection('telegramGateCodes').doc(code);
          const codeDoc = await codeRef.get();

          if (!codeDoc.exists || codeDoc.data().type !== 'mission') {
            await sendTelegramMessage(chatId, '유효하지 않은 미션 코드입니다.', TELEGRAM_EVENT_API);
          } else {
            const userId = codeDoc.data().userId;

            await firestore.collection('telegram_links').doc(String(chatId)).set({
              chatId,
              userId,
              telegramId: String(telegramId),
              username,
              missionPending: true,
              missionCode: code,
              linkedAt: new Date().toISOString(),
              type: 'mission',
            }, { merge: true });

            await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId) });

            log(`[TG-Mission] 미션 대기: ${userId} (chatId: ${chatId})`);
            await sendTelegramMessage(chatId, '증명사진 결과물을 보내주세요! 📸\n\n캡쳐본이나 다운받은 사진을 이 채팅에 보내주시면 됩니다.', TELEGRAM_EVENT_API);
          }
        } catch (err) {
          log(`[TG-Mission] 에러: ${err.message}`);
          await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다.', TELEGRAM_EVENT_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- 일반 /start — CS봇 안내 추가 (deprecated) ---
      const welcome = `🎁 *MONKOS 이벤트 봇*\n\n새로운 봇 @monkos\\_support\\_bot 에서 모든 서비스를 이용할 수 있습니다.\n\n👉 @monkos\\_support\\_bot`;
      await sendTelegramMessage(chatId, welcome, TELEGRAM_EVENT_API);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 이미지 메시지: 기존 하위호환 유지 ===
    if (msg.photo && msg.photo.length > 0) {
      log(`[TG-Event] 이미지 수신: ${username}(${chatId})`);

      const linkDoc = await firestore.collection('telegram_links').doc(String(chatId)).get();
      if (!linkDoc.exists || !linkDoc.data().userId) {
        await sendTelegramMessage(chatId, '📱 먼저 MONKOS 앱에서 텔레그램 연결을 해주세요!', TELEGRAM_EVENT_API);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      const linkData = linkDoc.data();
      const linkedUserId = linkData.userId;

      const userDoc = await usersCollection.doc(linkedUserId).get();
      if (!userDoc.exists || !userDoc.data()?.snsConsentSigned) {
        await sendTelegramMessage(chatId, '⚠️ SNS 활용 동의서를 먼저 서명해주세요.\nMONKOS 웹에서 동의서 서명 후 다시 사진을 보내주세요.', TELEGRAM_EVENT_API);
        log(`[TG-Mission] 동의서 미서명 → 이미지 거부: ${linkedUserId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      const fileId = msg.photo[msg.photo.length - 1].file_id;
      await usersCollection.doc(linkedUserId).update({
        missionImageReceived: true,
        missionImageFileId: fileId,
        missionImageAt: new Date().toISOString(),
        missionImageType: 'user_upload',
      });

      await firestore.collection('telegram_links').doc(String(chatId)).update({
        missionPending: false,
        missionImageReceived: true,
        missionImageAt: new Date().toISOString(),
      });

      log(`[TG-Mission] 이미지 수신 완료: ${linkedUserId} (fileId: ${fileId})`);
      await sendTelegramMessage(chatId, '사진을 받았습니다! 감사합니다 💜\n\nMONKOS 웹으로 돌아가서 "미션 완료 확인" 버튼을 눌러주세요.', TELEGRAM_EVENT_API);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 이벤트 봇 일반 텍스트 → CS봇 안내 ===
    if (msg.text) {
      await sendTelegramMessage(chatId, `새로운 봇 @monkos\\_support\\_bot 에서 모든 서비스를 이용할 수 있습니다 💜\n\n👉 @monkos\\_support\\_bot`, TELEGRAM_EVENT_API);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[TG-Event] 웹훅 에러: ${err.message}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}
