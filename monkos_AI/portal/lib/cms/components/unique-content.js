import { escapeHtml } from '../render-shell.js';

/**
 * 유니크 콘텐츠 밴드 — specs-data uniqueContent.sections[] 렌더 (DESIGN_20260717).
 * 원칙: 해당 언어로 작성된 섹션만 노출 (기계번역 채움 금지 — 언어 단계화 가드),
 *       geoAnswer(AI 인용 가능 정답문)를 본문 앞에 강조, 출처는 공식(grade A) 배지.
 * 미보유 슬러그·언어는 빈 문자열 — 428 전 슬러그 공통 템플릿에서 안전.
 */
export function uniqueContentSection(ctx) {
  const { specData, lang } = ctx;
  const uc = specData.uniqueContent;
  const sections = uc && Array.isArray(uc.sections) ? uc.sections : null;
  if (!sections || !sections.length) return '';

  const blocks = sections.map((sec) => {
    const c = sec && sec[lang];
    if (!c || !c.title || !Array.isArray(c.body) || !c.body.length) return '';
    const sources = (sec.sources || [])
      .filter((s) => s && s.url && s.name)
      .map((s) => `<a class="v2-uc-source${s.grade === 'A' ? ' v2-uc-official' : ''}" href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.name)}</a>`)
      .join('');
    return `      <section class="v2-uc-block" id="uc-${escapeHtml(sec.id || '')}">
        <h2>${escapeHtml(c.title)}</h2>
        ${c.geoAnswer ? `<p class="v2-uc-answer">${escapeHtml(c.geoAnswer)}</p>` : ''}
        ${c.body.map((p) => `<p class="v2-uc-p">${escapeHtml(p)}</p>`).join('\n        ')}
        ${sources ? `<div class="v2-uc-sources">${sources}</div>` : ''}
      </section>`;
  }).filter(Boolean);

  if (!blocks.length) return '';
  return `    <!-- 6.5 유니크 콘텐츠 (DESIGN_20260717 — 파일럿) -->
    <div class="v2-uc-section">
${blocks.join('\n')}
    </div>`;
}
