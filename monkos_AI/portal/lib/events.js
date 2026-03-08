/** 담당: 막내2 (리파인) */

import { usersCollection, firestore, log, logTransaction, parseJsonBody, randomBytes, TELEGRAM_EVENT_API, TELEGRAM_CHANNEL_ID, TELEGRAM_EVENT_BOT_TOKEN, KAKAO_CHANNEL_ID } from './shared/config.js';

/**
 * POST /api/telegram/gate-code — 텔레그램 게이트 코드 생성 (v2)
 */
export async function handleTelegramGateCode(req, res) {
  try {
    const { userId } = await parseJsonBody(req);
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId 필수' }));
      return;
    }

    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '사용자 없음' }));
      return;
    }

    // 이미 telegram_join 또는 kakao_channel_add 이벤트를 받았는지 체크 (택1)
    const userEvents = userDoc.data()?.events || {};
    if (userEvents.telegram_join || userEvents.kakao_channel_add) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '이미 채널 보너스를 수령했습니다 (텔레그램/카카오 택1)', alreadyClaimed: true }));
      return;
    }

    const code = randomBytes(6).toString('hex').toUpperCase();
    await firestore.collection('telegramGateCodes').doc(code).set({
      userId,
      type: 'gate',
      createdAt: new Date().toISOString(),
      used: false,
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const deeplink = `https://t.me/monkos_support_bot?start=GATE_${code}`;
    log(`[TG-Gate] 코드 생성: ${userId} → ${code}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ deeplink, code }));
  } catch (err) {
    log(`[TG-Gate] 생성 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/telegram/mission-code — 텔레그램 미션 코드 생성 (v2)
 */
export async function handleTelegramMissionCode(req, res) {
  try {
    const { userId } = await parseJsonBody(req);
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId 필수' }));
      return;
    }

    const code = randomBytes(6).toString('hex').toUpperCase();
    await firestore.collection('telegramGateCodes').doc(code).set({
      userId,
      type: 'mission',
      createdAt: new Date().toISOString(),
      used: false,
      expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const deeplink = `https://t.me/monkos_support_bot?start=MISSION_${code}`;
    log(`[TG-Mission] 코드 생성: ${userId} → ${code}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ deeplink, code }));
  } catch (err) {
    log(`[TG-Mission] 생성 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/consent/sns — SNS 활용 동의서 저장 (v2)
 */
export async function handleConsentSns(req, res) {
  try {
    const { userId, agreed, timestamp } = await parseJsonBody(req);
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId 필수' }));
      return;
    }
    if (!agreed) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'agreed 필드가 true여야 합니다' }));
      return;
    }

    const userRef = usersCollection.doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '사용자 없음' }));
      return;
    }

    await userRef.update({
      snsConsentSigned: true,
      snsConsentAt: timestamp || new Date().toISOString(),
      snsConsentVersion: 'v2',
      snsConsentPlatforms: ['instagram', 'telegram_channel', 'x', 'youtube'],
      snsConsentDuration: '동의 철회 시까지',
      snsConsentWithdrawMethod: '고객센터 문의 (텔레그램 @monkos_support_bot)',
      snsConsentImageType: 'watermark_preview',
    });

    log(`[Consent] SNS 동의: ${userId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[Consent] 에러: ${err.message}`);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/credits/mission-complete — 100c 미션 완료 (v2)
 */
export async function handleMissionComplete(req, res) {
  try {
    const { userId } = await parseJsonBody(req);
    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId 필수' }));
      return;
    }

    const userRef = usersCollection.doc(userId);

    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');

      const data = userDoc.data();

      // 중복 방지
      if (data.missionBonusClaimed) {
        return { success: false, error: '이미 미션 보너스를 수령했습니다', credits: data.credits ?? 0 };
      }

      // 조건 확인
      const missing = [];
      if (!data.snsConsentSigned) missing.push('consent');
      if (!data.missionImageReceived) missing.push('image');
      if (missing.length > 0) {
        return { success: false, error: '미션 조건 미충족', missing, credits: data.credits ?? 0 };
      }

      const currentCredits = data.credits ?? 0;
      const newCredits = currentCredits + 100;
      tx.update(userRef, {
        credits: newCredits,
        missionBonusClaimed: true,
        missionBonusAt: new Date().toISOString(),
      });
      return { success: true, credits: newCredits, credited: 100 };
    });

    if (!result.success) {
      const status = result.missing ? 400 : 409;
      log(`[Mission] 미완료: ${userId} (${result.error})`);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    log(`[Mission] 100c 지급: ${userId} → ${result.credits}c`);
    logTransaction({ userId, amount: 100, type: 'event', provider: 'mission', balanceAfter: result.credits, description: '100c 미션 완료' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Mission] 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/credits/event — 이벤트 크레딧 지급
 * signup_bonus: +10c, telegram_join: +40c, kakao_channel_add: +40c, mission_complete: +100c
 */
export async function handleCreditsEvent(req, res) {
  try {
    const { userId, eventType, eventData } = await parseJsonBody(req);
    if (!userId || !eventType) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId, eventType 필수' }));
      return;
    }

    const EVENT_CREDITS = {
      signup_bonus: 10,
      telegram_join: 40,
      kakao_channel_add: 40,
      mission_complete: 100,
      sns_share: 100,
      passport_rejection: 100,
    };

    const granted = EVENT_CREDITS[eventType];
    if (!granted) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'eventType은 signup_bonus, telegram_join, kakao_channel_add, mission_complete, sns_share, passport_rejection 중 하나' }));
      return;
    }

    // 택1 검증: kakao_channel_add와 telegram_join은 둘 다 수령 불가
    if (eventType === 'kakao_channel_add' || eventType === 'telegram_join') {
      const preCheckDoc = await usersCollection.doc(userId).get();
      if (preCheckDoc.exists) {
        const preEvents = preCheckDoc.data()?.events || {};
        if (preEvents.kakao_channel_add || preEvents.telegram_join) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '카카오 채널 / 텔레그램 채널 보너스는 택1입니다. 이미 수령했습니다.', alreadyClaimed: true }));
          return;
        }
      }
    }

    // kakao_channel_add: 카카오 채널 친구추가 relation 검증
    if (eventType === 'kakao_channel_add') {
      if (!KAKAO_CHANNEL_ID) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '카카오 채널 설정 미완료 (KAKAO_CHANNEL_ID)' }));
        return;
      }

      const kakaoUserDoc = await usersCollection.doc(userId).get();
      if (!kakaoUserDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 없음' }));
        return;
      }
      const kakaoAccessToken = kakaoUserDoc.data()?.kakaoAccessToken;
      if (!kakaoAccessToken) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '카카오 로그인이 필요합니다. 먼저 카카오로 로그인해주세요.' }));
        return;
      }

      try {
        const channelRes = await fetch('https://kapi.kakao.com/v2/api/talk/channels', {
          headers: { Authorization: `Bearer ${kakaoAccessToken}` },
        });
        const channelData = await channelRes.json();

        if (channelData.code && channelData.code < 0) {
          log(`[Event] 카카오 채널 API 에러: ${JSON.stringify(channelData)}`, 'ERROR');
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '카카오 토큰이 만료되었습니다. 다시 로그인해주세요.', kakaoError: channelData.msg }));
          return;
        }

        const channels = channelData.channels || [];
        const monkosChannel = channels.find(ch => String(ch.channel_public_id) === KAKAO_CHANNEL_ID || String(ch.channel_id) === KAKAO_CHANNEL_ID);

        if (!monkosChannel || monkosChannel.relation !== 'ADDED') {
          log(`[Event] 카카오 채널 미추가: ${userId} relation=${monkosChannel?.relation || 'NOT_FOUND'}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'MONKOS 카카오 채널을 친구추가 해주세요.', relation: monkosChannel?.relation || 'NOT_FOUND' }));
          return;
        }
        log(`[Event] 카카오 채널 추가 확인: ${userId} relation=${monkosChannel.relation}`);
      } catch (chErr) {
        log(`[Event] 카카오 채널 검증 에러: ${chErr.message}`, 'ERROR');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '카카오 채널 확인 중 오류' }));
        return;
      }
    }

    // telegram_join: getChatMember로 채널 가입 검증
    if (eventType === 'telegram_join') {
      if (!TELEGRAM_CHANNEL_ID || !TELEGRAM_EVENT_BOT_TOKEN) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '텔레그램 채널 설정 미완료' }));
        return;
      }

      // userId → telegramId 조회 (봇이 GATE_ 딥링크로 매핑 저장)
      const userDoc = await usersCollection.doc(userId).get();
      if (!userDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 없음' }));
        return;
      }
      const telegramId = userDoc.data()?.telegramId;
      if (!telegramId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '텔레그램 연동이 필요합니다. 먼저 봇 딥링크를 통해 연동해주세요.' }));
        return;
      }

      // getChatMember 호출
      try {
        const cmRes = await fetch(`${TELEGRAM_EVENT_API}/getChatMember?chat_id=${encodeURIComponent(TELEGRAM_CHANNEL_ID)}&user_id=${telegramId}`);
        const cmData = await cmRes.json();
        const status = cmData.result?.status;
        if (!['member', 'administrator', 'creator'].includes(status)) {
          log(`[Event] 채널 미가입: ${userId} telegramId=${telegramId} status=${status}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '채널에 가입되지 않았습니다. 채널 가입 후 다시 시도해주세요.', status }));
          return;
        }
        log(`[Event] 채널 가입 확인: ${userId} telegramId=${telegramId} status=${status}`);
      } catch (cmErr) {
        log(`[Event] getChatMember 에러: ${cmErr.message}`, 'ERROR');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '텔레그램 채널 가입 확인 중 오류' }));
        return;
      }
    }

    const userRef = usersCollection.doc(userId);

    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');

      const data = userDoc.data();
      const events = data.events || {};

      // 중복 체크
      if (events[eventType]) {
        return { success: false, error: '이미 지급된 이벤트', credits: data.credits ?? 0, alreadyClaimed: true };
      }

      // 택1 체크 (트랜잭션 내 race condition 방지)
      if (eventType === 'kakao_channel_add' && events.telegram_join) {
        return { success: false, error: '텔레그램 채널 보너스를 이미 수령했습니다 (택1)', credits: data.credits ?? 0, alreadyClaimed: true };
      }
      if (eventType === 'telegram_join' && events.kakao_channel_add) {
        return { success: false, error: '카카오 채널 보너스를 이미 수령했습니다 (택1)', credits: data.credits ?? 0, alreadyClaimed: true };
      }

      const currentCredits = data.credits ?? 0;
      const newCredits = currentCredits + granted;
      tx.update(userRef, {
        credits: newCredits,
        [`events.${eventType}`]: new Date().toISOString(),
      });
      return { success: true, credits: newCredits, granted, eventType };
    });

    if (!result.success) {
      log(`[Event] 중복 지급 시도: ${userId} ${eventType} (${result.error})`);
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    log(`[Event] 크레딧 지급: ${userId} +${granted}c (${eventType}) → ${result.credits}c`);
    logTransaction({ userId, amount: granted, type: 'event', provider: 'system', balanceAfter: result.credits, description: `${eventType} (+${granted}c)` });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    log(`[Event] 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
