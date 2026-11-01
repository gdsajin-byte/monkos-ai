/**
 * CMS AI 핸들러 — 이미지 생성 / OG 썸네일 / SEO 제안
 * Phase 1: 버튼 트리거 방식
 */
import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '@google-cloud/storage';
import { ai, aiImage, CMS_IMAGE_MODEL, TEXT_MODEL, GCS_BUCKET, log, parseJsonBody } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { generateSlug } from './slug.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function uploadToGcs(buffer, gcsPath, contentType, metadata = {}) {
  const file = bucket.file(gcsPath);
  await file.save(buffer, {
    metadata: { contentType, metadata },
    public: true,
  });
  return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
}

const STYLE_PROMPTS = {
  photo: 'professional photograph, realistic, high quality, natural lighting',
  illustration: 'digital illustration, artistic, vibrant colors, stylized',
  minimal: 'minimalist design, clean lines, simple shapes, modern, flat style',
  diagram: 'infographic diagram, clean layout, labeled, educational',
};

// POST /api/admin/ai/image — 맥락 이미지 생성
export async function handleAiImage(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const { title, content, category, style } = await parseJsonBody(req);
    if (!title) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '제목은 필수입니다' }));
    }

    const styleHint = STYLE_PROMPTS[style] || STYLE_PROMPTS.photo;
    const snippet = (content || '').substring(0, 500);

    // ① Gemini 2.5 Flash로 이미지 프롬프트 생성
    const promptResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text:
        `You are an expert image prompt engineer for Imagen 4. Generate a single English image generation prompt based on:
Title: ${title}
Content keywords: ${snippet}
Category: ${category || 'general'}
Style: ${styleHint}

Rules:
- FIRST determine: is this article about PEOPLE (portraits, faces, human subjects) or about THINGS/CONCEPTS (objects, backgrounds, guides, processes, abstract ideas)?
- If about THINGS/CONCEPTS: absolutely NO people, NO faces, NO human figures. Focus purely on the subject matter (objects, colors, patterns, diagrams, spaces)
- If about PEOPLE: people are acceptable but use generic/diverse representations, never specific real individuals
- Output ONLY the prompt text, nothing else
- Max 200 words
- Be specific and visual
- Include style direction: ${styleHint}
- Do NOT include text/typography/words in the image` }] }],
      config: { maxOutputTokens: 256, temperature: 0.7 },
    });
    const generatedPrompt = (promptResponse.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    if (!generatedPrompt) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '프롬프트 생성 실패' }));
    }
    log(`[AI] 이미지 프롬프트: ${generatedPrompt.substring(0, 100)}...`);

    // ② Gemini 이미지 모델로 생성 (2026-08-27: Imagen 4 폐지 대응)
    // generateImages()는 Imagen 전용 API라 Gemini 이미지 모델에는 쓸 수 없다 → generateContent
    const imgResponse = await aiImage.models.generateContent({
      model: CMS_IMAGE_MODEL,
      contents: [{ role: 'user', parts: [{ text: generatedPrompt }] }],
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    const imageBytes = imgResponse.candidates?.[0]?.content?.parts
      ?.find((p) => p.inlineData)?.inlineData?.data;
    if (!imageBytes) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미지 생성 실패' }));
    }
    const imageBuffer = Buffer.from(imageBytes, 'base64');

    // ③ sharp로 JPEG 85% 변환
    const jpegBuffer = await sharp(imageBuffer).jpeg({ quality: 85 }).toBuffer();

    // ④ GCS 업로드
    const timestamp = Date.now();
    const slug = generateSlug(title);
    const gcsPath = `blog/ai_${timestamp}_${slug}.jpg`;
    const url = await uploadToGcs(jpegBuffer, gcsPath, 'image/jpeg', {
      source: 'ai-generate',
      model: CMS_IMAGE_MODEL,
      prompt: generatedPrompt.substring(0, 500),
    });
    log(`[AI] 이미지 생성 완료: ${gcsPath} (${(jpegBuffer.length / 1024).toFixed(1)}KB)`);

    // ⑤ URL 반환
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url }));
  } catch (err) {
    log(`[AI] 이미지 생성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

// POST /api/admin/ai/thumbnail — OG 썸네일 자동 생성
export async function handleAiThumbnail(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const { title, category, backgroundUrl } = await parseJsonBody(req);
    if (!title) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '제목은 필수입니다' }));
    }

    let background;

    if (backgroundUrl) {
      // 배경 이미지: fetch → 리사이즈 + 블러
      const bgRes = await fetch(backgroundUrl);
      if (!bgRes.ok) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '배경 이미지 로드 실패' }));
      }
      const bgBuffer = Buffer.from(await bgRes.arrayBuffer());
      background = await sharp(bgBuffer)
        .resize(1200, 630, { fit: 'cover' })
        .blur(12)
        .toBuffer();
    } else {
      // 브랜드 그래디언트 SVG
      const gradientSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="50%" style="stop-color:#16213e"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
</svg>`;
      background = await sharp(Buffer.from(gradientSvg)).png().toBuffer();
    }

    // 텍스트 레이어: 제목 (최대 2줄, 줄당 20자)
    const maxChars = 20;
    const lines = [];
    let remaining = title.substring(0, 60);
    while (remaining.length > 0 && lines.length < 2) {
      lines.push(remaining.substring(0, maxChars));
      remaining = remaining.substring(maxChars);
    }
    if (remaining.length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1].substring(0, maxChars - 1) + '…';
    }

    const textLines = lines.map((line, i) =>
      `<text x="100" y="${300 + i * 64}" font-size="48" fill="white" font-family="sans-serif" font-weight="bold">${escapeXml(line)}</text>`
    ).join('\n    ');

    const categoryBadge = category
      ? `<rect x="100" y="${300 + lines.length * 64 + 10}" width="${category.length * 18 + 24}" height="32" rx="6" fill="rgba(255,255,255,0.2)"/>
    <text x="112" y="${300 + lines.length * 64 + 33}" font-size="16" fill="white" font-family="sans-serif">${escapeXml(category)}</text>`
      : '';

    const svgOverlay = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="rgba(0,0,0,0.45)"/>
  ${textLines}
  ${categoryBadge}
  <text x="1100" y="590" font-size="18" fill="rgba(255,255,255,0.6)" font-family="sans-serif" text-anchor="end">MONKOS</text>
</svg>`;

    const result = await sharp(background)
      .resize(1200, 630, { fit: 'cover' })
      .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toBuffer();

    const timestamp = Date.now();
    const slug = generateSlug(title);
    const gcsPath = `blog/og_${timestamp}_${slug}.jpg`;
    const url = await uploadToGcs(result, gcsPath, 'image/jpeg', {
      source: 'ai-thumbnail',
      dimensions: '1200x630',
    });
    log(`[AI] OG 썸네일 생성: ${gcsPath} (${(result.length / 1024).toFixed(1)}KB)`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url }));
  } catch (err) {
    log(`[AI] 썸네일 생성 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}

// POST /api/admin/ai/suggest — SEO 메타 자동 제안
export async function handleAiSuggest(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const { title, content } = await parseJsonBody(req);
    if (!title) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '제목은 필수입니다' }));
    }

    const snippet = (content || '').substring(0, 1000);
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{ role: 'user', parts: [{ text:
        `You are an SEO expert for a Korean photo studio and AI service blog.
Given the blog post below, generate:
1. summary: A compelling meta description in Korean, max 160 characters
2. tags: Exactly 5 relevant tags in Korean, comma separated
3. og_title: An optimized Open Graph title in Korean, max 60 characters

Title: ${title}
Content: ${snippet}

Respond in JSON format ONLY:
{"summary": "...", "tags": "...", "ogTitle": "..."}` }] }],
      config: { maxOutputTokens: 2048, temperature: 0.3, responseMimeType: 'application/json' },
    });

    const raw = (response.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'AI 응답 파싱 실패', raw }));
    }

    log(`[AI] SEO 제안 완료: ${title.substring(0, 30)}...`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      summary: parsed.summary || '',
      tags: parsed.tags || '',
      ogTitle: parsed.ogTitle || parsed.og_title || '',
    }));
  } catch (err) {
    log(`[AI] SEO 제안 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '처리 중 오류가 발생했습니다', code: 'INTERNAL_ERROR' }));
  }
}
