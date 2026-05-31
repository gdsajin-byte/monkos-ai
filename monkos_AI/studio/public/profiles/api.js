/**
 * profiles/api.js — 서버 통신 (마스터 + 오버라이드, 단일 모드)
 */

import { state, updateState } from './state.js';
import { addToHistory } from './ui-gallery.js';

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function collectReferenceImages() {
  const refs = [];

  if (state.masterRef) {
    const data = state.masterRef.data || await fetchImageAsBase64(state.masterRef.thumb);
    if (data) refs.push({ role: 'master', data });
  }

  for (const cat of ['fashion', 'hair', 'makeup', 'background']) {
    const override = state.overrides[cat];
    if (!override) continue;
    const data = override.data || await fetchImageAsBase64(override.thumb);
    if (data) refs.push({ role: cat, data });
  }

  return refs;
}

export async function generate() {
  if (!state.base64Image && !state.masterRef) {
    showError('내 사진 또는 마스터 레퍼런스를 선택하세요');
    return;
  }

  const overlay = document.getElementById('loading-overlay');
  const progressFill = document.getElementById('progress-fill');
  const btnGenerate = document.getElementById('btn-generate');

  overlay.classList.add('active');
  btnGenerate.disabled = true;

  // 시간 기반 점진 증가: 90%까지 남은 거리의 일정 비율씩 수렴 (실제 생성이 길어도 멈춘 듯 보이지 않음)
  let progress = 0;
  progressFill.style.width = '0%';
  const progressTimer = setInterval(() => {
    progress += (90 - progress) * 0.08;
    progressFill.style.width = `${progress.toFixed(1)}%`;
  }, 400);

  try {
    const referenceImages = await collectReferenceImages();

    const res = await fetch('/api/profiles/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: state.base64Image || null,
        model: state.model,
        gender: state.gender,
        age: 'adult',
        purpose: state.purpose,
        customPrompt: state.customPrompt || '',
        referenceImages,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '생성 실패');
    }

    const data = await res.json();
    clearInterval(progressTimer);
    progressFill.style.width = '100%';

    updateState('generatedImage', data.image);

    addToHistory({
      before: state.base64Image,
      after: data.image,
      purpose: state.purpose,
    });

  } catch (err) {
    showError(err.message);
  } finally {
    clearInterval(progressTimer);
    setTimeout(() => {
      overlay.classList.remove('active');
      progressFill.style.width = '0%';
      btnGenerate.disabled = false;
    }, 500);
  }
}

function showError(msg) {
  const banner = document.getElementById('gen-error');
  if (!banner) { alert(`생성 실패: ${msg}`); return; }
  banner.textContent = msg;
  banner.style.display = 'flex';
  clearTimeout(showError._timer);
  showError._timer = setTimeout(() => { banner.style.display = 'none'; }, 8000);
}
