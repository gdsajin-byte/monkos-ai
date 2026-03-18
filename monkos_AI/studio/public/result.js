/**
 * result.js — MONKOS Studio 결과 페이지
 * 흐름: sessionStorage에서 원본 로드 → /api/idgen 호출 → Before/After 표시 → 비교 컷 다운로드
 * 인증/결제 없음 (내부용)
 */

// ─── DOM ───
const loadingView = document.getElementById('loading-view');
const resultView = document.getElementById('result-view');
const errorView = document.getElementById('error-view');
const progressFill = document.getElementById('progress-fill');
const imgBefore = document.getElementById('img-before');
const imgAfter = document.getElementById('img-after');
const errorText = document.getElementById('error-text');

// ─── sessionStorage에서 데이터 로드 ───
const captured = sessionStorage.getItem('monkos_captured');
const format = sessionStorage.getItem('monkos_format') || 'passport';
const gender = sessionStorage.getItem('monkos_gender') || 'f';
const age = sessionStorage.getItem('monkos_age') || 'adult';

if (!captured) {
  location.href = 'app.html';
}

// ─── 유틸 ───
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// ─── 생성 실행 ───
let generatedImage = null;

async function runGeneration() {
  // 프로그레스 바 애니메이션
  setTimeout(() => {
    progressFill.style.transition = 'width 15s ease-out';
    progressFill.style.width = '90%';
  }, 100);

  const base64 = captured.includes(',') ? captured.split(',')[1] : captured;

  try {
    const res = await fetch('/api/idgen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        format,
        gender,
        age,
        clothing: 'default',
        hair: 'default',
        bgColor: format === 'passport' ? 'white' : 'white',
        v: 5,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `API 에러 (${res.status})`);
    }

    const data = await res.json();
    generatedImage = data.image;

    // 프로그레스 완료
    progressFill.style.transition = 'width 0.5s ease';
    progressFill.style.width = '100%';

    // 결과 표시
    setTimeout(() => showResult(), 500);

  } catch (err) {
    showError(err.message);
  }
}

function showResult() {
  loadingView.style.display = 'none';
  resultView.style.display = 'block';

  imgBefore.src = captured;
  imgAfter.src = generatedImage;
}

function showError(message) {
  loadingView.style.display = 'none';
  errorView.style.display = 'block';
  errorText.textContent = message;
}

// ─── After 이미지 다운로드 ───
document.getElementById('btn-download-after')?.addEventListener('click', () => {
  if (!generatedImage) return;
  const link = document.createElement('a');
  link.href = generatedImage;
  link.download = `monkos_studio_${Date.now()}.png`;
  link.click();
});

// ─── 비교 컷 다운로드 (Canvas 합성) ───
document.getElementById('btn-download-compare')?.addEventListener('click', async () => {
  if (!captured || !generatedImage) return;

  const btn = document.getElementById('btn-download-compare');
  btn.disabled = true;
  btn.textContent = '합성 중...';

  try {
    const [imgA, imgB] = await Promise.all([
      loadImage(captured),
      loadImage(generatedImage),
    ]);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 나란히 배치 (같은 높이)
    const h = 600;
    const wA = (imgA.width / imgA.height) * h;
    const wB = (imgB.width / imgB.height) * h;
    const gap = 20;
    const pad = 32;
    const totalW = wA + gap + wB + pad * 2;
    const brandH = 48;
    const totalH = h + pad * 2 + brandH;

    canvas.width = totalW;
    canvas.height = totalH;

    // 배경
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, totalW, totalH);

    // 원본 (Before)
    ctx.drawImage(imgA, pad, pad, wA, h);
    // 결과 (After)
    ctx.drawImage(imgB, pad + wA + gap, pad, wB, h);

    // 라벨
    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Before', pad + wA / 2, pad + h + 22);
    ctx.fillText('After', pad + wA + gap + wB / 2, pad + h + 22);

    // 브랜딩
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 12px "Noto Sans KR", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MONKOS AI Studio  ·  monkos.ai', totalW / 2, totalH - 12);

    // 다운로드
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.download = `monkos_compare_${Date.now()}.jpg`;
    link.click();

  } catch (e) {
    alert('비교 컷 합성 실패: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '비교 컷 다운로드';
  }
});

// ─── 다시 하기 ───
document.getElementById('btn-retry')?.addEventListener('click', () => {
  sessionStorage.removeItem('monkos_captured');
  location.href = 'app.html';
});

document.getElementById('btn-error-retry')?.addEventListener('click', () => {
  location.href = 'app.html';
});

// ─── 초기화 ───
runGeneration();
