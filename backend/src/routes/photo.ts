/**
 * AI Photo API Routes (소소)
 * 증명사진, 프로필, 복원 등
 */

import { Router } from 'express';
import { generateImages, editImage, upscaleImage } from '../services/imagen';
import { uploadImage } from '../services/storage';

export const photoRouter = Router();

// 상품별 설정
const PRODUCT_CONFIG: Record<string, {
  aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  numberOfImages: number;
  basePrompt: string;
}> = {
  resume: {
    aspectRatio: '3:4',
    numberOfImages: 4,
    basePrompt: 'Professional Korean ID photo, formal attire, clean background, studio lighting, high quality portrait'
  },
  color_id: {
    aspectRatio: '3:4',
    numberOfImages: 4,
    basePrompt: 'Korean ID photo with colored background, professional portrait, studio quality'
  },
  profile: {
    aspectRatio: '1:1',
    numberOfImages: 4,
    basePrompt: 'Professional profile photo, modern style, clean background, natural lighting'
  },
  id_card: {
    aspectRatio: '3:4',
    numberOfImages: 3,
    basePrompt: 'Official ID photo, passport style, white background, neutral expression'
  },
  longevity: {
    aspectRatio: '3:4',
    numberOfImages: 1,
    basePrompt: 'Traditional Korean portrait, elegant, respectful, warm lighting, high quality'
  }
};

/**
 * POST /api/photo/generate
 * 이미지 생성
 */
photoRouter.post('/generate', async (req, res) => {
  try {
    const { 
      productType, 
      inputImage,  // base64 (선택)
      options = {} 
    } = req.body;

    const config = PRODUCT_CONFIG[productType];
    if (!config) {
      return res.status(400).json({ error: '지원하지 않는 상품 유형입니다.' });
    }

    // 프롬프트 구성
    let prompt = config.basePrompt;
    if (options.style) prompt += `, ${options.style} style`;
    if (options.background) prompt += `, ${options.background} background`;
    if (options.attire) prompt += `, wearing ${options.attire}`;

    let results;

    if (inputImage) {
      // I2I: 입력 이미지 기반 생성
      const result = await editImage({
        prompt,
        inputImage: inputImage.replace(/^data:image\/\w+;base64,/, '')
      });
      results = [result];
    } else {
      // T2I: 텍스트 기반 생성
      results = await generateImages({
        prompt,
        aspectRatio: config.aspectRatio,
        numberOfImages: config.numberOfImages
      });
    }

    // GCS에 저장
    const savedImages = await Promise.all(
      results.map(async (img) => {
        const saved = await uploadImage(img.imageBytes, {
          sector: 'soso',
          category: productType,
          userId: req.body.userId
        });
        return {
          id: saved.id,
          url: saved.url,
          path: saved.path
        };
      })
    );

    res.json({
      success: true,
      productType,
      images: savedImages,
      count: savedImages.length
    });

  } catch (error: any) {
    console.error('Photo Generate Error:', error);
    res.status(500).json({ 
      error: '이미지 생성에 실패했습니다.',
      details: error.message 
    });
  }
});

/**
 * POST /api/photo/restore
 * 사진 복원
 */
photoRouter.post('/restore', async (req, res) => {
  try {
    const { inputImage, options = {} } = req.body;

    if (!inputImage) {
      return res.status(400).json({ error: '복원할 이미지가 필요합니다.' });
    }

    let prompt = 'Restore and enhance this old photo, improve quality, fix damages';
    if (options.colorize) prompt += ', colorize black and white photo';
    if (options.enhanceFace) prompt += ', enhance facial features clearly';
    if (options.fixScratches) prompt += ', remove scratches and damages';

    const result = await editImage({
      prompt,
      inputImage: inputImage.replace(/^data:image\/\w+;base64,/, '')
    });

    // GCS에 저장
    const saved = await uploadImage(result.imageBytes, {
      sector: 'soso',
      category: 'restore',
      userId: req.body.userId
    });

    res.json({
      success: true,
      image: {
        id: saved.id,
        url: saved.url,
        path: saved.path
      }
    });

  } catch (error: any) {
    console.error('Photo Restore Error:', error);
    res.status(500).json({ 
      error: '사진 복원에 실패했습니다.',
      details: error.message 
    });
  }
});

/**
 * POST /api/photo/upscale
 * 이미지 업스케일
 */
photoRouter.post('/upscale', async (req, res) => {
  try {
    const { inputImage, scaleFactor = 2 } = req.body;

    if (!inputImage) {
      return res.status(400).json({ error: '업스케일할 이미지가 필요합니다.' });
    }

    const result = await upscaleImage(
      inputImage.replace(/^data:image\/\w+;base64,/, ''),
      scaleFactor as 2 | 4
    );

    // GCS에 저장
    const saved = await uploadImage(result.imageBytes, {
      sector: 'soso',
      category: 'upscale',
      userId: req.body.userId
    });

    res.json({
      success: true,
      image: {
        id: saved.id,
        url: saved.url,
        path: saved.path
      },
      scaleFactor
    });

  } catch (error: any) {
    console.error('Photo Upscale Error:', error);
    res.status(500).json({ 
      error: '이미지 업스케일에 실패했습니다.',
      details: error.message 
    });
  }
});

/**
 * GET /api/photo/products
 * 상품 목록
 */
photoRouter.get('/products', (req, res) => {
  const products = [
    { id: 'resume', name: '이력서 세트', credits: 75, images: 4 },
    { id: 'color_id', name: '컬러증명 세트', credits: 75, images: 4 },
    { id: 'profile', name: '프로필 세트', credits: 100, images: 4 },
    { id: 'id_card', name: '신분증 세트', credits: 150, images: 3, comingSoon: true },
    { id: 'longevity', name: '장수(영정)', credits: 600, images: 1 },
    { id: 'restore', name: '사진 복원', credits: 250, images: 1 }
  ];
  
  res.json({ products });
});
