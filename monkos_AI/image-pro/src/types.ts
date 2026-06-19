export type Protocol = 'T2I' | 'I2I';
export type EngineModel = 'fast' | 'ultra';
export type Resolution = '1K' | '2K';
export type AspectRatio = '1:1' | '16:9' | '9:16';
export type ImageSize = '1K' | '2K' | '4K';
export type SafetyLevel = 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE';
export type ViewMode = 'single' | 'grid';
export type Language = 'EN' | 'KO';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  projectId: string;
  config: {
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
    mode: string;
    model: string;
    isUpscale?: boolean;
    isI2I?: boolean;
    safetyLevel?: SafetyLevel;
  };
}

export interface NeuralLog {
  id: string;
  projectId: string;
  operation: string;
  model: string;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
  timestamp: number;
}

export enum AppState {
  AUTH = 'AUTH',
  MAIN = 'MAIN',
  LOADING = 'LOADING'
}

export interface VariationCategory {
  id: string;
  category: string;
  name: string;
  nameKR: string;
  icon: string;
  color: string;
  fixedPrompt: string;
  variationPrompts: string[];
}

export const LABELS: Record<Language, Record<string, string>> = {
  EN: {
    title: 'MONKOS IMAGE PRO',
    subtitle: 'Professional Synthesis Platform v4.0',
    logs: 'Logs',
    export: 'Export',
    deploy: 'Deploy',
    guideTitle: 'Professional Deployment',
    guideSub: 'Install as a standalone PWA.',
    copy: 'Copy App URL',
    close: 'Close',
    protocol: 'Protocol',
    engine: 'Engine',
    resolution: 'Resolution',
    ratio: 'Ratio',
    sourceNode: 'Source Node',
    selectImage: 'Select Image',
    prompt: 'Enter Prompt...',
    negativePrompt: 'Negative Prompt...',
    synthesize: 'Synthesize',
    batchGrid: 'Batch Grid',
    activeFocus: 'Active Focus',
    idle: 'MONK Node IDLE',
    newGenerate: 'New Generate',
    variation: 'Variation',
    exportAll: 'Export All',
    exportBatch: 'Export Batch',
    processing: 'Processing',
  },
  KO: {
    title: 'MONKOS IMAGE PRO',
    subtitle: '전문 합성 플랫폼 v4.0',
    logs: '로그',
    export: '내보내기',
    deploy: '설치',
    guideTitle: '전문 배포',
    guideSub: '독립형 PWA 앱으로 설치합니다.',
    copy: '앱 URL 복사',
    close: '닫기',
    protocol: '프로토콜',
    engine: '엔진',
    resolution: '해상도',
    ratio: '비율',
    sourceNode: '소스 노드',
    selectImage: '이미지 선택',
    prompt: '프롬프트 입력...',
    negativePrompt: '네거티브 프롬프트...',
    synthesize: '합성',
    batchGrid: '배치 그리드',
    activeFocus: '활성 포커스',
    idle: 'MONK 노드 대기',
    newGenerate: '새 생성',
    variation: '변형',
    exportAll: '전체 내보내기',
    exportBatch: '배치 내보내기',
    processing: '처리 중',
  },
};
