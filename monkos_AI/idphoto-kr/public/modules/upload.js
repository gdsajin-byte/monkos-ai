/**
 * upload.js — 갤러리 사진 올리기 (2026-11-05 kr 재정비 1/4, ORDER_20261105 kr업로드열기)
 * 작가님 15:16 "로그인 없이도 가능하고 업로드도 가능하지 실시간 촬영 강제는 발급보장 서비스등이고"
 *
 * 촬영과 같은 규격으로 맞춘다 — 긴 변 MAX_CAPTURE_SIZE, JPEG CAPTURE_QUALITY(정본 config.js, 촬영실과 공용).
 * EXIF 회전 반영, 거울상 없음(업로드는 원본 방향이 정답), 투명 PNG는 흰 바탕.
 * 디코딩 실패(HEIC 등)는 UploadError — 호출부가 명시 안내(무음 실패 금지).
 */
import { MAX_CAPTURE_SIZE, CAPTURE_QUALITY } from '../config.js';

export class UploadError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // 'none' | 'type' | 'decode'
  }
}

export const UPLOAD_MESSAGES = {
  none: '사진을 고르지 않았습니다',
  type: '사진 파일만 올릴 수 있습니다 — JPG/PNG로 올려 주세요',
  decode: '이 형식은 열 수 없습니다 — JPG/PNG로 올려 주세요',
};

async function decode(file) {
  // 1순위: createImageBitmap + EXIF 방향 반영
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch (e) { /* 옵션 미지원·형식 불가 → <img> 폴백 */ }
  }
  // 폴백: <img> — 현행 브라우저는 EXIF 방향을 기본 반영(image-orientation: from-image)
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new UploadError('decode'));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** File → { dataURL, width, height } (촬영 규격 JPEG). 실패는 UploadError */
export async function normalizeUpload(file) {
  if (!file) throw new UploadError('none');
  const looksImage = (file.type || '').startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name || '');
  if (!looksImage) throw new UploadError('type');
  let src;
  try {
    src = await decode(file);
  } catch (e) {
    throw new UploadError('decode');
  }
  const sw = src.width || src.naturalWidth, sh = src.height || src.naturalHeight;
  if (!sw || !sh) throw new UploadError('decode');
  const ratio = Math.min(1, MAX_CAPTURE_SIZE / sw, MAX_CAPTURE_SIZE / sh);
  const w = Math.round(sw * ratio), h = Math.round(sh * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // 투명 PNG → 흰 바탕(JPEG 검은 바탕 방지)
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src, 0, 0, w, h);
  if (typeof src.close === 'function') src.close();
  return { dataURL: canvas.toDataURL('image/jpeg', CAPTURE_QUALITY), width: w, height: h };
}

/** 숨은 file input 으로 고르기 → normalizeUpload. 고르지 않고 닫으면 null(오류 아님) */
export function pickImage(input) {
  return new Promise((resolve) => {
    input.value = '';
    input.onchange = () => resolve(input.files && input.files[0] ? input.files[0] : null);
    input.click();
  });
}
