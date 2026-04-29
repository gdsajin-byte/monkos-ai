/**
 * profiles/ui-workspace.js — Before/After 워크스페이스 + 다운로드
 */

import { state, onStateChange } from './state.js';

export function initWorkspace() {
  const imgBefore = document.getElementById('img-before');
  const imgAfter = document.getElementById('img-after');
  const phBefore = document.getElementById('ph-before');
  const phAfter = document.getElementById('ph-after');
  const btnRetry = document.getElementById('btn-retry');
  const btnDlAfter = document.getElementById('btn-dl-after');
  const btnDlCompare = document.getElementById('btn-dl-compare');

  onStateChange((key, value) => {
    if (key === 'base64Image' && value) {
      imgBefore.src = value;
      imgBefore.style.display = 'block';
      phBefore.style.display = 'none';
    }
    if (key === 'generatedImage' && value) {
      imgAfter.src = value;
      imgAfter.style.display = 'block';
      phAfter.style.display = 'none';
      btnRetry.disabled = false;
      btnDlAfter.disabled = false;
      btnDlCompare.disabled = false;
    }
  });

  // After 다운로드
  btnDlAfter.addEventListener('click', () => {
    if (!state.generatedImage) return;
    const link = document.createElement('a');
    link.href = state.generatedImage;
    link.download = `monkos_profile_${Date.now()}.png`;
    link.click();
  });

  // 비교컷 다운로드 (Canvas 합성)
  btnDlCompare.addEventListener('click', () => {
    if (!state.base64Image || !state.generatedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgA = new Image();
    const imgB = new Image();

    imgA.onload = () => {
      imgB.onload = () => {
        const w = 400, h = 533, gap = 16, pad = 24, brandH = 40;
        canvas.width = w * 2 + gap + pad * 2;
        canvas.height = h + pad * 2 + brandH;

        ctx.fillStyle = '#0A0E17';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(imgA, pad, pad, w, h);
        ctx.drawImage(imgB, pad + w + gap, pad, w, h);

        ctx.fillStyle = '#888';
        ctx.font = '13px "Noto Sans KR"';
        ctx.textAlign = 'center';
        ctx.fillText('Before', pad + w / 2, pad + h + 20);
        ctx.fillText('After', pad + w + gap + w / 2, pad + h + 20);

        ctx.fillStyle = '#555';
        ctx.font = '11px "Noto Sans KR"';
        ctx.fillText('MONKOS AI Studio · monkos.ai', canvas.width / 2, canvas.height - 12);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        link.download = `monkos_compare_${Date.now()}.jpg`;
        link.click();
      };
      imgB.src = state.generatedImage;
    };
    imgA.src = state.base64Image;
  });

  // 다시 생성
  btnRetry.addEventListener('click', () => {
    const { generate } = import('./api.js');
    generate();
  });
}
