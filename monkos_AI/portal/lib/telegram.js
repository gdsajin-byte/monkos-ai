/** 담당: 막내3 (리파인) */

import { firestore, usersCollection, log, parseJsonBody, sendTelegramMessage, TELEGRAM_CS_API, TELEGRAM_EVENT_API, TELEGRAM_CHANNEL_ID } from './shared/config.js';
import { chatWithMonkos, logCsConversation } from './chat-engine.js';

// === Telegram CS Bot 웹훅 (@monkos_support_bot) — 고객 상담 전용 ===
export async function handleTelegramCSWebhook(req, res) {
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

    // === /start: CS 안내 ===
    if (msg.text && msg.text.startsWith('/start')) {
      const parts = msg.text.split(' ');
      const param = parts[1] || '';

      // [DEPRECATED] bonus_ 딥링크 — v2에서 제거 (2026-02-26)
      if (param.startsWith('bonus_')) {
        await sendTelegramMessage(chatId, '이 보너스는 종료되었습니다.\nMONKOS 앱에서 새로운 이벤트를 확인해주세요! 💜', TELEGRAM_CS_API);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // 일반 /start — 기존 환영 메시지
      const welcome = `MONKOS AI 고객지원에 오신 것을 환영합니다 🙌\n궁금한 점이 있으시면 편하게 메시지를 보내주세요.\n\n---\nMONKOS AI サポートへようこそ 🙌\nご質問がございましたらお気軽にメッセージをどうぞ。\n\n---\nWelcome to MONKOS AI Support 🙌\nFeel free to send us a message with any questions.`;
      await sendTelegramMessage(chatId, welcome, TELEGRAM_CS_API);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 일반 텍스트: Gemini CS 응답 ===
    if (msg.text) {
      const text = msg.text.trim();
      log(`[TG-CS] ${username}(${chatId}): ${text.substring(0, 100)}`);

      const reply = await chatWithMonkos('telegram', chatId, text);
      await sendTelegramMessage(chatId, reply || 'すみません、少々お待ちください。', TELEGRAM_CS_API);
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

// === Telegram Event Bot 웹훅 (@monkos_event_bot) — 공유 보너스 전용 ===
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

    // === /start 딥링크 (v2: GATE_ / MISSION_ / 일반) ===
    if (msg.text && msg.text.startsWith('/start')) {
      const parts = msg.text.trim().split(' ');
      const param = parts[1] || '';
      const telegramId = msg.from?.id;

      // --- GATE_{code}: 게이트 Phase2 — userId ↔ telegramId 매핑 + 채널 가입 유도 ---
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

            // userId ↔ telegramId 매핑 저장
            await usersCollection.doc(userId).update({
              telegramId: String(telegramId),
              telegramChatId: String(chatId),
              telegramUsername: username,
              telegramLinkedAt: new Date().toISOString(),
            });

            // telegram_links에도 저장 (역방향 조회용)
            await firestore.collection('telegram_links').doc(String(chatId)).set({
              chatId,
              userId,
              telegramId: String(telegramId),
              username,
              linkedAt: new Date().toISOString(),
              type: 'gate',
            }, { merge: true });

            // 코드 사용 처리
            await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId), telegramId: String(telegramId) });

            log(`[TG-Gate] 매핑 완료: ${userId} ↔ ${telegramId} (${username})`);

            // 채널 가입 유도 메시지
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

      // --- MISSION_{code}: 100c 미션 — 이미지 수신 대기 모드 진입 ---
      if (param.startsWith('MISSION_')) {
        const code = param.replace('MISSION_', '');
        try {
          const codeRef = firestore.collection('telegramGateCodes').doc(code);
          const codeDoc = await codeRef.get();

          if (!codeDoc.exists || codeDoc.data().type !== 'mission') {
            await sendTelegramMessage(chatId, '유효하지 않은 미션 코드입니다.', TELEGRAM_EVENT_API);
          } else {
            const userId = codeDoc.data().userId;

            // 미션 수신 대기 모드 설정
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
            await sendTelegramMessage(chatId, '증명사진 결과물을 보내주세요! 📸\n\n캡쳐본이나 다운받은 사진을 이 채팅에 보내주시면 됩니다.\n\n---\n証明写真の結果を送ってください！ 📸', TELEGRAM_EVENT_API);
          }
        } catch (err) {
          log(`[TG-Mission] 에러: ${err.message}`);
          await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다.', TELEGRAM_EVENT_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // --- 일반 /start (파라미터 없음 또는 레거시) ---
      const welcome = `🎁 *MONKOS 이벤트 봇*에 오신 것을 환영합니다!\n\nMONKOS 앱에서 이벤트에 참여하고 보너스를 받아보세요 💜\n고객 문의는 @monkos\\_support\\_bot 으로 부탁드려요!\n\n---\n🎁 *MONKOS イベントBot* へようこそ！\n\nイベントに参加してボーナスをゲット 💜\nお問い合わせは @monkos\\_support\\_bot へどうぞ！`;
      await sendTelegramMessage(chatId, welcome, TELEGRAM_EVENT_API);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 이미지 메시지: 미션 이미지 수신 처리 (v2) ===
    if (msg.photo && msg.photo.length > 0) {
      log(`[TG-Event] 이미지 수신: ${username}(${chatId})`);

      const linkDoc = await firestore.collection('telegram_links').doc(String(chatId)).get();
      if (!linkDoc.exists || !linkDoc.data().userId) {
        await sendTelegramMessage(chatId, '📱 먼저 MONKOS 앱에서 텔레그램 연결을 해주세요!\nまず MONKOS アプリからテレグラム連携をしてください！', TELEGRAM_EVENT_API);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      const linkData = linkDoc.data();
      const linkedUserId = linkData.userId;

      // 동의서 서명 여부 확인 (v3: 미서명 시 이미지 수신 거부)
      const userDoc = await usersCollection.doc(linkedUserId).get();
      if (!userDoc.exists || !userDoc.data()?.snsConsentSigned) {
        await sendTelegramMessage(chatId, '⚠️ SNS 활용 동의서를 먼저 서명해주세요.\nMONKOS 웹에서 동의서 서명 후 다시 사진을 보내주세요.\n\n---\n⚠️ まずSNS活用同意書にご署名ください。\nMONKOSウェブで同意書に署名してから、もう一度写真を送ってください。', TELEGRAM_EVENT_API);
        log(`[TG-Mission] 동의서 미서명 → 이미지 거부: ${linkedUserId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // 미션 이미지 수신 처리 — 이미지 파일 ID 저장 + 플래그 설정
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      await usersCollection.doc(linkedUserId).update({
        missionImageReceived: true,
        missionImageFileId: fileId,
        missionImageAt: new Date().toISOString(),
        missionImageType: 'user_upload',
      });

      // telegram_links 업데이트
      await firestore.collection('telegram_links').doc(String(chatId)).update({
        missionPending: false,
        missionImageReceived: true,
        missionImageAt: new Date().toISOString(),
      });

      log(`[TG-Mission] 이미지 수신 완료: ${linkedUserId} (fileId: ${fileId})`);
      await sendTelegramMessage(chatId, '사진을 받았습니다! 감사합니다 💜\n\nMONKOS 웹으로 돌아가서 "미션 완료 확인" 버튼을 눌러주세요.\n\n---\n写真を受け取りました！ ありがとう 💜\n\nMONKOS ウェブに戻って「ミッション完了確認」ボタンを押してください。', TELEGRAM_EVENT_API);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    // === 이벤트 봇에서 일반 텍스트 → 안내 ===
    if (msg.text) {
      await sendTelegramMessage(chatId, `이 봇은 MONKOS 이벤트 전용입니다 🎁\n\n고객 문의는 @monkos\\_support\\_bot 으로 부탁드려요!\n\n---\nこのBotはイベント専用です 🎁\n\nお問い合わせは @monkos\\_support\\_bot へどうぞ！`, TELEGRAM_EVENT_API);
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[TG-Event] 웹훅 에러: ${err.message}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  }
}
