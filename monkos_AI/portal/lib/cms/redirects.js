/**
 * 블로그 301 리다이렉트 맵 — 단일 정본
 * server.js(요청 처리)와 render-sitemap.js(소스 URL 제외)가 공유한다.
 * 구 슬러그 → 신규 슬러그 (GSC 404/중복 색인 해소용).
 */
export const BLOG_REDIRECTS = {
  // JA — 죽은 타깃 교정 (2026-07-05 대사: 타깃 404 → 살아있는 슬러그로 교체)
  '/ja/blog/vol23-qa-5':     '/ja/blog/japanese-job-seekers-frequently-asked-questions-about-id-pho',
  '/ja/blog/vol22':          '/ja/blog/mensetsu-odango-hair-kanpeki-5-steps',
  '/ja/blog/vol21-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',
  '/ja/blog/vol20-vs':       '/ja/blog/korea-vs-japan-job-photo-hairstyle',
  // EN — 죽은 타깃 교정 (2026-07-05 대사)
  '/en/blog/vol23-qa-5':     '/en/blog/top-5-faqs-about-id-photos-from-japanese-job-seekers',
  '/en/blog/vol22':          '/en/blog/5-steps-to-perfect-interview-updo-expert-tips',
  '/en/blog/vol21-ai-monkosai': '/en/blog/ai-id-photo-created-by-a-20-year-photographer-monkos-ai',
  '/en/blog/vol20-vs':       '/en/blog/korean-vs-japanese-job-application-photo-hair',
  '/en/blog/vol19':          '/en/blog', // FIXME: 살아있는 대응 글 없음 (2026-07-05 대사 — EN 톤별 메이크업 글 부재)
  // KO
  '/blog/vol23-qa-5':        '/blog/vol24-20-ai-monkosai',

  // === 신규 3건 (2026-04-14 GSC 404 해소 — hreflang 유령 URL 잔존분) ===
  // 주: 오더 원안은 6건이었으나 JA 번역본 부재(vol17/18/19 JA)로 3건 제외.
  //    해당 3건은 건1(hreflang 조건부)로 장기 해소 예정. 기존 캐시는 자연 해소.
  '/en/blog/vol17-vs':       '/en/blog/korea-vs-japan-interview-attire-whats-the-difference',
  '/en/blog/vol18-ai-vs':    '/en/blog/ai-photo-id-can-a-selfie-really-become-an-official-photo',
  '/ja/blog/vol24-20-ai-monkosai': '/ja/blog/20-year-photographer-ai-id-photo-monkos-ai-birth',

  // === KO 한글 slug → 영문 slug 301 (2026-04-27 B-2 마이그레이션) ===
  '/blog/20%EB%85%84-%EC%82%AC%EC%A7%84%EC%9E%91%EA%B0%80%EA%B0%80-ai%EB%A1%9C-%EB%A7%8C%EB%93%A0-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%84%9C%EB%B9%84%EC%8A%A4-monkosai': '/blog/20-year-photographer-creates-id-photos-with-ai-monkos-ai',
  '/blog/ai%EB%A1%9C-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A7%8C%EB%93%A4%EA%B8%B0-%EC%A7%84%EC%A7%9C-%EA%B0%80%EB%8A%A5%ED%95%A0%EA%B9%8C-%ED%98%84%EC%A7%81-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%9A%B4%EC%98%81%EC%9E%90%EC%9D%98-%EC%86%94%EC%A7%81%ED%95%9C-%EB%A6%AC%EB%B7%B0': '/blog/ai-vs-studio-id-photo', // 2026-07-05 대사: 구 타깃 can-you-really-create-id-photos-with-ai-honest-review 404 → 현직 사진작가 솔직 비교 글로 교체
  '/blog/ai%EC%97%90-%EB%8C%80%ED%95%9C-%EC%84%9C%EB%A1%A0': '/blog/musings-on-ai',
  '/blog/claudemax-20x-2%EA%B0%9C%EC%9B%94-%EC%8B%A4%EC%82%AC%EC%9A%A9-%ED%9B%84%EA%B8%B0': '/blog/claude-max-20x-2-month-real-usage-review',
  '/blog/exaone-usb-ai-chatbot-%ED%9B%84%EA%B8%B0': '/blog/ai-on-a-usb-lg-exaone-35-korean-model-review',
  '/blog/monkos-ai-%EA%B0%80-%ED%83%84%EC%83%9D%ED%96%88%EC%8A%B5%EB%8B%88%EB%8B%A4': '/blog/birth-of-monkos-ai-20-year-photographers-ai-platform',
  '/blog/monkos-crop-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%8B%A4%EB%AC%B4%EB%A5%BC-%EA%B7%B8%EB%8C%80%EB%A1%9C-%EC%98%AE%EA%B8%B4-%ED%81%AC%EB%A1%AD%EC%95%B1': '/blog/monkos-crop-cropping-app-that-mirrors-photo-studio-work',
  '/blog/%EB%82%B4-%EC%86%90%EC%95%88%EC%97%90-%EC%82%AC%EC%A7%84%EA%B4%80-monkosai-%EC%82%AC%EC%9A%A9%EB%B2%95%EC%9D%84-%EC%86%8C%EA%B0%9C%ED%95%A9%EB%8B%88%EB%8B%A4': '/blog/photo-studio-in-my-hand-monkos-ai-usage-guide',
  '/blog/%EC%82%AC%EC%A7%84%EA%B4%80-12%EB%85%84-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%95%B1%EA%B0%9C%EB%B0%9C': '/blog/12-year-photo-studio-ai-id-photo-app',
  '/blog/%EC%82%AC%EC%A7%84%EA%B4%80-%EA%B0%80%EA%B8%B0-%EC%A0%84%EC%97%90-%EA%BC%AD-%EC%9D%BD%EC%96%B4%EC%95%BC-%ED%95%A0-%EC%B7%A8%EC%A4%80%EC%83%9D-%ED%97%A4%EC%96%B4%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EA%B0%80%EC%9D%B4%EB%93%9C-2026': '/blog/must-read-before-visiting-a-photo-studio-hair-makeup',
  '/blog/%EC%A0%9C%EB%AA%A9-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84%EC%97%90%EC%84%9C-%EB%B9%9B%EB%82%98%EB%8A%94-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%B9%84%EB%B2%95': '/blog/makeup-tips-to-shine-in-your-id-photo',
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%B7%A8%EC%97%85-%EC%97%AC%EA%B6%8C-%EB%B9%84%EC%9E%90-%ED%95%9C-%EC%9E%A5%EC%9D%98-%EC%82%AC%EC%A7%84%EC%9D%B4-%EC%B2%AB%EC%9D%B8%EC%83%81%EC%9D%84-%EA%B2%B0%EC%A0%95%ED%95%9C%EB%8B%A4': '/blog/id-photo-makeup-job-passport-visa-first-impression',
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%ED%86%A4%EC%97%85-%EC%84%B8%ED%8C%85%EB%B2%95': '/blog/id-photo-makeup-job-application-perfect-tone-guide',
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%B4%EC%A0%91-%ED%97%A4%EC%96%B4%EC%97%90-%EB%8F%84%EC%9B%80%EC%9D%B4-%EB%90%98%EB%8A%94-%EC%9E%90%EC%97%B0%EC%8A%A4%EB%9F%AC%EC%9A%B4-%EB%B3%BC%EB%A5%A8-%EC%82%B4%EB%A6%AC%EB%8A%94-%EB%B0%A9%EB%B2%95': '/blog/natural-volume-secrets-for-photos-and-interviews',
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9E%98-%EB%82%98%EC%98%A4%EB%8A%94-%ED%91%9C%EC%A0%95-%ED%8F%AC%EC%A6%88-%EC%97%B0%EC%8A%B5%EB%B2%95-%EC%B2%AB%EC%9D%B8%EC%83%81%EC%9D%80-%ED%91%9C%EC%A0%95%EC%9D%B4-%EB%A7%8C%EB%93%A0%EB%8B%A4': '/blog/id-photo-expression-pose-tips-first-impression',
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%ED%86%A4%EB%B3%84%EB%A1%9C-%EC%99%84%EB%B2%BD%ED%95%98%EA%B2%8C-%EC%84%B8%ED%8C%85%ED%95%98%EB%8A%94-%EB%B2%95': '/blog/id-photo-makeup-job-application-perfect-tone-guide', // 2026-07-05 대사: 구 타깃 -perfect-tone 404
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4%EC%8A%A4%ED%83%80%EC%9D%BC-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%8B%A4%EC%9D%8C%EC%9D%80-%ED%97%A4%EC%96%B4-%EC%9D%B8%EC%83%81%EC%9D%84-%EC%99%84%EC%84%B1%ED%95%98%EB%8A%94-%EB%A7%88%EC%A7%80%EB%A7%89-%ED%95%9C-%EC%88%98': '/blog/id-photo-hairstyle-hair-after-makeup-finishing-touch', // 2026-07-05 대사: 구 타깃 -final-touch 404
  '/blog/%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4%EC%8A%A4%ED%83%80%EC%9D%BC%EB%A7%81-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EB%8B%A4%EC%9D%8C%EC%9D%80-%ED%97%A4%EC%96%B4-%EC%9D%B8%EC%83%81%EC%9D%84-%EC%99%84%EC%84%B1%ED%95%98%EB%8A%94-%EB%A7%88%EC%A7%80%EB%A7%89-%ED%95%9C-%EC%88%98': '/blog/id-photo-hairstyle-hair-after-makeup-finishing-touch',
  '/blog/%EC%B7%A8%EC%97%85-%EB%A9%B4%EC%A0%91-%EC%98%AC%EB%A6%BC%EB%A8%B8%EB%A6%AC-%EC%8A%B9%EB%AC%B4%EC%9B%90%EB%A8%B8%EB%A6%AC-%EC%99%84%EC%84%B1-5%EB%8B%A8%EA%B3%84-%ED%98%84%EC%9E%A5-%EA%B2%BD%EB%A0%A5-10%EB%85%84-%EB%85%B8%ED%95%98%EC%9A%B0-%EA%B3%B5%EA%B0%9C': '/blog/interview-updo-hairstyle-5-steps-10-year-pro-tips', // 2026-07-05 대사: 구 타깃 job-interview-updo-flight-attendant-hair-5-steps 404
  '/blog/%EC%B7%A8%EC%97%85-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9D%98%EC%83%81-%EC%BB%AC%EB%9F%AC-%EC%84%A0%ED%83%9D%EB%B2%95-%EC%98%B7-%ED%95%9C-%EB%B2%8C%EC%9D%B4-%EB%8B%B9%EB%9D%BD%EC%9D%84-%EB%B0%94%EA%BE%BC%EB%8B%A4': '/blog/job-application-photo-clothing-color-selection',
  '/blog/%ED%81%B4%EB%A1%9C%EB%93%9C%EA%B0%80-%EC%BB%B4%ED%93%A8%ED%84%B0-%EA%BA%BC%EC%A0%B8%EC%9E%88%EC%9D%84-%EB%95%8C%EB%8F%84-%EC%9D%BC%EC%9D%84-%ED%95%9C%EB%8B%A4%EA%B3%A0': '/blog/kulleodeu-neun-keompyuteoga-kkeojyeoisseodo-maeil-hal-ileun-', // 2026-07-05 대사: 구 타깃 does-claude-work-even-when-the-computer-is-off 404
  '/blog/%ED%95%9C-%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84%EA%B3%BC-%EB%A9%B4%EC%A0%91%EC%97%90-%ED%95%84%EC%9A%94%ED%95%9C-%EC%9D%98%EC%83%81-%EB%A9%B4%EC%A0%91%EB%A8%B8%EB%A6%AC-%EC%9E%90%EC%8B%A0%EA%B0%90%EC%9D%98-%EC%8B%9C%EC%9E%91%EC%9D%80-%EB%82%98%EB%8B%A4%EC%9A%B4-%EB%AA%A8%EC%8A%B5': '/blog/job-interview-photo-outfit-hairstyle-confidence',
  '/blog/%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%ED%97%A4%EC%96%B4-%EC%99%9C-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%A4%EB%A5%BC%EA%B9%8C': '/blog/korea-vs-japan-job-photo-hairstyle-difference', // 2026-07-05 대사: 구 타깃 korea-vs-japan-job-application-photo-hair-differences 404
  '/blog/%ED%95%9C%EB%B2%88%EC%AF%A4-%EA%B3%A0%EB%AF%BC%ED%95%98%EA%B2%8C-%EB%90%98%EB%8A%94-%EC%95%84%EA%B8%B0-%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%95%88-%EA%B0%80%EB%8F%84-%EC%A7%91%EC%97%90%EC%84%9C-%EC%B0%8D%EC%9D%80-%EC%9D%B4%EC%95%BC%EA%B8%B0': '/blog/baby-passport-photo-at-least-once-taken-at-home',
  '/blog/%ED%95%9C%EB%B2%88%EC%AF%A4-%EA%B3%A0%EB%AF%BC%ED%95%98%EA%B2%8C-%EB%90%98%EB%8A%94-%EC%95%84%EA%B8%B0-%EC%97%AC%EA%B6%8C%EC%82%AC%EC%A7%84-%EC%82%AC%EC%A7%84%EA%B4%80-%EC%95%88-%EA%B0%80%EB%8F%84-%EC%A7%91%EC%97%90%EC%84%9C-%EC%B0%8D%EC%9D%80-%EC%9D%B4%EC%95%BC%EA%B8%B0-mmxg1mrn': '/blog/making-baby-passport-photos-at-home-success-story',
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol15-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EB%A9%B4%EC%A0%91-%EB%B3%B5%EC%9E%A5-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/vol15-vs', // 2026-07-05 대사: 구 타깃 korean-researcher-magazine-vol-15-korea-vs-japan-interview 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol16-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%A4%80%EC%83%9D-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EC%B0%8D%EC%9C%BC%EB%A9%B4-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/vol16', // 2026-07-05 대사: 구 타깃 researcher-magazine-vol16-japanese-job-seeker-photos 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol17-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EB%A9%B4%EC%A0%91-%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%AC%EB%9D%BC%EC%9A%94': '/blog/vol17-vs', // 2026-07-05 대사: 구 타깃 korean-vs-japanese-interview-makeup-the-differences 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol18-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-vs-%EC%8A%A4%ED%8A%9C%EB%94%94%EC%98%A4-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%AD%90%EA%B0%80-%EB%8B%A4%EB%A5%BC%EA%B9%8C': '/blog/vol18-ai-vs', // 2026-07-05 대사: 구 타깃 ai-id-photo-vs-studio-id-photo-whats-the-difference 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol19-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%B0%B0%EA%B2%BD%EC%83%89-%EB%AD%98%EB%A1%9C-%EA%B3%A8%EB%9D%BC%EC%95%BC-%ED%95%A0%EA%B9%8C-%ED%95%9C%EA%B5%AD-vs-%EC%9D%BC%EB%B3%B8-%EC%99%84%EC%A0%84-%EB%B9%84%EA%B5%90': '/blog/vol19', // 2026-07-05 대사: 구 타깃 id-photo-background-color-korea-vs-japan-comparison 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol21-ai-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EC%85%80%EC%B9%B4-%ED%95%9C-%EC%9E%A5%EC%9D%B4-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84%EC%9D%B4-%EB%90%9C%EB%8B%A4%EA%B3%A0-monkosai-%EC%A7%81%EC%A0%91-%EC%8D%A8%EB%B4%A4%EC%96%B4%EC%9A%94': '/blog/vol21-ai-monkosai', // 2026-07-05 대사: 구 타깃 ai-profile-picture-one-selfie-becomes-a-profile 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol22-%EC%85%80%EC%B9%B4%EB%A1%9C-%EC%B7%A8%EC%97%85-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A7%8C%EB%93%A4%EB%A0%A4%EB%A9%B4-%EC%9D%B4%EA%B2%83%EB%A7%8C-%EC%95%8C%EB%A9%B4-%EB%8F%BC%EC%9A%94': '/blog/vol22', // 2026-07-05 대사: 구 타깃 selfie-job-application-photo-heres-what-you-need-to-know 404
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EB%A7%A4%EA%B1%B0%EC%A7%84-vol23-%EC%B7%A8%EC%A4%80%EC%83%9D%EC%9D%B4-%EA%B0%80%EC%9E%A5-%EB%A7%8E%EC%9D%B4-%EB%AC%BB%EB%8A%94-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-qa-5%EA%B0%80%EC%A7%80': '/blog/vol24-20-ai-monkosai', // 2026-07-05 대사: 구 타깃 404. KO vol23 부재 — 기존 '/blog/vol23-qa-5' 엔트리와 동일 타깃으로 정렬
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90-%EC%B9%BC%EB%9F%BC-%EC%A6%9D%EB%AA%85%EC%82%AC%EC%A7%84-%EB%A9%B4%EC%A0%91%ED%97%A4%EC%96%B4%EB%A9%94%EC%9D%B4%ED%81%AC%EC%97%85%EC%97%90-%EC%A4%91%EC%9A%94%ED%95%9C-%EA%B0%81%EC%A7%88%EC%A0%9C%EA%B1%B0-%EC%B2%AD%EA%B2%B0-%EC%8B%A0%EB%A2%B0%EA%B0%90%EC%9D%98-%EC%8B%9C%EC%9E%91': '/blog/clean-impression-first-step-exfoliation-for-id-interview',
  '/blog/%ED%95%9C%EC%97%B0%EA%B5%AC%EC%9B%90%EB%A7%A4%EA%B1%B0%EC%A7%84vol20-%ED%95%9C%EA%B5%AD-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-vs-%EC%9D%BC%EB%B3%B8-%EC%B7%A8%EC%97%85%EC%82%AC%EC%A7%84-%EC%9D%B4%EB%A0%87%EA%B2%8C-%EB%8B%A4%EB%A6%85%EB%8B%88%EB%8B%A4': '/blog/vol20-vs', // 2026-07-05 대사: 구 타깃 korean-vs-japanese-job-application-photos-compared 404

  // === 정크 슬러그 리슬러그 (2026-06-15 색인 최적화) ===
  '/blog/47-20x': '/blog/claude-opus-47-what-went-wrong-max-20x-user-kr',
  '/blog/14-vs': '/blog/korea-vs-japan-job-photo-hairstyle-difference-kr',
  '/blog/5-10': '/blog/interview-updo-hairstyle-5-steps-10-year-pro-tips-kr',

  // === GSC 404 실측 흡수 (2026-07-05 대사 — 신규 키, 전 타깃 curl 200 확인) ===
  '/blog/interview-bun-hairstyle-5-steps': '/blog/interview-updo-hairstyle-5-steps-10-year-pro-tips',
  '/ja/blog/interview-bun-hairstyle-5-steps': '/ja/blog/mensetsu-odango-hair-kanpeki-5-steps',
  '/ja/blog/ai-de-shomei-shashin-geneki-shashinkan-review': '/ja/blog/ai-vs-studio-id-photo',
  '/ja/blog/usb-ai-lg-exaone-3-5-korean-small-model-review': '/ja/blog/usb-ai-lg-exaone-3-5-llamafile-review',
  '/en/blog/interview-updo-flight-attendant-hair-5-steps': '/en/blog/5-steps-to-perfect-interview-updo-expert-tips',
  '/en/blog/korean-vs-japanese-interview-makeup-heres-how-they-differ': '/en/blog', // FIXME: 살아있는 대응 글 없음 (2026-07-05 대사 — EN 면접 메이크업 한일비교 글 부재)
  '/en/blog/id-photo-job-application-photo-makeup-for-each-skin-tone': '/en/blog', // FIXME: 살아있는 대응 글 없음 (2026-07-05 대사 — EN 톤별 메이크업 글 부재)
  // 주: GSC 404 '/blog/증명사진-취업사진-메이크업-톤별로-...'(URL인코딩)은 기존 키 존재 — 위 타깃 교정으로 해소됨
};
