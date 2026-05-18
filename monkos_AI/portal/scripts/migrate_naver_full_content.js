/**
 * 네이버 블로그 풀 콘텐츠 복구 + GCS 이미지 마이그레이션
 *
 * Usage:
 *   node scripts/migrate_naver_full_content.js --mode dry-run
 *   node scripts/migrate_naver_full_content.js --mode sample
 *   node scripts/migrate_naver_full_content.js --mode execute
 */
import { firestore, ai, GCS_BUCKET, log } from '../lib/shared/config.js';
import { Storage } from '@google-cloud/storage';

const BLOG_ID = 'monkos_ai';
const DELAY_MS = 500;
const blogCollection = firestore.collection('blog_posts');
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

const TARGETS = [
  { slug: '20년-사진작가가-ai로-만든-증명사진-서비스-monkosai', postId: '224205217406' },
  { slug: 'ai에-대한-서론', postId: '224208819507' },
  { slug: 'monkos-ai-가-탄생했습니다', postId: '224207774594' },
  { slug: 'untitled-mmqwqq8i', postId: '224212381294' },
  { slug: '내-손안에-사진관-monkosai-사용법을-소개합니다', postId: '224211381938' },
  { slug: '사진관-12년-ai-증명사진-앱개발', postId: '224214961687' },
  { slug: '사진관-가기-전에-꼭-읽어야-할-취준생-헤어메이크업-가이드-2026', postId: '224206455566' },
  { slug: '증명사진-메이크업-취업-여권-비자-한-장의-사진이-첫인상을-결정한다', postId: '224218124408' },
  { slug: '증명사진-면접-헤어에-도움이-되는-자연스러운-볼륨-살리는-방법', postId: '224211046452' },
  { slug: '증명사진-잘-나오는-표정-포즈-연습법-첫인상은-표정이-만든다', postId: '224214915289' },
  { slug: '증명사진-헤어스타일-메이크업-다음은-헤어-인상을-완성하는-마지막-한-수', postId: '224219451990' },
  { slug: '취업-증명사진-의상-컬러-선택법-옷-한-벌이-당락을-바꾼다-mmxg1kyp', postId: '224222179689' },
  { slug: '한-연구원-매거진-취업사진과-면접에-필요한-의상-면접머리-자신감의-시작은-나다운-모습', postId: '224213679058' },
  { slug: '한번쯤-고민하게-되는-아기-여권사진-사진관-안-가도-집에서-찍은-이야기-mmxg1mrn', postId: '224220766870' },
  { slug: '한연구원-칼럼-증명사진-면접헤어메이크업에-중요한-각질제거-청결-신뢰감의-시작', postId: '224212369501' },
];

// --- 크롤링 (naver.js fetchMobileContent 재활용) ---
async function fetchMobileContent(postId) {
  const url = `https://m.blog.naver.com/${BLOG_ID}/${postId}`;
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();

    // SmartEditor 3/4 — indexOf 방식 (정규식은 중첩 div에서 조기 종료됨)
    const seStart = html.indexOf('<div class="se-main-container">');
    if (seStart !== -1) {
      const contentStart = seStart + '<div class="se-main-container">'.length;
      // _checkVisible div가 본문 직후에 위치
      let contentEnd = html.indexOf('<div class="_checkVisible">', contentStart);
      if (contentEnd === -1) contentEnd = html.indexOf('</div></div></div>', contentStart);
      if (contentEnd !== -1) {
        // 말미 닫는 태그 정리
        let content = html.substring(contentStart, contentEnd).replace(/(<\/div>\s*){1,4}$/, '');
        if (content.trim()) return content;
      }
    }

    // SmartEditor 2
    let match = html.match(/<div[^>]*id="postViewArea"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/);
    if (match) return match[1];

    // og:description fallback
    match = html.match(/<meta property="og:description" content="([^"]*)"/);
    if (match) return match[1];
  } catch (err) {
    log(`[마이그레이션] 모바일 fetch 실패 (${postId}): ${err.message}`, 'WARNING');
  }
  return null;
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

// HTML → 마크다운 변환
function htmlToMarkdown(html) {
  if (!html) return '';
  let md = html;
  // 이미지 (data-lazy-src 우선 — 원본 해상도, blur 썸네일 src 무시)
  md = md.replace(/<img[^>]*data-lazy-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (_, src, alt) => `![${alt}](${src.replace(/\?type=\w+$/, '')})`);
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*data-lazy-src="([^"]*)"[^>]*>/gi, (_, alt, src) => `![${alt}](${src.replace(/\?type=\w+$/, '')})`);
  md = md.replace(/<img[^>]*data-lazy-src="([^"]*)"[^>]*>/gi, (_, src) => `![](${src.replace(/\?type=\w+$/, '')})`);
  // data-lazy-src 없는 img fallback
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');
  // 헤더
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  // Bold/Italic
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  // 링크
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
  // 줄바꿈/단락
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n\n');
  md = md.replace(/<p[^>]*>/gi, '');
  md = md.replace(/<\/div>/gi, '\n');
  md = md.replace(/<div[^>]*>/gi, '');
  // 리스트
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
  md = md.replace(/<\/?[uo]l[^>]*>/gi, '\n');
  // 나머지 태그 제거
  md = md.replace(/<[^>]*>/g, '');
  // 엔티티
  md = md.replace(/&amp;/g, '&');
  md = md.replace(/&lt;/g, '<');
  md = md.replace(/&gt;/g, '>');
  md = md.replace(/&quot;/g, '"');
  md = md.replace(/&#39;/g, "'");
  md = md.replace(/&nbsp;/g, ' ');
  // 빈 줄 정리
  md = md.replace(/\n{3,}/g, '\n\n');
  return md.trim();
}

// 콘텐츠에서 이미지 URL 추출 (data-lazy-src 우선 — 원본 해상도)
function extractImageUrls(content) {
  const urls = new Set();
  // data-lazy-src (네이버 SE4 원본 이미지)
  for (const m of content.matchAll(/data-lazy-src="([^"]*)"[^>]*>/gi)) {
    // ?type=w400 등 리사이즈 파라미터 제거
    urls.add(m[1].replace(/\?type=\w+$/, ''));
  }
  // src fallback
  for (const m of content.matchAll(/<img[^>]*src="([^"]*)"[^>]*>/gi)) {
    const url = m[1].replace(/\?type=\w+$/, '');
    if (!url.includes('type=w80_blur')) urls.add(url);
  }
  // markdown 이미지
  for (const m of content.matchAll(/!\[.*?\]\((.*?)\)/g)) urls.add(m[1]);
  return [...urls];
}

// --- GCS 이미지 마이그레이션 ---
async function downloadImage(url) {
  // mblogthumb-phinf는 ?type= 없이 404 → postfiles 도메인으로 교체
  const tryUrls = [url];
  if (url.includes('mblogthumb-phinf.pstatic.net')) {
    tryUrls.unshift(url.replace('mblogthumb-phinf.pstatic.net', 'postfiles.pstatic.net'));
  } else if (url.includes('blogthumb.pstatic.net')) {
    tryUrls.unshift(url.replace('blogthumb.pstatic.net', 'postfiles.pstatic.net'));
  }

  for (const tryUrl of tryUrls) {
    try {
      // 지시서: Referer 헤더 절대 붙이지 말 것
      const res = await fetch(tryUrl, {
        headers: { 'User-Agent': HEADERS['User-Agent'] },
      });
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get('content-type') || 'image/jpeg';
      return { buffer, contentType };
    } catch (err) {
      continue;
    }
  }
  log(`[마이그레이션] 이미지 다운로드 실패: ${url.substring(0, 80)}`, 'WARNING');
  return null;
}

async function uploadToGCS(slug, filename, buffer, contentType) {
  const gcsPath = `blog/${slug}/${filename}`;
  const file = bucket.file(gcsPath);
  await file.save(buffer, {
    metadata: { contentType },
    public: true,
  });
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
}

// --- Gemini 변주 ---
const REWRITE_PROMPT = `당신은 전문 에디터입니다. 아래 블로그 글을 리라이팅하세요.

규칙:
- 원본의 정보, 구조, 논리 흐름을 100% 보존
- 문장 구조와 표현을 자연스럽게 재구성 (동의어 치환, 어순 변경, 문장 분할/결합)
- 전문 용어, 브랜드명(MONKOS, Monkos.ai), 고유명사는 그대로 유지
- 원본 문체(톤앤매너) 유지
- 이미지 마크다운 ![alt](URL)은 절대 수정하지 말 것
- 마크다운 형식으로 출력

JSON 형식으로 응답:
{"title": "리라이팅된 제목", "content": "리라이팅된 본문(마크다운)", "summary": "요약(160자 이내)"}`;

async function rewriteWithGemini(title, markdownContent, retries = 2) {
  const prompt = `${REWRITE_PROMPT}

---
# ${title}

${markdownContent}
---`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          maxOutputTokens: 8192,
          temperature: attempt === 0 ? 0.3 : 0.1,
          responseMimeType: 'application/json',
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Gemini 빈 응답');
      return JSON.parse(text);
    } catch (err) {
      if (attempt < retries && (err.message.includes('JSON') || err.message.includes('position'))) {
        log(`[마이그레이션] Gemini JSON 에러, 재시도 ${attempt + 1}/${retries}`, 'WARNING');
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      throw err;
    }
  }
}

// ============================
// Mode: dry-run
// ============================
async function dryRun() {
  console.log('\n=== DRY-RUN: 15건 크롤링 + 글자수 비교 ===\n');
  const results = [];

  for (const target of TARGETS) {
    const doc = await blogCollection.doc(target.slug).get();
    const currentContent = doc.exists ? (doc.data().content || '') : '';
    const currentChars = stripHtml(currentContent).length;

    const fullHtml = await fetchMobileContent(target.postId);
    const fullChars = fullHtml ? stripHtml(fullHtml).length : 0;
    const ratio = fullChars > 0 ? ((currentChars / fullChars) * 100).toFixed(1) : '0';

    results.push({
      slug: target.slug,
      current: currentChars,
      full: fullChars,
      ratio,
      ok: !!fullHtml,
    });

    console.log(`  ${results.length}/15  ${target.slug.substring(0, 40)}  현재=${currentChars}  원문=${fullChars}  (${ratio}%)`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  // 비교표
  console.log('\n| # | slug | 현재 | 원문 | 비율 | 상태 |');
  console.log('|---|------|------|------|------|------|');
  results.forEach((r, i) => {
    console.log(`| ${i + 1} | ${r.slug.substring(0, 45)} | ${r.current} | ${r.full} | ${r.ratio}% | ${r.ok ? '✅' : '❌'} |`);
  });

  // pstatic 이미지 현황
  let totalPstatic = 0;
  for (const target of TARGETS) {
    const doc = await blogCollection.doc(target.slug).get();
    if (doc.exists) {
      const d = doc.data();
      const all = (d.content || '') + ' ' + (d.thumbnail || '');
      const m = all.match(/pstatic\.net/g);
      if (m) totalPstatic += m.length;
    }
  }
  console.log(`\n기존 Firestore pstatic.net 이미지 참조: ${totalPstatic}건`);
}

// ============================
// Mode: sample (1~2건 변주 테스트)
// ============================
async function sampleRun() {
  console.log('\n=== SAMPLE: 2건 Gemini 변주 테스트 ===\n');
  const samples = TARGETS.slice(0, 2);

  for (const target of samples) {
    console.log(`\n--- ${target.slug} ---`);
    const fullHtml = await fetchMobileContent(target.postId);
    if (!fullHtml) { console.log('  ❌ 크롤링 실패'); continue; }

    const markdown = htmlToMarkdown(fullHtml);
    const images = extractImageUrls(fullHtml);
    console.log(`  크롤링: ${stripHtml(fullHtml).length}자 / 마크다운: ${markdown.length}자 / 이미지: ${images.length}개`);

    const doc = await blogCollection.doc(target.slug).get();
    const title = doc.exists ? doc.data().title : target.slug;

    console.log('  Gemini 변주 중...');
    const rewritten = await rewriteWithGemini(title, markdown);
    console.log(`  변주 결과 — 제목: ${rewritten.title}`);
    console.log(`  본문: ${rewritten.content.length}자 / 요약: ${rewritten.summary}`);
    console.log(`  미리보기 (500자):\n${rewritten.content.substring(0, 500)}\n`);

    await new Promise(r => setTimeout(r, DELAY_MS));
  }
}

// ============================
// Mode: execute (전체 실행)
// ============================
async function executeAll() {
  console.log('\n=== EXECUTE: 전체 실행 (Phase 1~3) ===\n');

  const imageCache = new Map();
  const stats = { crawled: 0, rewritten: 0, images: 0, updated: 0, errors: [] };

  for (const target of TARGETS) {
    try {
      console.log(`\n[${stats.crawled + 1}/15] ${target.slug}`);

      // Phase 1: 크롤링 + 변주
      const fullHtml = await fetchMobileContent(target.postId);
      if (!fullHtml) { stats.errors.push(`${target.slug}: 크롤링 실패`); continue; }
      stats.crawled++;

      const markdown = htmlToMarkdown(fullHtml);
      const doc = await blogCollection.doc(target.slug).get();
      const existing = doc.exists ? doc.data() : {};
      const title = existing.title || target.slug;
      console.log(`  크롤링: ${stripHtml(fullHtml).length}자`);

      console.log('  Gemini 변주 중...');
      const rewritten = await rewriteWithGemini(title, markdown);
      stats.rewritten++;
      console.log(`  변주: ${rewritten.content.length}자`);

      // Phase 2: pstatic 이미지 → GCS
      const allContent = fullHtml + ' ' + (existing.content || '') + ' ' + (existing.thumbnail || '');
      const pstaticUrls = extractImageUrls(allContent).filter(u => u.includes('pstatic.net'));
      let updatedContent = rewritten.content;
      let updatedThumbnail = existing.thumbnail || '';

      for (const imgUrl of pstaticUrls) {
        if (imageCache.has(imgUrl)) {
          const gcs = imageCache.get(imgUrl);
          updatedContent = updatedContent.split(imgUrl).join(gcs);
          if (updatedThumbnail.includes(imgUrl)) updatedThumbnail = gcs;
          continue;
        }
        const imgData = await downloadImage(imgUrl);
        if (!imgData) continue;

        const filename = new URL(imgUrl).pathname.split('/').pop() || `img_${Date.now()}.jpg`;
        const gcsUrl = await uploadToGCS(target.slug, filename, imgData.buffer, imgData.contentType);
        imageCache.set(imgUrl, gcsUrl);
        stats.images++;
        updatedContent = updatedContent.split(imgUrl).join(gcsUrl);
        if (updatedThumbnail.includes(imgUrl)) updatedThumbnail = gcsUrl;
        console.log(`  이미지: ${filename}`);
        await new Promise(r => setTimeout(r, 200));
      }

      // Phase 3: Firestore 업데이트
      const now = new Date().toISOString();
      await blogCollection.doc(target.slug).update({
        title: rewritten.title,
        content: updatedContent,
        summary: (rewritten.summary || '').substring(0, 160),
        thumbnail: updatedThumbnail || existing.thumbnail || '',
        updatedAt: now,
      });
      stats.updated++;
      console.log('  ✅ Firestore 업데이트 완료');

      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      stats.errors.push(`${target.slug}: ${err.message}`);
      console.log(`  ❌ ${err.message}`);
    }
  }

  // 결과 요약
  console.log('\n=== 실행 결과 ===');
  console.log(`크롤링: ${stats.crawled}/15`);
  console.log(`변주: ${stats.rewritten}/15`);
  console.log(`이미지 업로드: ${stats.images}건`);
  console.log(`Firestore 업데이트: ${stats.updated}/15`);
  if (stats.errors.length) {
    console.log(`에러: ${stats.errors.length}건`);
    stats.errors.forEach(e => console.log(`  - ${e}`));
  }

  // pstatic 잔여 확인
  let remaining = 0;
  for (const target of TARGETS) {
    const doc = await blogCollection.doc(target.slug).get();
    if (doc.exists) {
      const d = doc.data();
      if (((d.content || '') + ' ' + (d.thumbnail || '')).includes('pstatic.net')) remaining++;
    }
  }
  console.log(`pstatic.net 잔여: ${remaining}건`);
}

// ============================
// Mode: fix-pstatic (잔여 pstatic URL GCS 마이그레이션)
// ============================
async function fixPstatic() {
  console.log('\n=== FIX-PSTATIC: Firestore 내 잔여 pstatic URL → GCS 마이그레이션 ===\n');

  const imageCache = new Map();
  let fixed = 0, imgCount = 0;

  for (const target of TARGETS) {
    const doc = await blogCollection.doc(target.slug).get();
    if (!doc.exists) continue;
    const data = doc.data();
    let content = data.content || '';
    let thumbnail = data.thumbnail || '';
    const allText = content + ' ' + thumbnail;

    if (!allText.includes('pstatic.net')) continue;

    console.log(`\n[fix] ${target.slug}`);

    // content 내 pstatic URL 추출 (마크다운 이미지 + 잔여 HTML img)
    const pstaticUrls = new Set();
    for (const m of allText.matchAll(/https?:\/\/[^\s"')]*pstatic\.net[^\s"')]*(?:\.(jpg|jpeg|png|gif|webp|PNG|JPEG))[^\s"')]*/gi)) {
      // ?type= 파라미터 제거
      pstaticUrls.add(m[0].replace(/\?type=\w+$/, ''));
    }
    if (thumbnail.includes('pstatic.net')) {
      pstaticUrls.add(thumbnail.replace(/\?type=\w+$/, ''));
    }

    console.log(`  pstatic URL: ${pstaticUrls.size}개`);

    for (const imgUrl of pstaticUrls) {
      if (imageCache.has(imgUrl)) {
        const gcs = imageCache.get(imgUrl);
        content = content.split(imgUrl).join(gcs);
        // ?type= 변형도 치환
        content = content.replace(new RegExp(imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?type=\\w+', 'g'), gcs);
        if (thumbnail.includes(imgUrl)) thumbnail = gcs;
        continue;
      }

      const imgData = await downloadImage(imgUrl);
      if (!imgData) {
        console.log(`  ⚠️ 다운로드 실패: ${imgUrl.substring(0, 80)}`);
        continue;
      }

      const filename = new URL(imgUrl).pathname.split('/').pop() || `img_${Date.now()}.jpg`;
      const gcsUrl = await uploadToGCS(target.slug, filename, imgData.buffer, imgData.contentType);
      imageCache.set(imgUrl, gcsUrl);
      imgCount++;

      // 원본 URL과 ?type= 변형 모두 치환
      content = content.split(imgUrl).join(gcsUrl);
      content = content.replace(new RegExp(imgUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?type=\\w+', 'g'), gcsUrl);
      if (thumbnail.includes(imgUrl)) thumbnail = gcsUrl;
      console.log(`  이미지: ${filename} → GCS`);
      await new Promise(r => setTimeout(r, 200));
    }

    // Firestore 업데이트
    await blogCollection.doc(target.slug).update({
      content,
      thumbnail,
      updatedAt: new Date().toISOString(),
    });
    fixed++;
    console.log('  ✅ 업데이트 완료');
  }

  // 최종 잔여 확인
  let remaining = 0;
  for (const target of TARGETS) {
    const doc = await blogCollection.doc(target.slug).get();
    if (doc.exists) {
      const d = doc.data();
      if (((d.content || '') + ' ' + (d.thumbnail || '')).includes('pstatic.net')) remaining++;
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`수정: ${fixed}건 / 이미지 업로드: ${imgCount}건`);
  console.log(`pstatic.net 잔여: ${remaining}건`);
}

// ============================
// Mode: retry-failed (실패 2건 재시도)
// ============================
async function retryFailed() {
  const failedSlugs = ['monkos-ai-가-탄생했습니다', 'untitled-mmqwqq8i'];
  const failedTargets = TARGETS.filter(t => failedSlugs.includes(t.slug));

  console.log('\n=== RETRY: 실패 2건 재시도 ===\n');
  const imageCache = new Map();

  for (const target of failedTargets) {
    try {
      console.log(`\n[retry] ${target.slug}`);
      const fullHtml = await fetchMobileContent(target.postId);
      if (!fullHtml) { console.log('  ❌ 크롤링 실패'); continue; }

      const markdown = htmlToMarkdown(fullHtml);
      const doc = await blogCollection.doc(target.slug).get();
      const existing = doc.exists ? doc.data() : {};
      const title = existing.title || target.slug;
      console.log(`  크롤링: ${stripHtml(fullHtml).length}자`);

      console.log('  Gemini 변주 중 (재시도 포함)...');
      const rewritten = await rewriteWithGemini(title, markdown);
      console.log(`  변주: ${rewritten.content.length}자`);

      // pstatic → GCS
      const allContent = fullHtml + ' ' + (existing.content || '') + ' ' + (existing.thumbnail || '');
      const pstaticUrls = extractImageUrls(allContent).filter(u => u.includes('pstatic.net'));
      let updatedContent = rewritten.content;
      let updatedThumbnail = existing.thumbnail || '';

      for (const imgUrl of pstaticUrls) {
        if (imageCache.has(imgUrl)) {
          const gcs = imageCache.get(imgUrl);
          updatedContent = updatedContent.split(imgUrl).join(gcs);
          if (updatedThumbnail.includes(imgUrl)) updatedThumbnail = gcs;
          continue;
        }
        const imgData = await downloadImage(imgUrl);
        if (!imgData) continue;
        const filename = new URL(imgUrl).pathname.split('/').pop() || `img_${Date.now()}.jpg`;
        const gcsUrl = await uploadToGCS(target.slug, filename, imgData.buffer, imgData.contentType);
        imageCache.set(imgUrl, gcsUrl);
        updatedContent = updatedContent.split(imgUrl).join(gcsUrl);
        if (updatedThumbnail.includes(imgUrl)) updatedThumbnail = gcsUrl;
        console.log(`  이미지: ${filename}`);
        await new Promise(r => setTimeout(r, 200));
      }

      const now = new Date().toISOString();
      await blogCollection.doc(target.slug).update({
        title: rewritten.title,
        content: updatedContent,
        summary: (rewritten.summary || '').substring(0, 160),
        thumbnail: updatedThumbnail || existing.thumbnail || '',
        updatedAt: now,
      });
      console.log('  ✅ Firestore 업데이트 완료');

      await new Promise(r => setTimeout(r, DELAY_MS));
    } catch (err) {
      console.log(`  ❌ ${err.message}`);
    }
  }
}

// --- Main ---
const args = process.argv.slice(2);
let mode = 'dry-run';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--mode' && args[i + 1]) mode = args[i + 1];
  else if (args[i].startsWith('--mode=')) mode = args[i].split('=')[1];
}

console.log(`[마이그레이션] 모드: ${mode}`);

if (mode === 'dry-run') await dryRun();
else if (mode === 'sample') await sampleRun();
else if (mode === 'execute') await executeAll();
else if (mode === 'retry-failed') await retryFailed();
else if (mode === 'fix-pstatic') await fixPstatic();
else console.log('사용법: node scripts/migrate_naver_full_content.js --mode [dry-run|sample|execute|retry-failed|fix-pstatic]');

process.exit(0);
