/**
 * tg-cs.js — Telegram Mini App 전용 API 핸들러
 * POST /api/tg/passport-issue — 여권 반려 신고
 * POST /api/tg/upload-mission — Mini App 이미지 업로드
 */

import { firestore, usersCollection, log, parseJsonBody, logTransaction, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID, TEAM_NOTIFY_SECRET } from './shared/config.js';
import { verifyInitData } from './tg-auth.js';

// 반려 사유 코드
const REJECTION_REASONS = {
  bg_invalid: { ko: '배경 부적합', ja: '背景が不適切', en: 'Invalid Background' },
  face_blocked: { ko: '얼굴 가림', ja: '顔が隠れている', en: 'Face Blocked' },
  spec_mismatch: { ko: '규격 불일치', ja: '規格不一致', en: 'Spec Mismatch' },
  low_quality: { ko: '화질 불량', ja: '画質不良', en: 'Low Quality' },
  shadow: { ko: '그림자', ja: '影がある', en: 'Shadow' },
  other: { ko: '기타', ja: 'その他', en: 'Other' },
};

const PASSPORT_COMPENSATION = 100;

/**
 * POST /api/tg/passport-issue — 여권 반려 신고
 */
export async function handlePassportIssue(req, res) {
  try {
    const { initData, reasons, description } = await parseJsonBody(req);
    if (!initData) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'initData 필수' }));
      return;
    }

    // initData 검증
    const auth = verifyInitData(initData);
    if (!auth.valid) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const telegramId = String(auth.user?.id || '');
    const telegramUsername = auth.user?.username || auth.user?.first_name || '';

    // telegram_links에서 userId 조회
    const linksSnap = await firestore.collection('telegram_links')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get();

    if (linksSnap.empty) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'MONKOS 계정 연동이 필요합니다' }));
      return;
    }

    const userId = linksSnap.docs[0].data().userId;

    // 사유 검증
    const validReasons = (reasons || []).filter(r => REJECTION_REASONS[r]);
    if (validReasons.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '반려 사유를 1개 이상 선택해주세요' }));
      return;
    }

    // cs_tickets 생성
    const ticketRef = await firestore.collection('cs_tickets').add({
      userId,
      telegramId,
      telegramUsername,
      type: 'passport_issue',
      reasons: validReasons,
      description: description || '',
      evidenceUrl: null,
      status: 'open',
      compensated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 100c 자동 보상
    const userRef = usersCollection.doc(userId);
    let newCredits = 0;

    const result = await firestore.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      if (!userDoc.exists) throw new Error('사용자 없음');

      const data = userDoc.data();
      const currentCredits = data.credits ?? 0;
      newCredits = currentCredits + PASSPORT_COMPENSATION;

      tx.update(userRef, { credits: newCredits });
      return { credits: newCredits };
    });

    // 티켓 보상 완료 표시
    await ticketRef.update({ compensated: true, updatedAt: new Date().toISOString() });

    // 거래 원장 기록
    logTransaction({
      userId,
      amount: PASSPORT_COMPENSATION,
      type: 'event',
      provider: 'passport_rejection',
      balanceAfter: result.credits,
      description: `여권 반려 보상 (+${PASSPORT_COMPENSATION}c)`,
      referenceId: ticketRef.id,
    });

    // 팀봇 알림
    const reasonLabels = validReasons.map(r => REJECTION_REASONS[r]?.ko || r).join(', ');
    const teamMsg = `🔴 여권 반려 신고\n사용자: ${userId}\nTG: @${telegramUsername}\n사유: ${reasonLabels}\n설명: ${description || '(없음)'}\n보상: +${PASSPORT_COMPENSATION}c\n티켓: ${ticketRef.id}`;

    if (TEAM_CHAT_ID) {
      await sendTelegramMessage(TEAM_CHAT_ID, teamMsg, TELEGRAM_TEAM_API);
    }

    log(`[TG-CS] 여권 반려 접수: ${userId} (${reasonLabels}) → +${PASSPORT_COMPENSATION}c`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      ticketId: ticketRef.id,
      compensated: PASSPORT_COMPENSATION,
      credits: result.credits,
    }));
  } catch (err) {
    log(`[TG-CS] passport-issue 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * POST /api/tg/upload-mission — Mini App 이미지 업로드
 */
export async function handleUploadMission(req, res) {
  try {
    const { initData, image } = await parseJsonBody(req);
    if (!initData) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'initData 필수' }));
      return;
    }
    if (!image) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'image 필수' }));
      return;
    }

    // initData 검증
    const auth = verifyInitData(initData);
    if (!auth.valid) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: auth.error }));
      return;
    }

    const telegramId = String(auth.user?.id || '');

    // telegram_links에서 userId 조회
    const linksSnap = await firestore.collection('telegram_links')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get();

    if (linksSnap.empty) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'MONKOS 계정 연동이 필요합니다' }));
      return;
    }

    const linkData = linksSnap.docs[0].data();
    const userId = linkData.userId;

    // 동의서 확인
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.snsConsentSigned) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'SNS 활용 동의서 서명이 필요합니다' }));
      return;
    }

    // missionImageReceived 플래그 설정 (봇 이미지 수신과 동일 결과)
    await usersCollection.doc(userId).update({
      missionImageReceived: true,
      missionImageAt: new Date().toISOString(),
      missionImageType: 'mini_app_upload',
    });

    // telegram_links 업데이트
    await firestore.collection('telegram_links').doc(linksSnap.docs[0].id).update({
      missionPending: false,
      missionImageReceived: true,
      missionImageAt: new Date().toISOString(),
    });

    log(`[TG-CS] Mini App 이미지 업로드: ${userId}`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    log(`[TG-CS] upload-mission 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
