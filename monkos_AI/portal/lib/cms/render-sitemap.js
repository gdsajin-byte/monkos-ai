/**
 * CMS SSR — Sitemap 동적 생성
 */
import { firestore, log } from '../shared/config.js';
import { SPECS_DATA } from './render-specs.js';

const blogCollection = firestore.collection('blog_posts');

// GET /sitemap.xml — 동적 생성
export async function renderSitemap(req, res) {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const staticUrls = [
      { loc: 'https://monkos.ai/', lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: 'https://monkos.ai/blog', lastmod: today, changefreq: 'daily', priority: '0.8' },
      { loc: 'https://monkos.ai/faq', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/gallery', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/board', lastmod: today, changefreq: 'daily', priority: '0.5' },
      { loc: 'https://monkos.ai/pricing', lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: 'https://monkos.ai/guide', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/crop', lastmod: today, changefreq: 'weekly', priority: '0.7' },
      { loc: 'https://monkos.ai/ja/blog', lastmod: today, changefreq: 'daily', priority: '0.7' },
      { loc: 'https://monkos.ai/en/blog', lastmod: today, changefreq: 'daily', priority: '0.7' },
      { loc: 'https://monkos.ai/ja/', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://monkos.ai/en/', lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: 'https://monkos.ai/ja/faq', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/en/faq', lastmod: today, changefreq: 'weekly', priority: '0.6' },
      { loc: 'https://monkos.ai/ja/pricing', lastmod: today, changefreq: 'monthly', priority: '0.5' },
      { loc: 'https://monkos.ai/en/pricing', lastmod: today, changefreq: 'monthly', priority: '0.5' },
      // specs 허브 인덱스
      { loc: 'https://monkos.ai/specs', lastmod: today, changefreq: 'monthly', priority: '0.9' },
      { loc: 'https://monkos.ai/ja/specs', lastmod: today, changefreq: 'monthly', priority: '0.8' },
      { loc: 'https://monkos.ai/en/specs', lastmod: today, changefreq: 'monthly', priority: '0.8' },
    ];

    // specs 개별 페이지 동적 추가
    for (const slug of Object.keys(SPECS_DATA)) {
      staticUrls.push({ loc: `https://monkos.ai/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.8' });
      staticUrls.push({ loc: `https://monkos.ai/ja/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
      staticUrls.push({ loc: `https://monkos.ai/en/specs/${slug}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
    }

    const snapshot = await blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get();
    const blogUrls = snapshot.docs.map(doc => {
      const data = doc.data();
      const docLang = data.lang || 'ko';
      const baseSlug = doc.id.replace(/-(?:kr|ja|en)$/, '');
      const langPrefix = docLang === 'ko' ? '' : `/${docLang}`;
      return {
        loc: `https://monkos.ai${langPrefix}/blog/${baseSlug}`,
        lastmod: (data.updatedAt || data.createdAt || '').substring(0, 10),
        changefreq: 'weekly',
        priority: '0.7',
      };
    });

    // URL 중복 제거
    const seen = new Set();
    const allUrls = [...staticUrls, ...blogUrls].filter(u => {
      if (seen.has(u.loc)) return false;
      seen.add(u.loc);
      return true;
    });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.writeHead(200, { 'Content-Type': 'application/xml; charset=utf-8' });
    res.end(xml);
  } catch (err) {
    log(`[CMS] sitemap 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
