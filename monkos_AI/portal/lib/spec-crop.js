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
import { log } from './shared/config.js';

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

/** "3.2~3.6cm" | "3.4cm" | "1~1⅜ inches (25~35mm)" → 타겟 mm (범위면 중간값) */
function parseHeadHeightMm(str) {
  const s = String(str || '');
  const rangeCm = s.match(/([\d.]+)\s*[~\-]\s*([\d.]+)\s*cm/i);
  if (rangeCm) return ((parseFloat(rangeCm[1]) + parseFloat(rangeCm[2])) / 2) * 10;
  const rangeMm = s.match(/([\d.]+)\s*[~\-]\s*([\d.]+)\s*mm/i);
  if (rangeMm) return (parseFloat(rangeMm[1]) + parseFloat(rangeMm[2])) / 2;
  const singleCm = s.match(/([\d.]+)\s*cm/i);
  if (singleCm) return parseFloat(singleCm[1]) * 10;
  const singleMm = s.match(/([\d.]+)\s*mm/i);
  if (singleMm) return parseFloat(singleMm[1]);
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
  let faceTargetMm = parseHeadHeightMm(data.headHeight);
  // 파싱 불가 or 비상식 값 → 보수 기본값 (프레임 높이의 72%)
  if (!faceTargetMm || faceTargetMm >= frameHmm * 0.9 || faceTargetMm < frameHmm * 0.3) {
    faceTargetMm = +(frameHmm * 0.72).toFixed(1);
  }
  const topMarginMm = +(frameHmm * 0.078).toFixed(1); // 관행: 45mm 프레임 기준 ~3.5mm

  return { frameW: frame[0], frameH: frame[1], frameHmm, faceTargetMm, topMarginMm };
}

/**
 * 크롭 엔진 예열 (fire-and-forget) — AI 생성(10~20초)과 병렬로 콜드스타트 흡수.
 * min-instances 0 운용에서 첫 요청의 모델 로드 지연을 생성 시간 뒤로 숨긴다.
 */
export function warmupCropEngine() {
  if (!CROP_ENGINE_URL) return;
  fetch(`${CROP_ENGINE_URL}/health`, { signal: AbortSignal.timeout(50000) }).catch(() => {});
}

/** 폴백: 프레임 비율 상단 커버 크롭 (얼굴 감지 없이 비율만 보장) */
async function fallbackCoverCrop(imageB64, spec) {
  const buf = await sharp(Buffer.from(imageB64, 'base64'))
    .resize(spec.frameW, spec.frameH, { fit: 'cover', position: 'top' })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
  return buf.toString('base64');
}

/**
 * 생성 결과(순백 배경 base64)를 slug 규격으로 안착 크롭.
 * @returns {{ image: string, cropped: boolean, engine: 'facemesh'|'cover'|'none', meta?: object }}
 */
export async function cropToSpec(imageB64, slug) {
  const spec = getSpecCropParams(slug);
  if (!spec) return { image: imageB64, cropped: false, engine: 'none' };

  if (CROP_ENGINE_URL) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), CROP_TIMEOUT_MS);
      const res = await fetch(`${CROP_ENGINE_URL}/api/crop-spec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageB64, spec }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (res.ok && data.success && data.cropped) {
        log(`[SpecCrop] ${slug}: ${data.fallback ? '엔진 폴백(커버)' : `안착 face=${data.meta?.faceMM}mm top=${data.meta?.topMarginMM}mm`}`);
        return { image: data.cropped, cropped: true, engine: data.fallback ? 'cover' : 'facemesh', meta: data.meta };
      }
      log(`[SpecCrop] ${slug}: 엔진 응답 이상 (${data.error || res.status}) → 로컬 커버 폴백`, 'WARNING');
    } catch (err) {
      log(`[SpecCrop] ${slug}: 엔진 호출 실패 (${err.message}) → 로컬 커버 폴백`, 'WARNING');
    }
  }

  try {
    const image = await fallbackCoverCrop(imageB64, spec);
    return { image, cropped: true, engine: 'cover' };
  } catch (err) {
    log(`[SpecCrop] ${slug}: 로컬 폴백도 실패 (${err.message}) → 원본 반환`, 'ERROR');
    return { image: imageB64, cropped: false, engine: 'none' };
  }
}
