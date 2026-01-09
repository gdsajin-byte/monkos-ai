/**
 * Imagen 3 Pro Suite Module
 * Image-to-Image transformation, editing, and upscaling
 */

import { IImageEngine, EngineConfig, GenerationParams, GenerationResult, EngineCapabilities } from '../../core/EngineInterface';

export class Imagen3ProSuite implements IImageEngine {
  readonly name = 'Imagen 3 Pro Suite';
  readonly version = '3.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['image2image', 'edit', 'upscale'],
    maxImageCount: 4,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportsSafetyLevels: true,
    supportsNegativePrompt: true,
    supportsReferenceImage: true
  };

  private config: EngineConfig | null = null;
  private ready = false;

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;
    if (!config.apiKey || config.apiKey.length < 20) {
      throw new Error('Invalid API key');
    }
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    if (!this.ready || !this.config) {
      throw new Error('Engine not initialized');
    }

    if (!params.referenceImage) {
      throw new Error('Imagen 3 Pro requires a reference image');
    }

    const mode = params.mode || 'image2image';
    let endpoint = '';
    
    switch (mode) {
      case 'image2image':
        endpoint = 'imagen-3.0-generate-001:generateImages';
        break;
      case 'edit':
        endpoint = 'imagen-3.0-capability-001:editImage';
        break;
      case 'upscale':
        endpoint = 'imagen-3.0-capability-002:upscaleImage';
        break;
      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }

    // Convert File to base64
    const base64Image = await this.fileToBase64(params.referenceImage);

    const requestBody: any = {
      model: 'imagen-3.0-generate-001',
      prompt: params.prompt,
      image: base64Image,
      numberImages: params.imageCount || 4,
      safetyFilterLevel: params.safetyLevel || 'BLOCK_ONLY_HIGH'
    };

    if (params.negativePrompt) {
      requestBody.negativePrompt = params.negativePrompt;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${endpoint}?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const text = await response.text();
      let errorData: any = { error: { message: 'Request failed' } };
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData.error = { message: text || response.statusText };
      }
      throw new Error(`Generation failed: ${errorData.error?.message || response.statusText}`);
    }

    const text = await response.text();
    if (!text) {
      throw new Error('Empty response from server');
    }
    
    const data: any = JSON.parse(text);
    
    if (!data.generatedImages || data.generatedImages.length === 0) {
      throw new Error('No images generated');
    }

    return data.generatedImages.map((img: any) => ({
      imageUrl: img.image || '',
      thumbnailUrl: img.image,
      metadata: {
        prompt: params.prompt,
        model: 'imagen-3.0-generate-001',
        timestamp: Date.now(),
        aspectRatio: params.aspectRatio,
        safetyLevel: params.safetyLevel,
        negativePrompt: params.negativePrompt
      }
    }));
  }

  async generateBatch(params: GenerationParams[]): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    for (const param of params) {
      const batchResult = await this.generate(param);
      results.push(...batchResult);
    }
    
    return results;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.ready || !this.config) {
      return false;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001?key=${this.config.apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  dispose(): void {
    this.config = null;
    this.ready = false;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
