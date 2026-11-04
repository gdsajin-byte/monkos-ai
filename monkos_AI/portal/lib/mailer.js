/**
 * MONKOS Portal — 메일 발신 모듈 (Resend API)
 * 담당: 막내2 (PF_INFRA, ORDER_20260813 메일발신인프라)
 *
 * 발신 주소·표시명·API 키는 전부 shared/config.js 정본 참조 (ch2 7조).
 * 이 파일과 호출부에 주소·표시명 문자열 하드코딩 금지.
 *
 * 실패 가시화 원칙 (도구 3요건):
 *   - 발송 실패는 반드시 MailError를 throw 한다. 무음 통과(catch {}) 금지.
 *   - Resend가 반환한 상태코드·에러 본문을 그대로 노출한다.
 *     무료 티어 한도(월 3,000통 / 일 100통) 초과도 여기서 드러난다.
 *   - 호출부는 "보냈다고 믿는데 안 간" 상태를 만들지 말 것.
 *     특히 탈퇴 완료 통지처럼 법적 고지 성격의 메일은 실패를 사용자에게 알려야 한다.
 */

import {
  log,
  RESEND_API_KEY,
  RESEND_API_URL,
  MAIL_FROM,
  MAIL_REPLY_TO,
} from './shared/config.js';

/** 발송 실패 — 호출부가 원인을 구분할 수 있도록 상태·본문을 보존한다. */
export class MailError extends Error {
  constructor(message, { status = 0, body = null, cause = null } = {}) {
    super(message);
    this.name = 'MailError';
    this.status = status;      // Resend HTTP 상태코드 (네트워크 실패 시 0)
    this.body = body;          // Resend 에러 본문 원문
    this.cause = cause;
    // 재시도 가치: 레이트리밋(429)·서버오류(5xx)·네트워크 실패(status 0 + cause).
    // 인자 누락·키 미설정 같은 설정 오류는 재시도해도 동일하게 실패한다.
    this.retryable = status === 429 || status >= 500 || (status === 0 && cause !== null);
  }
}

/** 메일 발송 설정이 갖춰졌는지 — 호출부가 사전 분기할 때 사용 */
export function isMailerConfigured() {
  return Boolean(RESEND_API_KEY);
}

/**
 * 메일 1통 발송.
 *
 * @param {object}   opts
 * @param {string|string[]} opts.to       수신 주소
 * @param {string}   opts.subject         제목
 * @param {string}   [opts.text]          평문 본문 (text·html 중 최소 1개 필수)
 * @param {string}   [opts.html]          HTML 본문
 * @param {string|string[]} [opts.cc]
 * @param {string|string[]} [opts.bcc]
 * @param {string}   [opts.replyTo]       미지정 시 config 정본
 * @returns {Promise<string>} Resend 메시지 id
 * @throws {MailError} 설정 누락·API 거부·네트워크 실패 전부 throw
 */
/** 로그용 주소 마스킹 — a***@d***.com (redactLog 옵션) */
const maskAddr = (e) => { const [u, d = ''] = String(e).split('@'); const [h, ...r] = d.split('.'); return `${(u || '?')[0]}***@${(h || '?')[0]}***.${r.join('.') || '?'}`; };

export async function sendMail({ to, subject, text, html, cc, bcc, replyTo, redactLog = false } = {}) {
  if (!RESEND_API_KEY) {
    throw new MailError('RESEND_API_KEY 미설정 — 메일 발송 불가 (Secret Manager 등록 필요)');
  }
  const recipients = [].concat(to || []).filter(Boolean);
  if (recipients.length === 0) throw new MailError('수신 주소(to) 누락');
  // redactLog: 개인정보 로그 금지 호출부(이메일 로그인 등)용 — 기본 동작(원 주소 기록)은 그대로
  const logTo = redactLog ? recipients.map(maskAddr) : recipients;
  if (!subject) throw new MailError('제목(subject) 누락');
  if (!text && !html) throw new MailError('본문 누락 — text 또는 html 중 하나는 필수');

  const payload = {
    from: MAIL_FROM,
    to: recipients,
    subject,
    reply_to: replyTo || MAIL_REPLY_TO,
  };
  if (text) payload.text = text;
  if (html) payload.html = html;
  if (cc) payload.cc = [].concat(cc).filter(Boolean);
  if (bcc) payload.bcc = [].concat(bcc).filter(Boolean);

  let res;
  try {
    res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // 네트워크 단절 — 여기서 삼키면 미발송이 성공으로 둔갑한다
    log(`[Mailer] 발송 실패(네트워크): ${err.message}`, 'ERROR', { to: logTo, subject });
    throw new MailError(`메일 발송 실패(네트워크): ${err.message}`, { cause: err });
  }

  const raw = await res.text();
  let parsed = null;
  try { parsed = raw ? JSON.parse(raw) : null; } catch { /* 원문 raw 보존 */ }

  if (!res.ok) {
    // Resend 에러 본문을 가공하지 않고 그대로 노출 (한도 초과·도메인 미검증 등)
    const detail = parsed?.message || parsed?.error || raw || `HTTP ${res.status}`;
    log(`[Mailer] 발송 거부 HTTP ${res.status}: ${detail}`, 'ERROR', { to: logTo, subject });
    throw new MailError(`메일 발송 거부 (HTTP ${res.status}): ${detail}`, {
      status: res.status,
      body: parsed ?? raw,
    });
  }

  const id = parsed?.id;
  if (!id) {
    // 200인데 id가 없다 = 발송 보장 없음. 성공으로 처리하지 않는다.
    log(`[Mailer] 응답에 메시지 id 없음: ${raw}`, 'ERROR', { to: logTo, subject });
    throw new MailError('메일 발송 응답에 메시지 id 없음 — 발송 미보장', {
      status: res.status,
      body: parsed ?? raw,
    });
  }

  log(`[Mailer] 발송 성공 id=${id}`, 'INFO', { to: logTo, subject });
  return id;
}
