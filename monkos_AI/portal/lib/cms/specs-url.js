/**
 * specs URL 정본 빌더 — ch2 7조(인프라 상수 정본 집중) 코드 집행
 * 전 코드에서 specs URL 직접 조립 금지. 본 모듈 경유 필수.
 */

export const SPECS_DOMAIN = 'https://monkos.ai';
export const SPECS_LANGS = ['ko', 'en', 'ja', 'es'];

export function specsPath(routeKey, lang = 'ko') {
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  return `${prefix}/specs/${routeKey}`;
}

export function specsUrl(routeKey, lang = 'ko') {
  return `${SPECS_DOMAIN}${specsPath(routeKey, lang)}`;
}

export function specsAlternates(routeKey) {
  return [
    ...SPECS_LANGS.map(l => ({ lang: l, href: specsUrl(routeKey, l) })),
    { lang: 'x-default', href: specsUrl(routeKey, 'en') },
  ];
}

export function specsHreflangTags(routeKey) {
  return specsAlternates(routeKey)
    .map(a => `<link rel="alternate" hreflang="${a.lang}" href="${a.href}">`)
    .join('\n');
}

export function specsCanonicalUrl(routeKey, lang = 'ko') {
  return specsUrl(routeKey, lang);
}
