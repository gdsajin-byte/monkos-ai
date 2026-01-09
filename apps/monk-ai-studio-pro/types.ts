
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';
export type SafetyLevel = 'BLOCK_LOW_AND_ABOVE' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_NONE';
export type SynthesisMode = 'T2I' | 'I2I' | 'EDIT' | 'UPSCALE';

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  projectId: string;
  comment?: string;
  tags?: string[];
  styleAnalysis?: string;
  config: {
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
    mode: SynthesisMode;
    safetyLevel?: SafetyLevel;
    model?: string;
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
