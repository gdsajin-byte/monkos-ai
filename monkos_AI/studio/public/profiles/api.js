/**
 * profiles/api.js — 서버 통신 (생성 요청)
 */

import { state, updateState } from './state.js';
import { PURPOSE_PRESETS, SAMPLES } from './templates.js';
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
  const categories = ['outfit', 'hair', 'pose', 'makeup'];

  for (const cat of categories) {
    const id = state[cat];
    if (!id || id.startsWith('default')) continue;
    const items = SAMPLES[cat];
    if (!items) continue;
    const item = items.find(i => i.id === id);
    if (!item?.thumb) continue;
    const data = await fetchImageAsBase64(item.thumb);
    if (data) refs.push({ category: cat, data });
  }

  return refs;
}

export async function generate() {
  if (!state.base64Image) return;

  const overlay = document.getElementById('loading-overlay');
  const progressFill = document.getElementById('progress-fill');
  const btnGenerate = document.getElementById('btn-generate');

  overlay.classList.add('active');
  progressFill.style.width = '10%';
  btnGenerate.disabled = true;

  try {
    const preset = PURPOSE_PRESETS[state.purpose] || PURPOSE_PRESETS.linkedin;

    progressFill.style.width = '20%';
    const referenceImages = await collectReferenceImages();
    progressFill.style.width = '30%';

    const res = await fetch('/api/profiles/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: state.base64Image,
        mode: 'profile',
        model: state.model,
        gender: state.gender,
        age: 'adult',
        purpose: state.purpose,
        framing: state.framing,
        background: state.background,
        outfit: state.outfit,
        hair: state.hair,
        pose: state.pose,
        makeup: state.makeup,
        customPrompt: state.customPrompt || '',
        lighting: preset.lighting,
        mood: preset.mood,
        referenceImages,
      }),
    });

    progressFill.style.width = '80%';

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || '생성 실패');
    }

    const data = await res.json();
    progressFill.style.width = '100%';

    updateState('generatedImage', data.image);

    addToHistory({
      before: state.base64Image,
      after: data.image,
      purpose: state.purpose,
      outfit: state.outfit,
      hair: state.hair,
    });

  } catch (err) {
    alert(`생성 실패: ${err.message}`);
  } finally {
    setTimeout(() => {
      overlay.classList.remove('active');
      progressFill.style.width = '0%';
      btnGenerate.disabled = false;
    }, 500);
  }
}
