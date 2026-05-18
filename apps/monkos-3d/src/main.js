import * as THREE from 'three';
import { createMonkosCharacter } from './character.js';
import { MonkosAnimator } from './animations.js';
import { MonkosTTS, PRESET_VOICES } from './tts.js';
import { SlideManager, ACTION } from './slides.js';

// ── Three.js 씬 셋업 ──
const canvas = document.getElementById('three-canvas');
const panel = document.getElementById('character-panel');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f0f23);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5.5);
camera.lookAt(0, -0.2, 0);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ── 조명 ──
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
mainLight.position.set(2, 3, 4);
scene.add(mainLight);
const rimLight = new THREE.DirectionalLight(0xa78bfa, 0.4);
rimLight.position.set(-2, 1, -2);
scene.add(rimLight);

// 바닥 그림자
const shadow = new THREE.Mesh(
  new THREE.CircleGeometry(0.8, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
);
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -1.8;
scene.add(shadow);

// ── 캐릭터 ──
const character = createMonkosCharacter();
scene.add(character);
const animator = new MonkosAnimator(character);

// ── TTS ──
const tts = new MonkosTTS((volume) => {
  animator.setMouthOpen(volume);
});
MonkosTTS.loadVoices();

// ElevenLabs 초기화 (비동기, 실패 시 Web Speech 폴백)
tts.initElevenLabs().then(({ available, voiceId, error }) => {
  const statusEl = document.getElementById('tts-status');
  if (available) {
    statusEl.textContent = `ElevenLabs 준비 완료 (${voiceId})`;
  } else {
    statusEl.textContent = `Web Speech 모드 ${error ? '— ' + error.slice(0, 40) : ''}`;
  }
  setTimeout(() => { statusEl.textContent = ''; }, 5000);
});

// ── 보이스 셀렉터 ──
const voiceSelect = document.getElementById('voice-select');
const voiceCustom = document.getElementById('voice-custom');

voiceSelect.addEventListener('change', () => {
  if (voiceSelect.value === '__custom__') {
    voiceCustom.style.display = 'inline-block';
    voiceCustom.focus();
  } else {
    voiceCustom.style.display = 'none';
    tts.setVoiceId(voiceSelect.value);
    const name = voiceSelect.options[voiceSelect.selectedIndex].text;
    document.getElementById('tts-status').textContent = `보이스: ${name}`;
    setTimeout(() => { document.getElementById('tts-status').textContent = ''; }, 2000);
  }
});

voiceCustom.addEventListener('change', () => {
  const customId = voiceCustom.value.trim();
  if (customId) {
    tts.setVoiceId(customId);
    document.getElementById('tts-status').textContent = `커스텀 보이스: ${customId.slice(0, 12)}...`;
    setTimeout(() => { document.getElementById('tts-status').textContent = ''; }, 2000);
  }
});

// ── 슬라이드 ──
const slideContent = document.getElementById('slide-content');
const slides = new SlideManager(slideContent);

// ── 리사이즈 ──
function resize() {
  const rect = panel.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
}
resize();
window.addEventListener('resize', resize);

// ── 애니메이션 루프 ──
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  animator.update(dt);

  // idle 숨쉬기 (바운스/이동 중이 아닐 때)
  if (!animator.bouncing && !animator.roaming) {
    character.position.y = -0.3 + Math.sin(clock.elapsedTime * 1.5) * 0.02;
  }

  renderer.render(scene, camera);
}
animate();

// ── 몽코스 액션 적용 ──
function applyAction(action) {
  // 먼저 모든 토글 상태 리셋
  if (animator.bouncing) animator.toggleBounce();
  if (animator.looking) animator.toggleLook();
  if (animator.pointing) animator.togglePoint();
  if (animator.roaming) animator.toggleRoam();

  switch (action) {
    case ACTION.BOUNCE:
      animator.toggleBounce();
      break;
    case ACTION.LOOK:
      animator.toggleLook();
      break;
    case ACTION.POINT:
      animator.togglePoint();
      break;
    case ACTION.FRONT:
      // 정면 응시 — 모든 것 끄고 기본 자세
      if (animator.head) animator.head.rotation.y = 0;
      break;
    case ACTION.ROAM:
      animator.toggleRoam();
      break;
    case ACTION.PAUSE:
      break;
    case ACTION.NONE:
    default:
      break;
  }

  // 버튼 active 상태 동기화
  syncButtonStates();
}

function syncButtonStates() {
  const mapping = {
    'btn-bounce': animator.bouncing,
    'btn-look': animator.looking,
    'btn-point': animator.pointing,
    'btn-walk': animator.walking,
    'btn-roam': animator.roaming,
  };
  for (const [id, active] of Object.entries(mapping)) {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', active);
  }
}

// ── 순차 TTS 발화 (슬라이드 대본 배열) ──
let isPlaying = false;
let stopRequested = false;

async function playCurrentSlide() {
  if (isPlaying) {
    // 중지 요청
    stopRequested = true;
    tts.stop();
    isPlaying = false;
    statusEl.textContent = '중지됨';
    btnSpeak.textContent = '▶ 발화';
    applyAction(ACTION.NONE);
    return;
  }

  const scripts = slides.getCurrentScripts();
  const actions = slides.getCurrentActions();

  if (!scripts || scripts.length === 0) return;

  isPlaying = true;
  stopRequested = false;
  btnSpeak.textContent = '⏹ 중지';
  statusEl.textContent = `발화 중 (1/${scripts.length})`;

  for (let i = 0; i < scripts.length; i++) {
    if (stopRequested) break;

    // 액션 적용
    if (actions[i]) applyAction(actions[i]);

    statusEl.textContent = `발화 중 (${i + 1}/${scripts.length})`;

    await new Promise((resolve) => {
      tts.speak(scripts[i], () => {
        // 문장 간 짧은 휴지
        setTimeout(resolve, 300);
      });
    });
  }

  // 완료
  isPlaying = false;
  stopRequested = false;
  btnSpeak.textContent = '▶ 발화';
  statusEl.textContent = '발화 완료';
  applyAction(ACTION.NONE);
  setTimeout(() => { statusEl.textContent = ''; }, 2000);
}

// ── 자동 재생 (전체 슬라이드 연속) ──
let autoPlaying = false;

async function autoPlayAll() {
  if (autoPlaying) {
    autoPlaying = false;
    stopRequested = true;
    tts.stop();
    btnAuto.textContent = '▶▶ 자동';
    btnAuto.classList.remove('active');
    return;
  }

  autoPlaying = true;
  btnAuto.textContent = '⏹ 정지';
  btnAuto.classList.add('active');

  // 현재 슬라이드부터 끝까지
  for (let s = slides.currentIndex; s < slides.total; s++) {
    if (!autoPlaying) break;

    slides.currentIndex = s;
    slides.render();

    await playSlideScripts(s);

    // 다음 슬라이드 전 짧은 대기
    if (autoPlaying && s < slides.total - 1) {
      await wait(800);
    }
  }

  autoPlaying = false;
  isPlaying = false;
  btnAuto.textContent = '▶▶ 자동';
  btnAuto.classList.remove('active');
  statusEl.textContent = '전체 발화 완료';
  applyAction(ACTION.NONE);
}

async function playSlideScripts(slideIdx) {
  const slide = slides.slides[slideIdx];
  const scripts = slide.scripts;
  const actions = slide.actions;

  isPlaying = true;
  stopRequested = false;

  for (let i = 0; i < scripts.length; i++) {
    if (stopRequested || !autoPlaying) break;

    if (actions[i]) applyAction(actions[i]);
    statusEl.textContent = `S${slideIdx + 1} (${i + 1}/${scripts.length})`;

    await new Promise((resolve) => {
      tts.speak(scripts[i], () => {
        setTimeout(resolve, 300);
      });
    });
  }

  isPlaying = false;
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── UI 바인딩 ──
const statusEl = document.getElementById('tts-status');
const btnSpeak = document.getElementById('btn-speak');
const btnAuto = document.getElementById('btn-auto');

btnSpeak.addEventListener('click', playCurrentSlide);
btnAuto.addEventListener('click', autoPlayAll);

document.getElementById('btn-prev').addEventListener('click', () => {
  if (isPlaying) { stopRequested = true; tts.stop(); }
  slides.prev();
});
document.getElementById('btn-next').addEventListener('click', () => {
  if (isPlaying) { stopRequested = true; tts.stop(); }
  slides.next();
});

// 애니메이션 토글 (수동)
function setupToggle(btnId, toggleFn) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    toggleFn();
    syncButtonStates();
  });
}

setupToggle('btn-bounce', () => animator.toggleBounce());
setupToggle('btn-look', () => animator.toggleLook());
setupToggle('btn-point', () => animator.togglePoint());
setupToggle('btn-walk', () => animator.toggleWalk());
setupToggle('btn-roam', () => animator.toggleRoam());

// ── 키보드 ──
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowLeft':
      if (isPlaying) { stopRequested = true; tts.stop(); }
      slides.prev();
      break;
    case 'ArrowRight':
      if (isPlaying) { stopRequested = true; tts.stop(); }
      slides.next();
      break;
    case ' ':
      e.preventDefault();
      btnSpeak.click();
      break;
    case 'a':
      btnAuto.click();
      break;
  }
});
