/**
 * 교차오염 원본 17건 재번역 스크립트
 * - 한글 slug KO 원본 → Gemini 영문 base slug 생성 → {base}-ja/{base}-en 으로 저장
 * - 새 translate.js 스키마 적용 (ensureEnglishBase 로직 포함)
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/retranslate_crosscontamination.js
 *   cd monkos_AI/portal && node scripts/retranslate_crosscontamination.js --execute
 *
 * ⚠️ 프로덕션 Firestore + Gemini API 사용.
 *   GCP 인증 필요: gcloud auth application-default login
 */

import { Firestore } from '@google-cloud/firestore';
import { GoogleGenAI } from '@google/genai';

const execute = process.argv.includes('--execute');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');
const ai = new GoogleGenAI({ vertexai: true, project: 'monkos', location: 'us-central1' });

const DELAY_MS = 1000;

const TARGET_SLUGS = [
  '20년-사진작가가-ai로-만든-증명사진-서비스-monkosai',
  'ai에-대한-서론',
  'claudemax-20x-2개월-실사용-후기',
  'monkos-ai-가-탄생했습니다',
  'monkos-crop-사진관-실무를-그대로-옮긴-크롭앱',
  '내-손안에-사진관-monkosai-사용법을-소개합니다',
  '사진관-12년-ai-증명사진-앱개발',
  '사진관-가기-전에-꼭-읽어야-할-취준생-헤어메이크업-가이드-2026',
  '제목-증명사진에서-빛나는-메이크업-비법',
  '증명사진-메이크업-취업-여권-비자-한-장의-사진이-첫인상을-결정한다',
  '증명사진-면접-헤어에-도움이-되는-자연스러운-볼륨-살리는-방법',
  '증명사진-잘-나오는-표정-포즈-연습법-첫인상은-표정이-만든다',
  '증명사진-헤어스타일링-메이크업-다음은-헤어-인상을-완성하는-마지막-한-수',
  '취업-증명사진-의상-컬러-선택법-옷-한-벌이-당락을-바꾼다',
  '한-연구원-매거진-취업사진과-면접에-필요한-의상-면접머리-자신감의-시작은-나다운-모습',
  '한번쯤-고민하게-되는-아기-여권사진-사진관-안-가도-집에서-찍은-이야기',
  '한번쯤-고민하게-되는-아기-여권사진-사진관-안-가도-집에서-찍은-이야기-mmxg1mrn',
];

function hasKorean(str) {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(str);
}

async function generateEnglishSlug(title) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: `You are an SEO expert. First TRANSLATE the blog title meaning into English, then convert it to a URL slug.

Rules:
- Translate the MEANING to English (do NOT romanize Korean)
- Use only lowercase letters, numbers, and hyphens
- Max 60 characters
- Must be descriptive and SEO-friendly in English
- Return ONLY the slug, nothing else

Examples:
- "증명사진 메이크업 비법" → "id-photo-makeup-tips"
- "AI 증명사진 서비스 후기" → "ai-id-photo-service-review"
- "취업 면접 헤어스타일 가이드" → "job-interview-hairstyle-guide"

Title: ${title}` }] }],
    config: { maxOutputTokens: 64, temperature: 0.1 },
  });
  const slug = (response.candidates?.[0]?.content?.parts?.[0]?.text || '')
    .trim().toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
  if (slug.length >= 3) return slug;
  throw new Error('slug 생성 결과가 너무 짧음');
}

const TRANSLATE_PROMPT = {
  ja: `あなたは韓国語→日本語の専門翻訳者です。
以下のブログ記事を自然な日本語に翻訳してください。
- マークダウン書式はそのまま維持
- 技術用語は適切な日本語表現に
- SEOを意識した自然な文体
- タイトルと本文を両方翻訳
- 画像マークダウン ![alt](URL) は絶対に削除・変更しないこと。URLはそのまま保持`,

  en: `You are a professional Korean→English translator.
Translate the following blog post into natural English.
- Keep markdown formatting intact
- Use appropriate English technical terms
- Write in an SEO-friendly, natural tone
- Translate both title and body
- NEVER remove or modify image markdown ![alt](URL). Preserve all image URLs exactly as-is`,
};

const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内、SEO用)", "tags": ["日本語タグ1", "日本語タグ2", "日本語タグ3"]}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars, for SEO)", "tags": ["English tag1", "English tag2", "English tag3"]}`,
};

async function translatePost(originalDoc, lang) {
  const originalTags = (originalDoc.tags || []).join(', ');
  const prompt = `${TRANSLATE_PROMPT[lang]}

Original tags for reference: ${originalTags}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang]}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      maxOutputTokens: 8192,
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('빈 응답');

  const translated = JSON.parse(text);

  if (translated.title === originalDoc.title) {
    throw new Error('원문 그대로 반환됨');
  }

  // 이미지 보존 검증
  const originalImages = (originalDoc.content.match(/!\[.*?\]\(.*?\)/g) || []);
  const translatedImages = (translated.content.match(/!\[.*?\]\(.*?\)/g) || []);

  if (originalImages.length > translatedImages.length) {
    const missingImages = originalImages.filter(img => {
      const url = img.match(/\((.*?)\)/)?.[1];
      return url && !translated.content.includes(url);
    });
    if (missingImages.length > 0) {
      translated.content += '\n\n' + missingImages.join('\n\n');
      console.log(`    이미지 ${missingImages.length}개 복원`);
    }
  }

  return translated;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`\n========================================`);
  console.log(`  교차오염 원본 17건 재번역`);
  console.log(`  모드: ${execute ? '⚠️  EXECUTE (실제 번역+저장)' : '🔍 DRY RUN (대상 목록만)'}`);
  console.log(`========================================\n`);

  let jaOk = 0, enOk = 0, errors = 0;
  const createdDocs = [];

  for (let i = 0; i < TARGET_SLUGS.length; i++) {
    const slug = TARGET_SLUGS[i];
    console.log(`[${i + 1}/17] ${slug}`);

    const doc = await blogCollection.doc(slug).get();
    if (!doc.exists) {
      console.log(`  ❌ 원본 doc 없음 — 스킵\n`);
      errors++;
      continue;
    }

    const data = doc.data();
    console.log(`  제목: ${data.title}`);
    console.log(`  lang: ${data.lang || 'ko'}, published: ${data.published}`);

    // 영문 base slug 생성
    let baseSlug;
    if (data.baseSlug && !hasKorean(data.baseSlug)) {
      baseSlug = data.baseSlug;
      console.log(`  baseSlug (기존): ${baseSlug}`);
    } else {
      try {
        baseSlug = await generateEnglishSlug(data.title);
        console.log(`  baseSlug (AI 생성): ${baseSlug}`);
      } catch (err) {
        console.log(`  ❌ baseSlug 생성 실패: ${err.message} — 스킵\n`);
        errors++;
        continue;
      }
    }

    if (hasKorean(baseSlug)) {
      console.log(`  ❌ baseSlug에 한글 잔존 — 스킵\n`);
      errors++;
      continue;
    }

    if (!execute) {
      console.log(`  → 생성 예정: ${baseSlug}-ja, ${baseSlug}-en\n`);
      continue;
    }

    // 번역 실행
    for (const lang of ['ja', 'en']) {
      const translatedSlug = `${baseSlug}-${lang}`;
      try {
        console.log(`  → ${lang} 번역 중...`);
        const translated = await translatePost(data, lang);

        const existingDoc = await blogCollection.doc(translatedSlug).get();
        const now = new Date().toISOString();

        if (existingDoc.exists) {
          await blogCollection.doc(translatedSlug).update({
            title: translated.title,
            content: translated.content,
            summary: (translated.summary || '').substring(0, 160),
            thumbnail: data.thumbnail || '',
            tags: translated.tags && translated.tags.length > 0 ? translated.tags : (data.tags || []),
            published: data.published || false,
            updatedAt: now,
            translatedAt: now,
            autoTranslated: true,
          });
          console.log(`  ✅ ${lang} 업데이트: ${translatedSlug}`);
        } else {
          await blogCollection.doc(translatedSlug).set({
            slug: translatedSlug,
            baseSlug,
            title: translated.title,
            content: translated.content,
            summary: (translated.summary || '').substring(0, 160),
            thumbnail: data.thumbnail || '',
            tags: translated.tags && translated.tags.length > 0 ? translated.tags : (data.tags || []),
            lang,
            published: data.published || false,
            author: data.author || 'MONKOS',
            createdAt: now,
            updatedAt: now,
            translatedAt: now,
            viewCount: 0,
            originalSlug: baseSlug,
            autoTranslated: true,
          });
          console.log(`  ✅ ${lang} 신규 생성: ${translatedSlug}`);
        }

        createdDocs.push(translatedSlug);
        if (lang === 'ja') jaOk++; else enOk++;
      } catch (err) {
        console.log(`  ❌ ${lang} 실패: ${err.message}`);
        errors++;
      }

      await sleep(DELAY_MS);
    }
    console.log();
  }

  console.log(`\n========================================`);
  console.log(`  결과 요약`);
  console.log(`========================================`);
  console.log(`  JA 성공: ${jaOk}건`);
  console.log(`  EN 성공: ${enOk}건`);
  console.log(`  실패: ${errors}건`);

  if (createdDocs.length > 0) {
    console.log(`\n  생성된 doc ID:`);
    for (const id of createdDocs) {
      console.log(`    ${id}`);
    }
  }

  if (!execute) {
    console.log(`\n🔍 DRY RUN 완료. 실행하려면:`);
    console.log(`   node scripts/retranslate_crosscontamination.js --execute\n`);
  }
}

main().catch(err => {
  console.error('❌ 치명적 에러:', err.message);
  process.exit(1);
});
