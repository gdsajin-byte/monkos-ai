/**
 * profiles/state.js — 프로필스 상태 관리
 * 9축 스키마 중 고객 선택 축을 관리
 */

export const state = {
  // 입력
  base64Image: null,
  generatedImage: null,

  // 모델 선택
  model: 'nano-banana-2',

  // 고객 선택 축
  gender: 'f',
  purpose: 'linkedin',
  framing: 'headshot',
  background: 'studio-white',

  // 스타일 샘플 선택 (이미지 카드 클릭)
  outfit: null,
  hair: null,
  pose: null,
  makeup: null,

  // 자유 프롬프트
  customPrompt: '',

  // 아카이브
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
