/**
 * Imagen 4 Generator Module
 * Text-to-Image generation using Google Gemini Imagen 4.0
 */

import { GoogleGenAI } from '@google/genai';
import { IImageEngine, EngineConfig, GenerationParams, GenerationResult, EngineCapabilities } from '../../core/EngineInterface';

export class Imagen4Generator implements IImageEngine {
  readonly name = 'Imagen 4 Generator';
  readonly version = '4.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['text2image'],
    maxImageCount: 4,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportsSafetyLevels: true,
    supportsNegativePrompt: true,
    supportsReferenceImage: false
  };

  private config: EngineConfig | null = null;
  private ready = false;
  private useProxy = true; // Set to true for production deployment

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;
    this.ready = true;
    this.useProxy = !config.apiKey || config.apiKey === 'proxy'; // Use proxy if no API key
    console.log('Imagen4 initialized', this.useProxy ? '(via proxy)' : '(direct API)');
  }

  isReady(): boolean {
    return this.ready;
  }

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    if (!this.ready || !this.config) {
      throw new Error('Engine not initialized');
    }

    if (params.mode && params.mode !== 'text2image') {
      throw new Error('Imagen 4 only supports text2image mode');
    }

    console.log('Generating with params:', params);
    
    // Use proxy endpoint
    if (this.useProxy) {
      return this.generateViaProxy(params);
    }
    
    // Direct API call (legacy, for users with their own API key)
    return this.generateDirect(params);
  }

  private async generateViaProxy(params: GenerationParams): Promise<GenerationResult[]> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          aspectRatio: params.aspectRatio || '1:1',
          imageCount: params.imageCount || 4
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let errorMsg = 'Generation failed';
        try {
          const error = JSON.parse(text);
          errorMsg = error.error || errorMsg;
        } catch {
          errorMsg = text || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }
      
      const data = JSON.parse(text);
      console.log('Proxy response:', data);

      return data.generatedImages.map((img: any, index: number) => ({
        imageUrl: `data:image/png;base64,${img.image.imageBytes}`,
        thumbnailUrl: `data:image/png;base64,${img.image.imageBytes}`,
        metadata: {
          prompt: params.prompt,
          model: 'imagen-4.0',
          timestamp: Date.now(),
          aspectRatio: params.aspectRatio,
          safetyLevel: params.safetyLevel,
          negativePrompt: params.negativePrompt,
          rateLimit: data.rateLimit
        }
      }));
    } catch (error: any) {
      console.error('Proxy generation error:', error);
      throw new Error(error.message || 'Failed to generate images');
    }
  }

  private async generateDirect(params: GenerationParams): Promise<GenerationResult[]> {
    // Integrate negative prompt into main prompt if provided
    let finalPrompt = params.prompt;
    if (params.negativePrompt && params.negativePrompt.trim()) {
      finalPrompt = `${params.prompt}. Avoid: ${params.negativePrompt}`;
    }
    
    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: params.imageCount || 4,
          aspectRatio: params.aspectRatio || '1:1',
          safetyFilterLevel: 'block_low_and_above',
          personGeneration: 'allow_adult'
        }
      });

      console.log('API Response received, images:', response.generatedImages.length);

      return response.generatedImages.map((img: any, index: number) => ({
        imageUrl: `data:image/png;base64,${img.image.imageBytes}`,
        thumbnailUrl: `data:image/png;base64,${img.image.imageBytes}`,
        metadata: {
          prompt: params.prompt,
          model: 'imagen-4.0',
          timestamp: Date.now(),
          aspectRatio: params.aspectRatio,
          safetyLevel: params.safetyLevel,
          negativePrompt: params.negativePrompt
        }
      }));
    } catch (error: any) {
      console.error('Generation error:', error);
      if (error.message?.includes('entity was not found') || error.message?.includes('API_KEY_INVALID')) {
        throw new Error('Invalid API key. Please check your Gemini API key.');
      }
      throw new Error(error.message || 'Failed to generate images');
    }
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
    if (!this.ready || !this.ai) {
      return false;
    }

    try {
      // Simple health check
      return true;
    } catch {
      return false;
    }
  }

  dispose(): void {
    this.config = null;
    this.ai = null;
    this.ready = false;
  }
}
