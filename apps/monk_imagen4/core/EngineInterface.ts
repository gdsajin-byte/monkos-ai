/**
 * Core Engine Interface for AI Image Generation Modules
 * Supports multiple AI providers: Imagen 4, Imagen 3 Pro, Lumina, Stable Diffusion, etc.
 */

export interface EngineConfig {
  apiKey: string;
  model: string;
  endpoint?: string;
}

export interface GenerationParams {
  prompt: string;
  aspectRatio?: string;
  safetyLevel?: string;
  negativePrompt?: string;
  imageCount?: number;
  referenceImage?: File;
  mode?: 'text2image' | 'image2image' | 'edit' | 'upscale';
}

export interface GenerationResult {
  imageUrl: string;
  thumbnailUrl?: string;
  metadata: {
    prompt: string;
    model: string;
    timestamp: number;
    aspectRatio?: string;
    safetyLevel?: string;
    negativePrompt?: string;
  };
}

export interface EngineCapabilities {
  supportedModes: Array<'text2image' | 'image2image' | 'edit' | 'upscale'>;
  maxImageCount: number;
  supportedAspectRatios: string[];
  supportsSafetyLevels: boolean;
  supportsNegativePrompt: boolean;
  supportsReferenceImage: boolean;
}

/**
 * Main interface that all AI engine modules must implement
 */
export interface IImageEngine {
  // Engine identification
  readonly name: string;
  readonly version: string;
  readonly capabilities: EngineCapabilities;

  // Initialization
  initialize(config: EngineConfig): Promise<void>;
  isReady(): boolean;

  // Core generation
  generate(params: GenerationParams): Promise<GenerationResult[]>;

  // Batch processing
  generateBatch(params: GenerationParams[]): Promise<GenerationResult[]>;

  // Health check
  healthCheck(): Promise<boolean>;

  // Cleanup
  dispose(): void;
}

/**
 * Module metadata for UI display
 */
export interface ModuleMetadata {
  id: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  category: 'generator' | 'transformer' | 'hybrid';
  provider: string;
  version: string;
}

/**
 * Module loader interface
 */
export interface IModuleLoader {
  loadModule(moduleId: string): Promise<IImageEngine>;
  getAvailableModules(): ModuleMetadata[];
  unloadModule(moduleId: string): void;
}
