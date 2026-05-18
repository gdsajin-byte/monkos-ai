/**
 * profiles/state.js — 프로필스 상태 관리
 * 단일 모드 (마스터 레퍼런스 기반)
 */

export const state = {
  base64Image: null,
  generatedImage: null,
  model: 'nano-banana-2',
  gender: 'f',
  purpose: 'linkedin',
  customPrompt: '',

  activeCategory: null,

  masterRef: null,
  overrides: {
    fashion: null,
    hair: null,
    makeup: null,
    background: null,
  },

  history: [],
};

const listeners = new Set();

export function updateState(key, value) {
  state[key] = value;
  listeners.forEach(fn => fn(key, value));
}

export function onStateChange(fn) {
  listeners.add(fn);
}
