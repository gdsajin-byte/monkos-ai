/**
 * app.js — MONKOS Studio 업로드 로직
 * 카메라 대신 파일 업로드 → Base64 → sessionStorage → result.html 이동
 */

// ─── 상태 ───
let selectedFile = null;
let base64Image = null;
const options = {
  format: 'passport',
  gender: 'f',
  age: 'adult',
};

// ─── DOM ───
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const previewImg = document.getElementById('preview-img');
const previewInfo = document.getElementById('preview-info');
const optionsPanel = document.getElementById('options-panel');
const actionBar = document.getElementById('action-bar');
const btnGenerate = document.getElementById('btn-generate');
const btnReset = document.getElementById('btn-reset');

// ─── 파일 업로드 핸들러 ───
uploadArea.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

// ─── 드래그앤드롭 ───
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

// ─── 파일 처리 ───
function handleFile(file) {
  if (file.size > 10 * 1024 * 1024) {
    alert('10MB 이하 이미지만 업로드 가능합니다.');
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    base64Image = e.target.result;
    showPreview(file, base64Image);
  };
  reader.readAsDataURL(file);
}

function showPreview(file, dataUrl) {
  previewImg.src = dataUrl;
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);
  previewInfo.textContent = `${file.name} · ${sizeMB}MB`;

  uploadArea.style.display = 'none';
  previewArea.classList.add('active');
  optionsPanel.classList.add('active');
  actionBar.classList.add('active');
}

// ─── 옵션 칩 선택 ───
document.querySelectorAll('.option-chips').forEach(group => {
  const optionKey = group.dataset.option;
  group.querySelectorAll('.option-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.option-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      options[optionKey] = chip.dataset.value;
    });
  });
});

// ─── 리셋 ───
btnReset.addEventListener('click', () => {
  selectedFile = null;
  base64Image = null;
  fileInput.value = '';
  previewArea.classList.remove('active');
  optionsPanel.classList.remove('active');
  actionBar.classList.remove('active');
  uploadArea.style.display = '';
});

// ─── AI 보정 시작 ───
btnGenerate.addEventListener('click', async () => {
  if (!base64Image) return;

  btnGenerate.disabled = true;
  btnGenerate.textContent = 'AI 보정 중...';

  // sessionStorage에 원본 + 옵션 저장
  try {
    sessionStorage.setItem('monkos_captured', base64Image);
    sessionStorage.setItem('monkos_format', options.format);
    sessionStorage.setItem('monkos_gender', options.gender);
    sessionStorage.setItem('monkos_age', options.age);
  } catch (e) {
    alert('이미지가 너무 큽니다. 더 작은 이미지를 사용해 주세요.');
    btnGenerate.disabled = false;
    btnGenerate.textContent = 'AI 보정 시작';
    return;
  }

  // result.html로 이동
  location.href = 'result.html';
});
