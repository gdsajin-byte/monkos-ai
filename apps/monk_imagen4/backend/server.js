/**
 * MONKOS Image Engine - Vertex AI Imagen 4 Backend API
 *
 * K-뷰티 특화 이미지 생성 백엔드 서비스
 * - Vertex AI Imagen 4 통합
 * - ADC (Application Default Credentials) 인증
 * - GCS 자동 저장
 * - Cloud Run 최적화
 */

const express = require('express');
const cors = require('cors');
const { PredictionServiceClient } = require('@google-cloud/aiplatform');
const { Storage } = require('@google-cloud/storage');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// 환경 변수
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Vertex AI 클라이언트 초기화 (ADC 자동 사용)
const predictionClient = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
});

// GCS 클라이언트 초기화 (ADC 자동 사용)
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

/**
 * 헬스 체크 엔드포인트
 * Cloud Run 로드밸런서 및 모니터링용
 */
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'MONKOS Image Engine is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    project: PROJECT_ID,
    location: LOCATION
  });
});

/**
 * 이미지 생성 API
 * POST /generate
 *
 * Body:
 * {
 *   "prompt": "A beautiful Korean woman with elegant makeup",
 *   "negativePrompt": "blurry, low quality",
 *   "aspectRatio": "1:1",
 *   "style": "photography",
 *   "numberOfImages": 1,
 *   "saveToGcs": true
 * }
 */
app.post('/generate', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      prompt,
      negativePrompt = '',
      aspectRatio = '1:1',
      style = 'photography',
      numberOfImages = 1,
      saveToGcs = true,
      seed,
      guidanceScale = 7.0,
      safetyFilterLevel = 'block_some'
    } = req.body;

    // 필수 파라미터 검증
    if (!prompt) {
      return res.status(400).json({
        error: 'prompt is required',
        code: 'MISSING_PROMPT'
      });
    }

    console.log(`[Generate] Starting image generation...`);
    console.log(`[Generate] Prompt: ${prompt.substring(0, 100)}...`);
    console.log(`[Generate] Style: ${style}, Aspect Ratio: ${aspectRatio}`);

    // Vertex AI Imagen 4 요청 구성
    const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-4.0-generate-001`;

    const instances = [
      {
        prompt: prompt,
        ...(negativePrompt && { negativePrompt }),
      }
    ];

    const parameters = {
      aspectRatio: aspectRatio,
      numberOfImages: numberOfImages,
      ...(seed && { seed }),
      ...(guidanceScale && { guidanceScale }),
      safetyFilterLevel: safetyFilterLevel,
      personGeneration: 'allow_all', // K-뷰티 인물 생성 허용
      outputMimeType: 'image/jpeg',
      outputCompression: 95
    };

    // Vertex AI 호출
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
      parameters
    });

    if (!response.predictions || response.predictions.length === 0) {
      throw new Error('No images generated');
    }

    const results = [];

    // 각 생성된 이미지 처리
    for (let i = 0; i < response.predictions.length; i++) {
      const prediction = response.predictions[i];
      const imageBytes = prediction.bytesBase64Encoded;

      let gcsUrl = null;

      // GCS 저장 (선택적)
      if (saveToGcs && imageBytes) {
        const timestamp = Date.now();
        const filename = `generated/${timestamp}_${i}.jpg`;
        const file = bucket.file(filename);

        // Base64 디코딩 후 저장
        const buffer = Buffer.from(imageBytes, 'base64');
        await file.save(buffer, {
          metadata: {
            contentType: 'image/jpeg',
            metadata: {
              prompt: prompt.substring(0, 500),
              aspectRatio,
              style,
              generatedAt: new Date().toISOString()
            }
          }
        });

        // Public URL 생성
        gcsUrl = `https://storage.googleapis.com/${GCS_BUCKET}/${filename}`;
        console.log(`[Generate] Saved to GCS: ${gcsUrl}`);
      }

      results.push({
        imageBase64: imageBytes,
        gcsUrl: gcsUrl,
        index: i
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Generate] Completed in ${duration}ms`);

    res.json({
      success: true,
      images: results,
      metadata: {
        prompt,
        negativePrompt,
        aspectRatio,
        style,
        numberOfImages,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[Generate] Error:', error);

    res.status(500).json({
      error: error.message,
      code: error.code || 'GENERATION_FAILED',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * 배치 생성 API (4장 동시 생성)
 * POST /batch-generate
 */
app.post('/batch-generate', async (req, res) => {
  try {
    const { prompt, ...options } = req.body;

    // numberOfImages를 4로 고정
    const batchRequest = {
      ...req.body,
      numberOfImages: 4
    };

    // /generate 로직 재사용
    req.body = batchRequest;
    return app._router.handle(req, res);

  } catch (error) {
    console.error('[Batch Generate] Error:', error);
    res.status(500).json({
      error: error.message,
      code: 'BATCH_GENERATION_FAILED'
    });
  }
});

/**
 * 이미지 리파인 API (I2I / EDIT / UPSCALE)
 * POST /refine
 * CF Functions functions/api/refine.js에서 이관
 * 모델: Gemini 3 Pro Image Preview
 */
app.post('/refine', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const { prompt, config, inputImage, mode } = req.body;

    if (!inputImage) {
      return res.status(400).json({ success: false, error: 'Input image is required' });
    }

    console.log(`[Refine] Mode: ${mode}`);

    // Base64 데이터 추출
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    // 모드별 instruction
    let instruction = '';
    switch (mode) {
      case 'UPSCALE':
        instruction = `[STRICT 4K RECONSTRUCTION] Perform high-fidelity super-resolution on this image. Target 4K resolution. Enhance details, textures, and edges while perfectly preserving the original artistic intent. ${prompt || ''}`;
        break;
      case 'EDIT':
        instruction = `[NEURAL EDITING] Modify the provided image based on these specific instructions: ${prompt}. Blend changes seamlessly.`;
        break;
      case 'I2I':
      default:
        instruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Prompt: ${prompt}`;
        break;
    }

    // Gemini 3 Pro Image Preview (photo.js 정본 패턴 준수)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: instruction }
            ]
          }],
          generationConfig: { imageConfig: {} },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ],
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[Refine] Gemini API error:', errorText);
      return res.status(geminiResponse.status).json({ success: false, error: 'Image refinement failed', details: errorText });
    }

    const result = await geminiResponse.json();
    const parts = result.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(p => p.inlineData);

    if (!imagePart?.inlineData) {
      return res.status(500).json({ success: false, error: 'No image in response. The model might have declined the request.' });
    }

    console.log('[Refine] Image refined successfully');
    res.json({ success: true, image: `data:image/png;base64,${imagePart.inlineData.data}` });

  } catch (error) {
    console.error('[Refine] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 이미지 분석 API
 * POST /analyze
 * CF Functions functions/api/analyze.js에서 이관
 * 모델: Gemini 2.0 Flash
 */
app.post('/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const { imageData } = req.body;

    if (!imageData) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }

    console.log('[Analyze] Analyzing with Gemini Vision...');

    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const mimeTypeMatch = imageData.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              {
                text: `Perform a deep neural analysis of this image. Provide:
1. A detailed English prompt that could recreate this image
2. A description of its artistic style, lighting, and mood
3. Key technical metadata tags

Respond ONLY in valid JSON format with this exact structure:
{
  "prompt": "detailed recreation prompt here",
  "style": "style and lighting description here",
  "tags": ["tag1", "tag2", "tag3"]
}`
              }
            ]
          }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[Analyze] Gemini Vision API error:', errorText);
      return res.status(geminiResponse.status).json({ success: false, error: 'Image analysis failed', details: errorText });
    }

    const result = await geminiResponse.json();
    const textPart = result.candidates?.[0]?.content?.parts?.find(p => p.text);

    if (!textPart?.text) {
      return res.status(500).json({ success: false, error: 'No analysis in response' });
    }

    let analysis;
    try {
      analysis = JSON.parse(textPart.text);
    } catch (e) {
      analysis = { prompt: textPart.text, style: 'Unable to parse', tags: [] };
    }

    console.log('[Analyze] Analysis complete');
    res.json({ success: true, analysis });

  } catch (error) {
    console.error('[Analyze] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 번역 API
 * POST /translate
 * CF Functions functions/api/translate.js에서 이관
 * 모델: Gemini 2.0 Flash
 */
app.post('/translate', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY not configured' });
    }

    const { text, targetLang } = req.body;

    if (!text || !targetLang) {
      return res.status(400).json({ success: false, error: 'text and targetLang are required' });
    }

    const langNames = {
      KO: 'Korean', JA: 'Japanese', ZH: 'Chinese',
      ES: 'Spanish', FR: 'French', DE: 'German',
      PT: 'Portuguese', AR: 'Arabic', TH: 'Thai'
    };
    const langName = langNames[targetLang] || targetLang;

    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following image analysis text to ${langName}. Keep technical terms and proper nouns as-is. Return ONLY the translated text, no explanation.\n\n${text}`
            }]
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return res.status(geminiResponse.status).json({ success: false, error: 'Translation failed', details: errorText });
    }

    const result = await geminiResponse.json();
    const translated = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    res.json({ success: true, translated });

  } catch (error) {
    console.error('[Translate] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 에러 핸들러
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * 서버 시작
 */
app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 MONKOS Image Engine Started');
  console.log('='.repeat(60));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Project: ${PROJECT_ID}`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log(`💾 GCS Bucket: ${GCS_BUCKET}`);
  console.log(`🔐 Auth: ADC (Application Default Credentials)`);
  console.log('='.repeat(60));
  console.log(`🔑 Gemini API Key: ${GEMINI_API_KEY ? 'configured' : 'NOT SET'}`);
  console.log('='.repeat(60));
  console.log('Endpoints:');
  console.log(`  GET  /              - Health check`);
  console.log(`  POST /generate      - Generate images (Vertex AI Imagen 4)`);
  console.log(`  POST /batch-generate - Generate 4 images`);
  console.log(`  POST /refine        - I2I / Edit / Upscale (Gemini)`);
  console.log(`  POST /analyze       - Image analysis (Gemini)`);
  console.log(`  POST /translate     - Translation (Gemini)`);
  console.log('='.repeat(60));
});
