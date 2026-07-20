import { escapeHtml } from '../render-shell.js';

export function specHero(ctx) {
  const { prefix, v2, countryName, typeName, specData, geoSummary } = ctx;
  return `    <!-- 1. 헤더 -->
    <nav class="v2-breadcrumb">
      <a href="${prefix}/specs">${escapeHtml(v2.breadcrumbGuide)}</a> &gt; ${escapeHtml(countryName)} &gt; ${escapeHtml(typeName)}
    </nav>
    <div class="v2-header">
      <h1>${escapeHtml(countryName)} ${escapeHtml(typeName)} 2026</h1>
      <div class="v2-sub">${escapeHtml(specData.countryEn || countryName)} ${escapeHtml(specData.typeEn || typeName)} Photo Specification</div>
    </div>
    <!-- 상단 sameSize 태그 전역 제거 (2026-07-11 작가님 — 어제 파일럿 한정 제거를 전 페이지 확장.
         동일규격 내부링크 정본 = 하단 롤다운 카드) -->
    <div class="v2-tags">
      <span class="v2-tag">${escapeHtml(countryName)}</span>
      <span class="v2-tag">${escapeHtml(typeName)}</span>
    </div>

    <!-- GEO 요약문 — 수치 명시 1문단. AI 오버뷰·생성형 엔진의 인용 표적 (2026-07-13 헤드텀 설계 §4-4) -->
    <p class="v2-geo-summary">${escapeHtml(geoSummary)}</p>`;
}
