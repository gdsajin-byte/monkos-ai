export const SPECS = {
  passport_kr: {
    name: '한국 여권',
    width: 413,        // px (35mm @ 300dpi)
    height: 531,       // px (45mm @ 300dpi)
    faceRatio: 0.74,   // 얼굴 33.5mm / 45mm (실무 3.3~3.4cm)
    topMargin: 0.07,   // 정수리 위 3mm / 45mm
    bottomMargin: 0.19, // 턱 아래 8.5mm / 45mm
    frameHmm: 45,
    faceTargetMm: 33,
    faceMinMm: 32.5,
  },
  passport_jp: {
    name: '日本旅券',
    width: 413,
    height: 531,
    faceRatio: 0.74,
    topMargin: 0.07,
    bottomMargin: 0.19,
    frameHmm: 45,
    faceTargetMm: 33,
    faceMinMm: 32.5,
  },
  id_kr: {
    name: '한국 반명함',
    width: 354,        // 30mm @ 300dpi
    height: 472,       // 40mm @ 300dpi
    faceRatio: 0.65,
    topMargin: 0.08,
    bottomMargin: 0.22,
    frameHmm: 40,
    faceTargetMm: 26,
    faceMinMm: 25,
  },
};

/**
 * format + country 조합으로 규격 조회
 * @param {string} format - 'passport' | 'id'
 * @param {string} country - 'KR' | 'JP'
 * @returns {object|null}
 */
export function getSpec(format = 'passport', country = 'KR') {
  const key = `${format}_${country.toLowerCase()}`;
  return SPECS[key] || null;
}
