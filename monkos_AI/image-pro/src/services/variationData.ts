import { VariationCategory } from '../types';

const IDENTITY_ANCHOR =
  'CRITICAL INSTRUCTION: You must maintain the exact facial features, body proportions, skin tone, facial structure, eye shape, nose, lips, and overall model identity. Preserve the person\'s unique characteristics completely and precisely.';

export const VARIATION_CATEGORIES: VariationCategory[] = [
  {
    id: 'pose',
    category: 'pose',
    name: 'Pose',
    nameKR: '포즈',
    icon: 'fa-person',
    color: 'blue',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain current outfit, background, and lighting exactly.`,
    variationPrompts: [
      'standing straight, facing camera, natural pose, arms at sides',
      'walking pose, mid-stride, natural movement, dynamic angle',
      'sitting pose, relaxed, comfortable position, natural setting',
      'leaning pose, casual stance, one hand on hip',
      'three-quarter angle, slight head tilt, elegant pose',
      'profile view, side angle, dramatic composition',
    ],
  },
  {
    id: 'outfit',
    category: 'outfit',
    name: 'Outfit',
    nameKR: '의상',
    icon: 'fa-shirt',
    color: 'emerald',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain current pose, background, and lighting exactly. Only change clothing.`,
    variationPrompts: [
      'casual summer dress, light fabric, relaxed style',
      'formal business suit, professional attire, blazer and pants',
      'elegant evening gown, sophisticated formal wear',
      'sportswear, athletic outfit, comfortable activewear',
      'streetwear, trendy urban fashion, modern casual',
      'traditional hanbok, Korean cultural wear, elegant accessory',
    ],
  },
  {
    id: 'background',
    category: 'background',
    name: 'Background',
    nameKR: '배경',
    icon: 'fa-image',
    color: 'purple',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain pose, outfit, and model completely. Only change the background environment.`,
    variationPrompts: [
      'pure white studio background, clean and minimal',
      'outdoor park setting, natural environment, greenery',
      'urban street background, modern city environment',
      'elegant interior, luxury setting, sophisticated room',
      'beach setting, ocean view, natural light',
      'abstract gradient background, soft colors, professional',
    ],
  },
  {
    id: 'hair',
    category: 'hair',
    name: 'Hair',
    nameKR: '헤어',
    icon: 'fa-scissors',
    color: 'pink',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain facial features, pose, outfit, and background. Only modify hairstyle.`,
    variationPrompts: [
      'long straight hair, sleek and shiny, natural flow',
      'elegant updo hairstyle, sophisticated bun, clean neckline',
      'wavy hair, soft curls, voluminous style',
      'short bob cut, modern and chic',
      'ponytail hairstyle, clean and sporty',
      'braided hairstyle, intricate pattern, artistic style',
    ],
  },
  {
    id: 'lighting',
    category: 'lighting',
    name: 'Light',
    nameKR: '조명',
    icon: 'fa-lightbulb',
    color: 'amber',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain model, pose, outfit, and background. Only adjust lighting conditions.`,
    variationPrompts: [
      'natural daylight, soft and even illumination',
      'studio softbox lighting, professional photography setup',
      'golden hour lighting, warm sunset glow',
      'dramatic side lighting, high contrast, cinematic',
      'neon lighting, colorful ambient, creative atmosphere',
      'backlit, rim lighting, silhouette edge, natural light',
    ],
  },
  {
    id: 'accessory',
    category: 'accessory',
    name: 'Accessory',
    nameKR: '악세서리',
    icon: 'fa-gem',
    color: 'rose',
    fixedPrompt: `${IDENTITY_ANCHOR} Maintain model, pose, outfit, and background. Add the specified accessory naturally.`,
    variationPrompts: [
      'holding luxury designer handbag, elegant accessory',
      'wearing sunglasses, stylish eyewear',
      'elegant necklace, fine jewelry, subtle sparkle',
      'wearing hat, fashionable headwear',
      'scarf or shawl, draped naturally, elegant textile',
      'earrings, statement jewelry, complementary accessory',
    ],
  },
];

export function getRandomVariationPrompt(categoryId: string): string {
  const cat = VARIATION_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return '';
  return cat.variationPrompts[Math.floor(Math.random() * cat.variationPrompts.length)];
}

export function getVariationPrompts(
  categoryId: string,
  customPrompt?: string
): { fixed: string; dynamic: string } {
  const cat = VARIATION_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return { fixed: '', dynamic: '' };
  return {
    fixed: cat.fixedPrompt,
    dynamic: customPrompt || getRandomVariationPrompt(categoryId),
  };
}
