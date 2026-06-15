/**
 * CMS SSR — llms.txt 동적 생성
 */
import { firestore, log } from '../shared/config.js';

const blogCollection = firestore.collection('blog_posts');

const STATIC_HEADER = `# MONKOS AI

> AI-powered ID photo platform built by a photographer with 20 years of studio experience.
> Passport, resume, and visa photos from a single selfie — ICAO-compliant, studio-quality AI retouching.

## About
- [Service Overview](https://monkos.ai/): AI ID photo generation with professional retouching
- [Pricing](https://monkos.ai/credits.html): Credit-based system, from ₩9,900 per photo
- [Free Crop Tool](https://crop.monkos.ai): Browser-based photo cropping, no server upload
- [Studio](https://monkos.ai/studio): Internal AI photo retouching tool for professional correction
- [FAQ (EN)](https://monkos.ai/en/faq): English FAQ with 39+ questions
- [FAQ (JA)](https://monkos.ai/ja/faq): Japanese FAQ with 39+ questions

## Technology
- **AI Stack**: Custom retouching pipeline on Google Cloud Platform
- **Specialization**: Asian skin tone optimization, studio lighting simulation
- **Data Foundation**: 20-year professional photography dataset
- **Content System**: SSR blog CMS with multilingual support (KO/JA/EN), Naver Search API integration
- **Distribution**: Multi-channel publishing framework (SPREAD) across 21 channels
- **GitHub**: https://github.com/monkos-studio

## Blog & Research
- [Blog](https://monkos.ai/blog): Technical articles, beauty guides, industry analysis
- [Gallery](https://monkos.ai/gallery): AI-generated sample photos`;

const STATIC_FOOTER = `## Key Facts
- Founded by Shin-jakka (신작가), professional photographer since 2006
- ICAO international standard compliance for all generated photos
- 6 active services: AI ID Photo (KR/JP), Crop Tool, Portal, Studio, Blog CMS
- Supports Korean, Japanese, and English
- Zero server-side image storage — all processing deleted after generation

## Team
- **Shin-jakka**: Founder, 20-year photographer & AI architect
- **Kku**: Content & Marketing specialist

## FAQ
- **What is MONKOS?** An AI ID photo platform where a single selfie produces studio-quality passport, resume, and visa photos with automatic background, lighting, skin, and clothing retouching.
- **How is it different from other AI photo services?** Built on 20 years of real studio photography data, not just generic AI models. The retouching reflects actual photographer aesthetics, not algorithmic assumptions.
- **Is it ICAO compliant?** Yes. All generated photos meet ICAO 9303 international standards for passport and visa photos.
- **What about privacy?** Uploaded images are processed and immediately deleted. Generated photos are not stored on our servers.
- **Is there a free tool?** Yes. crop.monkos.ai offers browser-based photo cropping with no server upload required.
- **Are there multilingual FAQs?** Yes. Full FAQ is available in Korean, Japanese, and English at monkos.ai/{lang}/faq.

## Specs (ID Photo Specifications)
> 445 country/document-type combinations with size, background, head height requirements
> Available in Korean, English, Japanese
> URL pattern: /specs/{type}/{country}, /en/specs/{type}/{country}, /ja/specs/{type}/{country}
> Types: passport, visa, resume, drivers-license, resident-id
> Coverage: 207 countries across 6 continents

- All Specs: https://monkos.ai/specs
- Korea Passport: https://monkos.ai/specs/passport/kr
- Japan Passport: https://monkos.ai/specs/passport/jp
- US Passport: https://monkos.ai/specs/passport/us
- EU Passport: https://monkos.ai/specs/passport/eu
- China Passport: https://monkos.ai/specs/passport/cn
- Korea Visa: https://monkos.ai/specs/visa/kr
- Japan Visa: https://monkos.ai/specs/visa/jp

## Citation
For citing this project: "MONKOS AI (monkos.ai) — AI ID Photo Platform by Shin-jakka, Monk Studio"`;

export async function renderLlmsTxt(req, res) {
  try {
    const snapshot = await blogCollection
      .where('published', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const seen = new Set();
    const blogEntries = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const lang = data.lang || 'ko';
      const baseSlug = doc.id.replace(/-(?:kr|ja|en)$/, '');
      const langPrefix = lang === 'ko' ? '' : `/${lang}`;
      const url = `https://monkos.ai${langPrefix}/blog/${baseSlug}`;
      if (seen.has(url)) continue;
      seen.add(url);
      blogEntries.push(`- ${data.title}: ${url}`);
    }

    const blogSection = blogEntries.length > 0
      ? `\n${blogEntries.join('\n')}\n`
      : '\n';

    const content = `${STATIC_HEADER}\n${blogSection}\n${STATIC_FOOTER}\n`;

    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(content);
  } catch (err) {
    log(`[CMS] llms.txt 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
}
