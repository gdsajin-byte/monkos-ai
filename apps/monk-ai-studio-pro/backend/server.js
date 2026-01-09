import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS 설정
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API 키 확인
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Safety level 변환 헬퍼
function getSafetyThreshold(level) {
  const thresholds = {
    'BLOCK_LOW_AND_ABOVE': HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    'BLOCK_MEDIUM_AND_ABOVE': HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    'BLOCK_ONLY_HIGH': HarmBlockThreshold.BLOCK_ONLY_HIGH,
    'BLOCK_NONE': HarmBlockThreshold.BLOCK_NONE
  };
  return thresholds[level] || HarmBlockThreshold.BLOCK_ONLY_HIGH;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend proxy is running' });
});

// 1. 이미지 생성 (T2I - Imagen 4.0)
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, config } = req.body;
    
    console.log('📸 Generating images with Imagen 4.0...');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');
    console.log('   Config:', config);
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: { 
        numberOfImages: 4, 
        aspectRatio: config.aspectRatio 
      },
    });
    
    const images = response.generatedImages.map(img => 
      `data:image/png;base64,${img.image.imageBytes}`
    );
    
    console.log('✅ Generated', images.length, 'images');
    
    res.json({
      success: true,
      images
    });
  } catch (error) {
    console.error('❌ Generation error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. 이미지 편집/변환 (I2I, EDIT, UPSCALE - Imagen 3 Pro)
app.post('/api/refine', async (req, res) => {
  try {
    const { prompt, config, inputImage, mode } = req.body;
    
    console.log('🎨 Refining image with Imagen 3 Pro...');
    console.log('   Mode:', mode);
    console.log('   Prompt:', prompt.substring(0, 100) + '...');
    
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = inputImage.includes(',') ? inputImage.split(',')[1] : inputImage;
    
    let instruction = '';
    switch(mode) {
      case 'UPSCALE':
        instruction = `[STRICT 4K RECONSTRUCTION] Perform high-fidelity super-resolution on this image. Target 4K resolution. Enhance details, textures, and edges while perfectly preserving the original artistic intent. ${prompt}`;
        break;
      case 'EDIT':
        instruction = `[NEURAL EDITING] Modify the provided image based on these specific instructions: ${prompt}. Blend changes seamlessly.`;
        break;
      case 'I2I':
      default:
        instruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Prompt: ${prompt}`;
        break;
    }
    
    const threshold = getSafetyThreshold(config.safetyLevel);
    
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
          aspectRatio: config.aspectRatio, 
          imageSize: config.imageSize
        },
        safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold }],
        tools: [{ googleSearch: {} }]
      },
    });
    
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) {
      throw new Error('Neural response contained no image data. The model might have declined the request.');
    }
    
    const resultImage = `data:image/png;base64,${part.inlineData.data}`;
    
    console.log('✅ Image refined successfully');
    
    res.json({
      success: true,
      image: resultImage
    });
  } catch (error) {
    console.error('❌ Refinement error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 3. 이미지 분석 (Gemini 3 Pro Vision)
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    console.log('🧠 Analyzing image with Gemini 3 Pro Vision...');
    
    const mimeTypeMatch = imageData.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: 'Perform a deep neural analysis. Provide: 1. A detailed English prompt to recreate it. 2. A description of its artistic style and lighting. 3. Key technical metadata tags. Respond strictly in JSON format.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            style: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['prompt', 'style', 'tags']
        }
      }
    });
    
    const analysis = JSON.parse(response.text || '{}');
    
    console.log('✅ Image analyzed successfully');
    
    res.json({ 
      success: true, 
      analysis 
    });
  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log('   MONK AI STUDIO - Backend Proxy');
  console.log('   ====================================');
  console.log('   Status: ✅ Running');
  console.log(`   Port: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log('   API Key: ✅ Configured');
  console.log('   ====================================');
  console.log('');
});
