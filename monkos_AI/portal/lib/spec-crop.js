/**
 * 스펙스 규격 안착 크롭 — 파라미터 파서 + crop-engine 호출 (2026-07-06, DESIGN_20260705 옵션 B)
 *
 * 파이프라인: AI 배경제거(순백 3:4) → crop-engine /api/crop-spec (FaceMesh + 머리끝 실측 안착)
 * 실패 시 폴백: sharp 상단 커버 크롭 (프레임 비율만 보장 — 옵션 C 등가).
 *
 * 규격 출처: specs-data.json (428슬러그) — pixels(px)·size(cm/mm/inch)·headHeight(cm) 파싱.
 * 파싱 불가 필드는 보수 기본값(얼굴 72%·상단 여백 7.8%)으로 폴백.
 */
import sharp from 'sharp';
import { createRequire } from 'module';
import { log, sendTelegramMessage, TELEGRAM_TEAM_API, TEAM_CHAT_ID } from './shared/config.js';
import { HEAD_PLACEMENT_EYE_ANCHOR } from './hair-measure.js';

const SPECS_DATA = createRequire(import.meta.url)('./cms/specs-data.json');

const CROP_ENGINE_URL = process.env.CROP_ENGINE_URL || '';
const CROP_TIMEOUT_MS = 45000; // 콜드스타트(모델 로드) 흡수 — 예열 핑과 병행

/** "413 × 531px" → [413, 531] */
function parsePixels(str) {
  const m = String(str || '').match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*px/i);
  return m ? [Math.round(parseFloat(m[1])), Math.round(parseFloat(m[2]))] : null;
}

/** "3.5 × 4.5cm" | "35 × 45mm" | "2 × 2 inch (51 × 51mm)" → [Wmm, Hmm] */
function parseSizeMm(str) {
  const s = String(str || '');
  const paren = s.match(/\(([\d.]+)\s*[×x]\s*([\d.]+)\s*mm\)/i); // inch 병기 괄호 우선
  if (paren) return [parseFloat(paren[1]), parseFloat(paren[2])];
  const m = s.match(/([\d.]+)\s*[×x]\s*([\d.]+)\s*(cm|mm)/i);
  if (!m) return null;
  const k = m[3].toLowerCase() === 'cm' ? 10 : 1;
  return [parseFloat(m[1]) * k, parseFloat(m[2]) * k];
}

/** "3.2~3.6cm" | "3.4cm" | "1~1⅜ inches (25~35mm)" → [minMm, maxMm] (단일값은 ±5%) */
function parseHeadHeightRangeMm(str) {
  const s = String(str || '');
  const rangeCm = s.match(/([\d.]+)\s*[~\-]\s*([\d.]+)\s*cm/i);
  if (rangeCm) return [parseFloat(rangeCm[1]) * 10, parseFloat(rangeCm[2]) * 10];
  const rangeMm = s.match(/([\d.]+)\s*[~\-]\s*([\d.]+)\s*mm/i);
  if (rangeMm) return [parseFloat(rangeMm[1]), parseFloat(rangeMm[2])];
  const singleCm = s.match(/([\d.]+)\s*cm/i);
  if (singleCm) { const v = parseFloat(singleCm[1]) * 10; return [v * 0.95, v * 1.05]; }
  const singleMm = s.match(/([\d.]+)\s*mm/i);
  if (singleMm) { const v = parseFloat(singleMm[1]); return [v * 0.95, v * 1.05]; }
  return null;
}

/**
 * slug → crop-engine spec 파라미터. 산출 불가(규격 데이터 자체 부재)면 null.
 */
export function getSpecCropParams(slug) {
  const data = SPECS_DATA[slug];
  if (!data) return null;

  let frame = parsePixels(data.pixels);
  const sizeMm = parseSizeMm(data.size);
  if (!frame && sizeMm) {
    const dpi = Number(data.dpi) || 300;
    frame = [Math.round(sizeMm[0] / 25.4 * dpi), Math.round(sizeMm[1] / 25.4 * dpi)];
  }
  if (!frame) return null;

  const frameHmm = sizeMm ? sizeMm[1] : (frame[1] / (Number(data.dpi) || 300)) * 25.4;
  // 수치 정본 우선 (ORDER_20260707 Task 2: countries.jsonl 155 + 텍스트 267 + 기본값 6 병합분)
  const range = (Number.isFinite(data.headHeightMin) && Number.isFinite(data.headHeightMax) && data.headHeightMin < data.headHeightMax)
    ? [data.headHeightMin, data.headHeightMax]
    : parseHeadHeightRangeMm(data.headHeight);
  // 타겟 = IDPASS 정본 결정식 그대로 (SpecData.swift:196-218, 2026-07-07 완전분석 §2-2):
  // 명시값(countries.jsonl faceTarget) → clamp(h≥60?fMax−1 : h≥40?fMin+1 : h×0.70, fMin+1, fMax−1)
  // 하한 편향(fMin+1)은 실무 최적해 — 심사관별 정수리 정의 편차에 의한 반려 방어 (작가님 12년 실무)
  let faceMinMm = range ? range[0] : null;
  let faceTargetMm = null;
  if (Number.isFinite(data.faceTargetExplicitMm)) {
    faceTargetMm = data.faceTargetExplicitMm;
    if (range && (faceTargetMm < range[0] || faceTargetMm > range[1])) {
      range[0] = Math.min(range[0], faceTargetMm);
      range[1] = Math.max(range[1], faceTargetMm);
      faceMinMm = range[0];
    }
  } else if (range) {
    const [fMin, fMax] = range;
    const base = frameHmm >= 60 ? fMax - 1 : frameHmm >= 40 ? fMin + 1 : frameHmm * 0.70;
    faceTargetMm = +Math.min(Math.max(base, fMin + 1), fMax - 1).toFixed(1);
  }
  // 파싱 불가 or 비상식 값 → 보수 기본값 (프레임 높이의 72% — 크롭앱 여권 기본 비율)
  if (!faceTargetMm || faceTargetMm >= frameHmm * 0.9 || faceTargetMm < frameHmm * 0.3) {
    faceTargetMm = +(frameHmm * 0.72).toFixed(1);
    faceMinMm = +(frameHmm * 0.66).toFixed(1);
  }

  return { frameW: frame[0], frameH: frame[1], frameHmm, faceTargetMm, faceMinMm, hairMarginMm: 2,
    headHeightMinMm: range ? range[0] : null, headHeightMaxMm: range ? range[1] : null };
}

/**
 * 크롭 엔진 예열 (fire-and-forget) — AI 생성(10~20초)과 병렬로 콜드스타트 흡수.
 * min-instances 0 운용에서 첫 요청의 모델 로드 지연을 생성 시간 뒤로 숨긴다.
 */
export function warmupCropEngine() {
  if (!CROP_ENGINE_URL) return;
  fetch(`${CROP_ENGINE_URL}/health`, { signal: AbortSignal.timeout(50000) }).catch(() => {});
}

/**
 * crop-spec 요청 spec — kr·jp 여권만 eyeAnchor를 합성한다 (ORDER_20261104 유료크롭_눈45정합).
 * getSpecCropParams 반환값은 불변(fit-spec·무료 가이드 원 프레임이 같은 spec을 쓴다). 값의 정본은 HEAD_PLACEMENT_EYE_ANCHOR.
 * 의도된 동승: matteSpecPipeline 무료 폴백도 cropToSpec을 타므로 45%가 함께 적용된다(무료·유료 정합 취지).
 */
export function cropSpecRequest(spec, slug) {
  const eyeAnchor = HEAD_PLACEMENT_EYE_ANCHOR[slug];
  return Number.isFinite(eyeAnchor) ? { ...spec, eyeAnchor } : spec;
}

/**
 * 생성 결과(순백 배경 base64)를 slug 규격으로 안착 크롭.
 * @returns {{ image: string|null, cropped: boolean, engine: 'insight'|'none', error?: string, meta?: object }}
 */
export async function cropToSpec(imageB64, slug) {
  const spec = getSpecCropParams(slug);
  if (!spec) return { image: imageB64, cropped: false, engine: 'none' };

  if (CROP_ENGINE_URL) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), CROP_TIMEOUT_MS);
        const res = await fetch(`${CROP_ENGINE_URL}/api/crop-spec`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageB64, spec: cropSpecRequest(spec, slug) }),
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        const data = await res.json();
        if (res.ok && data.success && data.cropped) {
          if (!data.fallback) {
            log(`[SpecCrop] ${slug}: 안착 face=${data.meta?.faceMM}mm crown=${data.meta?.crownMarginMM}mm eye=${data.meta?.eyePositionPercent}% 앵커=${data.meta?.eyeAnchorTarget ?? '-'}(${data.meta?.eyeAnchorSource ?? '구엔진'})`);
            return { image: data.cropped, cropped: true, engine: 'insight', meta: data.meta };
          }
          if (attempt === 1) { log(`[SpecCrop] ${slug}: 감지 실패 → 재시도 1회`, 'WARNING'); continue; }
        }
        log(`[SpecCrop] ${slug}: 엔진 응답 이상 (${data.error || res.status})`, 'WARNING');
      } catch (err) {
        log(`[SpecCrop] ${slug}: 엔진 호출 실패 (${err.message})`, 'WARNING');
      }
    }
    log(`[SpecCrop] ${slug}: 감지 실패 — 명시 에러 반환`, 'ERROR');
    if (TEAM_CHAT_ID) {
      sendTelegramMessage(TEAM_CHAT_ID, `🚨 *스펙스 얼굴 감지 실패*\nslug: ${slug}\n2회 재시도 후 미검출 → 에러 반환`, TELEGRAM_TEAM_API).catch(() => {});
    }
  }

  return { image: null, cropped: false, engine: 'none', error: 'FACE_NOT_DETECTED' };
}
