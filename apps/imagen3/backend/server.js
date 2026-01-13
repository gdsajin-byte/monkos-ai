import express from 'express';
import cors from 'cors';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// backend 폴더의 .env 로드
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// CORS 설정 - 모든 origin 허용 (테스트용)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API 키 확인
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  console.error('   Create .env file with: GEMINI_API_KEY=your_api_key');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// =====================================================
// 정체성 유지 프롬프트 (MONKOS에서 검증된 버전)
// =====================================================
const IDENTITY_PRESERVATION = {
  EN: "CRITICAL INSTRUCTION: Maintain the exact facial features, body proportions, skin tone, facial structure, eye shape, nose, lips, and overall model identity. Preserve the person's unique characteristics completely and precisely.",
  KR: "중요 지시사항: 모델의 정확한 얼굴 특징, 체형, 피부톤, 얼굴 구조, 눈 모양, 코, 입술 및 전반적인 정체성을 유지하세요."
};

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Imagen 3 Test Server Running',
    model: 'gemini-3-pro-image-preview',
    safetyLevel: 'BLOCK_NONE'
  });
});

// =====================================================
// I2I 이미지 변환 (gemini-3-pro-image-preview)
// =====================================================
app.post('/api/i2i', async (req, res) => {
  try {
    const { 
      inputImage, 
      prompt, 
      style = 'id_photo',
      aspectRatio = '3:4',
      preserveIdentity = true 
    } = req.body;

    if (!inputImage) {
      return res.status(400).json({ success: false, error: '입력 이미지가 필요합니다' });
    }

    console.log('');
    console.log('🎨 ====================================');
    console.log('   IMAGE-TO-IMAGE 변환 시작');
    console.log('   ====================================');
    console.log('   Style:', style);
    console.log('   Aspect:', aspectRatio);
    console.log('   Identity Lock:', preserveIdentity);
    console.log('   Prompt:', (prompt || '').substring(0, 50) + '...');
    console.log('');

    // Base64 파싱
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;

    // 스타일별 프롬프트 구성
    const stylePrompts = {
      id_photo: 'Professional ID photo, studio lighting, formal white background, sharp focus, passport-style portrait',
      profile: 'Professional business profile photo, soft studio lighting, neutral background, confident expression',
      casual: 'Natural casual portrait, soft daylight, relaxed expression, lifestyle photography',
      suit: 'Professional portrait wearing formal business suit, corporate style, studio lighting',
      custom: prompt || 'High quality portrait photograph'
    };

    // 최종 instruction 구성
    const instruction = preserveIdentity 
      ? `${IDENTITY_PRESERVATION.EN}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompts[style] || stylePrompts.custom}. ${prompt || ''}`
      : `[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompts[style] || stylePrompts.custom}. ${prompt || ''}`;

    console.log('📝 Final Instruction:');
    console.log('   ', instruction.substring(0, 200) + '...');
    console.log('');

    // Gemini 3 Pro Image 호출 (MONKOS 방식)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: instruction }
        ]
      },
      config: {
        imageConfig: { 
          aspectRatio: aspectRatio
        },
        // BLOCK_NONE - 가장 낮은 제한 (MONKOS 검증)
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
        ]
      }
    });

    // 결과 이미지 추출
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) {
      console.error('❌ No image in response');
      throw new Error('모델이 이미지를 생성하지 않았습니다. 프롬프트나 이미지를 조정해 주세요.');
    }

    const resultImage = `data:image/png;base64,${part.inlineData.data}`;

    console.log('✅ 이미지 생성 성공!');
    console.log('');

    res.json({
      success: true,
      image: resultImage,
      metadata: {
        style,
        aspectRatio,
        identityPreserved: preserveIdentity,
        model: 'gemini-3-pro-image-preview'
      }
    });

  } catch (error) {
    console.error('❌ I2I Error:', error.message);
    console.error('   Full:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: '이미지나 프롬프트를 조정해 보세요'
    });
  }
});

// =====================================================
// T2I 텍스트-이미지 생성 (참고용 - Imagen 4 사용)
// =====================================================
app.post('/api/t2i', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', numberOfImages = 4 } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: '프롬프트가 필요합니다' });
    }

    console.log('📸 T2I 생성:', prompt.substring(0, 50) + '...');

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: { 
        numberOfImages: numberOfImages, 
        aspectRatio: aspectRatio 
      }
    });

    const images = response.generatedImages.map(img => 
      `data:image/png;base64,${img.image.imageBytes}`
    );

    console.log('✅ T2I 완료:', images.length, '장');

    res.json({ success: true, images });

  } catch (error) {
    console.error('❌ T2I Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ==========================================');
  console.log('   IMAGEN 3 TEST SERVER');
  console.log('   ==========================================');
  console.log('   Status: ✅ Running');
  console.log(`   Port: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('   Model: gemini-3-pro-image-preview');
  console.log('   Safety: BLOCK_NONE (최소 제한)');
  console.log('   Identity: Preservation Enabled');
  console.log('   ==========================================');
  console.log('');
  console.log('   📡 Endpoints:');
  console.log('      GET  /health     - 서버 상태');
  console.log('      POST /api/i2i    - 이미지 변환');
  console.log('      POST /api/t2i    - 텍스트→이미지');
  console.log('');
});
