/* blog-share.js — 공유 버튼 모듈 (ESM, v2.0) */
import { showToast } from './admin-common.js';

function getShareUrl() {
  const slug = document.getElementById('slug').value.trim();
  const lang = document.getElementById('lang').value;
  if (!slug) return '';
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  return `https://monkos.ai${prefix}/blog/${slug}`;
}

export function updateShareButtons(isPublished) {
  const section = document.getElementById('shareSection');
  const url = getShareUrl();
  const title = document.getElementById('title').value.trim();
  if (isPublished && url) {
    section.classList.remove('disabled');
    document.getElementById('shareX').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    document.getElementById('shareLine').href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`;
    document.getElementById('shareKakao').href = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
  } else {
    section.classList.add('disabled');
  }
}

function copyShareLink() {
  const url = getShareUrl();
  if (url) { navigator.clipboard.writeText(url); showToast('링크 복사 완료'); }
}

function copyShareFull() {
  const url = getShareUrl();
  const title = document.getElementById('title').value.trim();
  if (url && title) { navigator.clipboard.writeText(`${title}\n${url}`); showToast('제목+URL 복사 완료'); }
}

// onclick 전역 등록
window.copyShareLink = copyShareLink;
window.copyShareFull = copyShareFull;
