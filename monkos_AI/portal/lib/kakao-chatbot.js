/** 담당: 막내3 (리파인) */

import { log, parseJsonBody } from './shared/config.js';
import { chatWithMonkos } from './chat-engine.js';

// === 카카오 챗봇 스킬 서버 ===
export async function handleKakaoChatbot(req, res) {
  try {
    const kakaoReq = await parseJsonBody(req);
    const utterance = kakaoReq?.userRequest?.utterance;
    const userId = kakaoReq?.userRequest?.user?.id || 'kakao_anon';

    if (!utterance) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        version: '2.0',
        template: { outputs: [{ simpleText: { text: '질문을 입력해주세요.' } }] }
      }));
      return;
    }

    const sid = `kakao_${userId}`;
    log(`[KakaoChat][${sid}] ${utterance.substring(0, 100)}`);

    const reply = await chatWithMonkos('kakao', sid, utterance);
    log(`[KakaoChat][${sid}] → ${reply.substring(0, 100)}`);

    // 카카오 응답 텍스트 1000자 제한
    const trimmedReply = reply.length > 1000 ? reply.substring(0, 997) + '...' : reply;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: '2.0',
      template: {
        outputs: [{ simpleText: { text: trimmedReply } }]
      }
    }));
  } catch (err) {
    log(`[KakaoChat] 에러: ${err.message}`, 'ERROR');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      version: '2.0',
      template: { outputs: [{ simpleText: { text: '죄송합니다. 잠시 후 다시 시도해주세요.' } }] }
    }));
  }
}
