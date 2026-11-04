/**
 * POST /api/headshot/generate — 헤드샷 생성 라우트 (결제 게이트)
 *
 * 게이트 (idphoto/generate 패턴 준용 — 2026-07-05 T1 직접결제 이식):
 *   ① paymentToken (비로그인 단건 직접결제) → consumeGenerateQuota
 *   ② 로그인 세션 크레딧 (기존 경로 무변경 — /api/credits/use 10c)
 *   ③ 둘 다 없으면 402 PAYMENT_REQUIRED
 * 실패 시 소모분 반환: 토큰 → refundGenerateQuota / 크레딧 → /api/credits/refund
 */

import { PORT, log, parseJsonBody, parseCookies, verifyAuthToken } from './shared/config.js';
import { consumeGenerateQuota, refundGenerateQuota } from './payments.js';
import { generateHeadshot } from './headshot-generate.js';
import { saveImages } from './gcs-save.js';
import { generationOrigin } from './gen-origin.js';
import { getAdminUser } from './cms/admin-auth.js';
import { resolveCreditSource } from './credit-source.js';
import { trackEvent } from './tracking.js';

const STYLE_MODIFIERS = {
  corporate: 'Composed, authoritative expression. Clean solid-color backdrop (dark navy or charcoal gray). Dramatic studio lighting with subtle rim light. Executive boardroom atmosphere. Neatly styled hair as if freshly blow-dried — same hairstyle but tidier. Polished, refined makeup if present in original — do not add makeup not in original. Full formal attire mood.',
  linkedin_pro: 'Confident, approachable expression with a natural smile. Modern office environment with soft bokeh background (blurred bookshelves, window light, office plants). Natural window-style lighting. Lightly groomed hair — maintain original style but neater. Clean, natural-looking makeup if present. Smart professional attire mood — blazer with shirt, no tie necessary.',
  professional: 'Warm, approachable expression with a gentle confident smile. Bright neutral studio background (light gray or off-white). Even, diffused lighting. Naturally tidy hair — original style maintained with subtle polish. Neat, understated makeup if present. Light business-casual styling — clean shirt with a soft unstructured blazer, not heavy or overly formal. The outfit should look natural and coherent, not layered over existing clothing.',
  creative: 'Relaxed, genuine smile showing personality. Warm-toned environment or textured backdrop (exposed brick, artistic studio, warm wood). Natural window-style lighting with soft shadows. Hair kept exactly as original — embrace the natural look. Minimal makeup, natural skin. Smart-casual creative industry vibe — individuality over formality.',
  dating: 'Natural, confident expression with a charming relaxed smile. Stylish urban lifestyle setting — trendy café interior with warm ambient lighting, modern boutique storefront, or chic city street with soft bokeh. Hair styled with effortless intention — looks natural but clearly groomed. Fresh, dewy makeup if present. Fashionable smart-casual outfit — current trend-aware styling, well-coordinated colors, the kind of outfit you would carefully choose for a first date in Gangnam or Hongdae. Sophisticated but not overdressed.',
};
const BASE_PROMPT = 'Waist-up portrait, crop above the navel. Do NOT show full body, legs, or desk/furniture below waist. Keep the subject\'s hairstyle exactly as-is, only tidy and groom. The subject must be clearly recognizable as the SAME person in the input photo. Enhance existing makeup to match the style level if makeup is present in the original photo. Do NOT add makeup that is not present in the original.';

export async function handleHeadshotGenerate(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { image, purpose, model, paymentToken } = body;
    if (!image) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미지 필수' }));
    }

    // 결제 게이트: ① 결제 토큰(비로그인 단건) ② 로그인 크레딧 — 둘 다 없으면 402
    let gateMode = null;
    let gateUserId = 'headshot-visitor';
    let remainingGenerates = null;
    let creditData = null;
    if (paymentToken) {
      const gate = await consumeGenerateQuota(paymentToken);
      if (!gate.ok) {
        res.writeHead(gate.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: gate.error, code: gate.code }));
      }
      gateMode = 'token';
      remainingGenerates = gate.remainingGenerates;
    } else {
      const cookies = parseCookies(req.headers.cookie);
      const session = cookies.monkos_session ? verifyAuthToken(cookies.monkos_session) : null;
      if (!session?.userId) {
        res.writeHead(402, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '결제가 필요합니다', code: 'PAYMENT_REQUIRED' }));
      }
      // 로그인 크레딧 차감 (generate 10c — 기존 경로 무변경)
      const creditRes = await fetch(`http://localhost:${PORT}/api/credits/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
        body: JSON.stringify({ userId: session.userId, type: 'generate' }),
      });
      creditData = await creditRes.json();
      if (!creditRes.ok) {
        res.writeHead(creditRes.status, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(creditData));
      }
      gateMode = 'credits';
      gateUserId = session.userId;
    }

    const styleMod = STYLE_MODIFIERS[purpose] || STYLE_MODIFIERS.linkedin_pro;
    const customPrompt = BASE_PROMPT + ' ' + styleMod;

    let generatedBase64;
    try {
      generatedBase64 = await generateHeadshot({
        image, purpose: purpose || 'linkedin_pro', model: model || 'nano-banana-pro', customPrompt, userId: gateUserId,
      });
    } catch (genErr) {
      // 생성 실패 → 소모분 반환 (토큰 쿼터 / 크레딧)
      if (gateMode === 'token') {
        refundGenerateQuota(paymentToken).catch(() => {});
      } else {
        fetch(`http://localhost:${PORT}/api/credits/refund`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.cookie },
          body: JSON.stringify({ userId: gateUserId, type: 'generate' }),
        }).catch(() => {});
      }
      log(`[Headshot] 생성 실패 → 소모분 반환(${gateMode}): ${genErr.message}`, 'WARNING');
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: genErr.message || '생성 실패', code: 'GENERATE_FAILED' }));
    }

    try {
      const creditSource = gateMode === 'credits' ? await resolveCreditSource(gateUserId) : null;
      await saveImages('headshot', gateUserId, purpose || 'linkedin_pro', image, generatedBase64, { gate: gateMode, creditSource, sessionId: req.sessionId, origin: generationOrigin(req, { getAdmin: getAdminUser }) });
      log(`[Headshot] GCS 저장 완료: ${gateUserId}`);
    } catch (e) {
      log(`[Headshot] GCS 저장 실패 (무시): ${e.message}`, 'WARNING');
    }

    log(`[Headshot] 생성 완료: ${gateUserId}, 스타일: ${purpose}, 게이트: ${gateMode}`);
    trackEvent({
      eventName: 'api_generate', userId: gateMode === 'credits' ? gateUserId : null, sessionId: req.sessionId,
      service: 'headshot', params: { style: purpose, model: model, gate: gateMode },
    }).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const out = { image: generatedBase64 };
    if (gateMode === 'credits' && creditData) out.credits = creditData.credits;
    if (gateMode === 'token') out.remainingGenerates = remainingGenerates;
    return res.end(JSON.stringify(out));
  } catch (err) {
    log(`[Headshot] 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: '서버 오류' }));
  }
}
