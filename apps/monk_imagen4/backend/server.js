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
    version: '1.0.0',
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
  console.log('Endpoints:');
  console.log(`  GET  /              - Health check`);
  console.log(`  POST /generate      - Generate images`);
  console.log(`  POST /batch-generate - Generate 4 images`);
  console.log('='.repeat(60));
});
