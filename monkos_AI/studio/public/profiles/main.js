/**
 * profiles/main.js — MONKOS Profiles SPA 진입점
 * 3컬럼: 좌측(카테고리탭) + 중앙(갤러리) + 우측(스택+생성)
 */

import { initSidebar } from './ui-sidebar.js';
import { initWorkspace } from './ui-workspace.js';
import { initGallery } from './ui-gallery.js';

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initWorkspace();
  initGallery();
});
