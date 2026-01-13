/**
 * Vertex AI Imagen Service
 * Workload Identity 기반 인증 (키 파일 불필요)
 */

import { PredictionServiceClient } from '@google-cloud/aiplatform';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0105707468';
const LOCATION = 'us-central1';  // Imagen 4.0 지원 리전

// Workload Identity 사용 - Cloud Run에서 자동 인증
const client = new PredictionServiceClient({
  apiEndpoint: `${LOCATION}-aiplatform.googleapis.com`
});

export interface ImagenConfig {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages?: number;
  seed?: number;
}

export interface GeneratedImage {
  imageBytes: string;  // base64
  mimeType: string;
}

/**
 * Imagen 4.0으로 이미지 생성
 */
export async function generateImages(config: ImagenConfig): Promise<GeneratedImage[]> {
  const {
    prompt,
    negativePrompt,
    aspectRatio = '1:1',
    numberOfImages = 4,
    seed
  } = config;

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-generate-001`;
  
  // Imagen 4.0 요청 형식
  const instances = [{
    prompt: negativePrompt ? `${prompt}. Avoid: ${negativePrompt}` : prompt
  }];

  const parameters = {
    sampleCount: numberOfImages,
    aspectRatio: aspectRatio,
    safetyFilterLevel: 'block_some',
    personGeneration: 'allow_adult',
    ...(seed && { seed })
  };

  try {
    const [response] = await client.predict({
      endpoint,
      instances: instances.map(i => ({ structValue: { fields: { prompt: { stringValue: i.prompt } } } })),
      parameters: { structValue: { fields: Object.fromEntries(
        Object.entries(parameters).map(([k, v]) => [k, typeof v === 'number' ? { numberValue: v } : { stringValue: String(v) }])
      )}}
    });

    const predictions = response.predictions || [];
    
    return predictions.map((pred: any) => ({
      imageBytes: pred.structValue?.fields?.bytesBase64Encoded?.stringValue || '',
      mimeType: 'image/png'
    }));
  } catch (error: any) {
    console.error('Imagen API Error:', error.message);
    throw new Error(`이미지 생성 실패: ${error.message}`);
  }
}

/**
 * 이미지 편집 (I2I)
 */
export async function editImage(config: {
  prompt: string;
  inputImage: string;  // base64
  maskImage?: string;  // base64 (optional)
}): Promise<GeneratedImage> {
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-capability-001`;

  const instances = [{
    prompt: config.prompt,
    image: { bytesBase64Encoded: config.inputImage },
    ...(config.maskImage && { mask: { bytesBase64Encoded: config.maskImage } })
  }];

  const parameters = {
    sampleCount: 1,
    safetyFilterLevel: 'block_some'
  };

  try {
    const [response] = await client.predict({
      endpoint,
      instances: instances.map(i => ({ 
        structValue: { 
          fields: { 
            prompt: { stringValue: i.prompt },
            image: { structValue: { fields: { bytesBase64Encoded: { stringValue: i.image.bytesBase64Encoded } } } }
          } 
        } 
      })),
      parameters: { structValue: { fields: Object.fromEntries(
        Object.entries(parameters).map(([k, v]) => [k, typeof v === 'number' ? { numberValue: v } : { stringValue: String(v) }])
      )}}
    });

    const prediction = response.predictions?.[0];
    
    return {
      imageBytes: (prediction as any)?.structValue?.fields?.bytesBase64Encoded?.stringValue || '',
      mimeType: 'image/png'
    };
  } catch (error: any) {
    console.error('Imagen Edit Error:', error.message);
    throw new Error(`이미지 편집 실패: ${error.message}`);
  }
}

/**
 * 이미지 업스케일
 */
export async function upscaleImage(inputImage: string, scaleFactor: 2 | 4 = 2): Promise<GeneratedImage> {
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/imagen-3.0-capability-001`;

  const instances = [{
    image: { bytesBase64Encoded: inputImage },
    upscaleConfig: { upscaleFactor: `x${scaleFactor}` }
  }];

  try {
    const [response] = await client.predict({
      endpoint,
      instances: instances.map(i => ({ 
        structValue: { 
          fields: { 
            image: { structValue: { fields: { bytesBase64Encoded: { stringValue: i.image.bytesBase64Encoded } } } },
            upscaleConfig: { structValue: { fields: { upscaleFactor: { stringValue: i.upscaleConfig.upscaleFactor } } } }
          } 
        } 
      })),
      parameters: { structValue: { fields: {} } }
    });

    const prediction = response.predictions?.[0];
    
    return {
      imageBytes: (prediction as any)?.structValue?.fields?.bytesBase64Encoded?.stringValue || '',
      mimeType: 'image/png'
    };
  } catch (error: any) {
    console.error('Imagen Upscale Error:', error.message);
    throw new Error(`이미지 업스케일 실패: ${error.message}`);
  }
}
