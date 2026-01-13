/**
 * Lookbook API Routes (소소)
 * 룩북 생성 - Coming Soon (데이터 파이프라인 구축 후)
 */

import { Router } from 'express';
import { generateImages } from '../services/imagen';
import { uploadImage } from '../services/storage';

export const lookbookRouter = Router();

/**
 * POST /api/lookbook/generate
 * 룩북 이미지 생성 (데모)
 */
lookbookRouter.post('/generate', async (req, res) => {
  try {
    const { 
      prompt,
      category = 'fashion',
      aspectRatio = '9:16',
      numberOfImages = 4
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '프롬프트가 필요합니다.' });
    }

    // 카테고리별 프롬프트 보강
    const categoryPrompts: Record<string, string> = {
      fashion: 'Fashion lookbook, professional model, studio lighting, high fashion',
      product: 'Product photography, clean background, commercial quality',
      food: 'Food photography, appetizing, professional styling, warm lighting',
      beauty: 'Beauty photography, skincare, cosmetics, soft lighting',
      interior: 'Interior design photography, modern style, architectural'
    };

    const enhancedPrompt = `${categoryPrompts[category] || ''}, ${prompt}`;

    const results = await generateImages({
      prompt: enhancedPrompt,
      aspectRatio: aspectRatio as any,
      numberOfImages: Math.min(numberOfImages, 4)
    });

    // GCS에 저장
    const savedImages = await Promise.all(
      results.map(async (img) => {
        const saved = await uploadImage(img.imageBytes, {
          sector: 'soso',
          category: `lookbook_${category}`,
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
    console.error('Lookbook Generate Error:', error);
    res.status(500).json({ 
      error: '룩북 생성에 실패했습니다.',
      details: error.message 
    });
  }
});

/**
 * GET /api/lookbook/templates
 * 템플릿 목록 (Coming Soon)
 */
lookbookRouter.get('/templates', (req, res) => {
  res.json({
    message: 'Coming Soon - 데이터 파이프라인 구축 후 제공',
    categories: ['fashion', 'product', 'food', 'beauty', 'interior'],
    status: 'development'
  });
});

/**
 * GET /api/lookbook/categories
 * 카테고리 목록
 */
lookbookRouter.get('/categories', (req, res) => {
  const categories = [
    { id: 'fashion', name: '패션', icon: '👗' },
    { id: 'product', name: '상품', icon: '📦' },
    { id: 'food', name: '푸드', icon: '🍽️' },
    { id: 'beauty', name: '뷰티', icon: '💄' },
    { id: 'interior', name: '인테리어', icon: '🏠' }
  ];
  
  res.json({ categories });
});
