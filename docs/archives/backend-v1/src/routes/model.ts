/**
 * AI Model API Routes (민아)
 * AI 모델 에이전시
 */

import { Router } from 'express';
import { generateImages } from '../services/imagen';
import { uploadImage } from '../services/storage';

export const modelRouter = Router();

// 모델 카테고리별 프롬프트
const MODEL_PROMPTS: Record<string, string> = {
  fashion: 'Korean fashion model, professional photoshoot, high fashion, studio lighting, elegant pose',
  beauty: 'Korean beauty model, skincare advertisement, soft lighting, flawless skin, natural makeup',
  underwear: 'Korean lingerie model, elegant, professional photoshoot, soft lighting, tasteful',
  casual: 'Korean model, casual wear, lifestyle photography, natural lighting, friendly expression'
};

/**
 * POST /api/model/generate
 * AI 모델 이미지 생성
 */
modelRouter.post('/generate', async (req, res) => {
  try {
    const { 
      category = 'fashion',
      style,
      pose,
      background,
      numberOfImages = 4
    } = req.body;

    let prompt = MODEL_PROMPTS[category] || MODEL_PROMPTS.fashion;
    if (style) prompt += `, ${style} style`;
    if (pose) prompt += `, ${pose} pose`;
    if (background) prompt += `, ${background} background`;

    const results = await generateImages({
      prompt,
      aspectRatio: '3:4',  // 모델 사진 기본 비율
      numberOfImages: Math.min(numberOfImages, 4)
    });

    // GCS에 저장
    const savedImages = await Promise.all(
      results.map(async (img) => {
        const saved = await uploadImage(img.imageBytes, {
          sector: 'mina',
          category,
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
      category,
      images: savedImages,
      count: savedImages.length
    });

  } catch (error: any) {
    console.error('Model Generate Error:', error);
    res.status(500).json({ 
      error: '모델 이미지 생성에 실패했습니다.',
      details: error.message 
    });
  }
});

/**
 * GET /api/model/list
 * 모델 목록 (Cloudflare Images에서 가져옴)
 */
modelRouter.get('/list', async (req, res) => {
  // TODO: Cloudflare Images API 또는 D1에서 모델 목록 조회
  const models = [
    { 
      id: 'dain', 
      name: '다인', 
      nameEn: 'Dain',
      category: 'underwear',
      status: 'active',
      portfolioCount: 12
    },
    { 
      id: 'yuni', 
      name: '유니', 
      nameEn: 'Yuni',
      category: 'underwear',
      status: 'active',
      portfolioCount: 9
    }
  ];
  
  res.json({ models });
});

/**
 * GET /api/model/:id
 * 모델 상세 정보
 */
modelRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  // TODO: D1에서 모델 상세 정보 조회
  const modelData: Record<string, any> = {
    dain: {
      id: 'dain',
      name: '다인',
      nameEn: 'Dain',
      category: 'underwear',
      description: 'K-뷰티 AI 모델',
      height: 168,
      measurements: '82-58-86',
      styleTags: ['elegant', 'feminine', 'modern'],
      rentalPricePerDay: 500,  // 크레딧
      portfolioUrls: []  // Cloudflare Images URLs
    },
    yuni: {
      id: 'yuni',
      name: '유니',
      nameEn: 'Yuni',
      category: 'underwear',
      description: 'K-뷰티 AI 모델',
      height: 170,
      measurements: '84-60-88',
      styleTags: ['cute', 'fresh', 'natural'],
      rentalPricePerDay: 500,
      portfolioUrls: []
    }
  };
  
  const model = modelData[id];
  if (!model) {
    return res.status(404).json({ error: '모델을 찾을 수 없습니다.' });
  }
  
  res.json({ model });
});

/**
 * GET /api/model/categories
 * 모델 카테고리 목록
 */
modelRouter.get('/meta/categories', (req, res) => {
  const categories = [
    { id: 'fashion', name: '패션', icon: '👗' },
    { id: 'beauty', name: '뷰티', icon: '💄' },
    { id: 'underwear', name: '이너웨어', icon: '👙' },
    { id: 'casual', name: '캐주얼', icon: '👕' }
  ];
  
  res.json({ categories });
});
