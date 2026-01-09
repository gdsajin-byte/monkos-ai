// I2I 변주를 위한 프롬프트 템플릿 시스템

export interface VariationTemplate {
  id: string;
  category: 'pose' | 'outfit' | 'background' | 'hair' | 'lighting' | 'accessory';
  name: string;
  nameKR: string;
  icon: string;
  color: string;
  fixedPrompt: string;
  variationPrompts: string[];
}

// 정체성 유지 고정 프롬프트 (모든 변주에 기본 적용)
export const IDENTITY_PRESERVATION = {
  EN: "CRITICAL INSTRUCTION: Maintain the exact facial features, body proportions, skin tone, facial structure, eye shape, nose, lips, and overall model identity. Preserve the person's unique characteristics completely and precisely.",
  KR: "중요 지시사항: 모델의 정확한 얼굴 특징, 체형, 피부톤, 얼굴 구조, 눈 모양, 코, 입술 및 전반적인 정체성을 유지하세요. 인물의 고유한 특성을 완전하고 정확하게 보존하세요."
};

// 변주 템플릿
export const VARIATION_TEMPLATES: VariationTemplate[] = [
  // 포즈 변경
  {
    id: 'pose',
    category: 'pose',
    name: 'Pose',
    nameKR: '포즈',
    icon: 'fa-person',
    color: 'blue',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain current outfit, background, and lighting exactly.`,
    variationPrompts: [
      'standing straight, facing camera, natural pose, arms at sides',
      'walking pose, mid-stride, confident attitude, dynamic movement',
      'sitting elegantly, one leg crossed, relaxed posture',
      'three-quarter turn, looking over shoulder',
      'profile view, side angle'
    ]
  },
  
  // 의상 변경
  {
    id: 'outfit',
    category: 'outfit',
    name: 'Outfit',
    nameKR: '의상',
    icon: 'fa-shirt',
    color: 'emerald',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain current pose, background, and lighting exactly. Only change clothing.`,
    variationPrompts: [
      'casual summer dress, light fabric, relaxed style',
      'formal business suit, professional attire, blazer and pants',
      'elegant evening gown, sophisticated formal wear',
      'sportswear, athletic outfit, comfortable activewear',
      'casual t-shirt and jeans, everyday comfortable style'
    ]
  },
  
  // 배경 변경
  {
    id: 'background',
    category: 'background',
    name: 'Background',
    nameKR: '배경',
    icon: 'fa-image',
    color: 'purple',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain pose, outfit, and model completely. Only change the background environment.`,
    variationPrompts: [
      'pure white studio background, clean and minimal',
      'outdoor park setting, natural environment, greenery',
      'urban street background, modern city environment',
      'elegant interior, luxury setting, sophisticated space',
      'beach scene, coastal environment, natural light'
    ]
  },
  
  // 헤어 스타일
  {
    id: 'hair',
    category: 'hair',
    name: 'Hair',
    nameKR: '헤어',
    icon: 'fa-scissors',
    color: 'pink',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain facial features, pose, outfit, and background. Only modify hairstyle.`,
    variationPrompts: [
      'long straight hair, sleek and shiny, natural flow',
      'elegant updo hairstyle, sophisticated bun, clean neckline',
      'wavy hair, soft curls, voluminous style',
      'short bob cut, modern and chic',
      'ponytail hairstyle, neat and sporty'
    ]
  },
  
  // 조명 변경
  {
    id: 'lighting',
    category: 'lighting',
    name: 'Light',
    nameKR: '조명',
    icon: 'fa-lightbulb',
    color: 'amber',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain model, pose, outfit, and background. Only adjust lighting conditions.`,
    variationPrompts: [
      'natural daylight, soft and even illumination',
      'studio softbox lighting, professional photography setup',
      'golden hour lighting, warm sunset glow',
      'dramatic side lighting, high contrast, cinematic',
      'soft diffused light, gentle and flattering'
    ]
  },
  
  // 액세서리 추가
  {
    id: 'accessory',
    category: 'accessory',
    name: 'Item',
    nameKR: '소품',
    icon: 'fa-bag-shopping',
    color: 'indigo',
    fixedPrompt: `${IDENTITY_PRESERVATION.EN} Maintain model, pose, outfit, and background. Add the specified accessory naturally.`,
    variationPrompts: [
      'holding luxury designer handbag, elegant accessory',
      'wearing sunglasses, stylish eyewear',
      'carrying shopping bags, casual accessories',
      'wearing elegant watch, sophisticated timepiece',
      'holding smartphone, modern accessory'
    ]
  }
];

// 랜덤 변주 선택 헬퍼
export const getRandomVariation = (category: string): string => {
  const template = VARIATION_TEMPLATES.find(t => t.id === category);
  if (!template) return '';
  
  const random = Math.floor(Math.random() * template.variationPrompts.length);
  return template.variationPrompts[random];
};

// 커스텀 변주 생성
export const createVariation = (category: string, customPrompt?: string): { fixed: string; dynamic: string } => {
  const template = VARIATION_TEMPLATES.find(t => t.id === category);
  if (!template) return { fixed: '', dynamic: '' };
  
  return {
    fixed: template.fixedPrompt,
    dynamic: customPrompt || getRandomVariation(category)
  };
};
