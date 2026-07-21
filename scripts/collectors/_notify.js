/**
 * 텔레그램 경고 발신 — 수집기 실패/빈 응답 시 호출
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function notify(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('[_notify] TELEGRAM 환경변수 미설정 — 경고 발신 생략');
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const raw = await resp.text();
      if (resp.status === 400) {
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, parse_mode: undefined }),
        });
      } else {
        console.error(`[_notify] 텔레그램 발신 실패: ${resp.status} ${raw}`);
      }
    }
  } catch (err) {
    console.error(`[_notify] 텔레그램 발신 예외: ${err.message}`);
  }
}

module.exports = { notify };
