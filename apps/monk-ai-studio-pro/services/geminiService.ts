import { AspectRatio, ImageSize, SafetyLevel, SynthesisMode } from "../types";

// 백엔드 API 엔드포인트
// 로컬: http://localhost:3001/api, 배포: /api (Cloudflare Functions)
const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : '/api';

export class GeminiService {
  /**
   * T2I - Powered by MONKOS Engine (via Backend Proxy)
   */
  static async generateBatch(prompt: string, config: { aspectRatio: AspectRatio; safetyLevel: SafetyLevel; }): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, config })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Generation failed');
      }
      
      return data.images;
    } catch (error: any) {
      console.error('Generate batch error:', error);
      
      if (error.message?.includes("entity was not found") || error.message?.includes("API_KEY_INVALID")) {
        throw new Error("AUTH_REQUIRED");
      }
      
      throw error;
    }
  }

  /**
   * I2I, Edit, Upscale - Powered by MONKOS Engine (via Backend Proxy)
   */
  static async refineImage(prompt: string, config: { 
    aspectRatio: AspectRatio; 
    imageSize: ImageSize; 
    inputImage: string; 
    mode: SynthesisMode;
    safetyLevel: SafetyLevel; 
  }): Promise<string> {
    try {
      const response = await fetch(`${API_BASE}/refine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt, 
          config: {
            aspectRatio: config.aspectRatio,
            imageSize: config.imageSize,
            safetyLevel: config.safetyLevel
          },
          inputImage: config.inputImage,
          mode: config.mode
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Refinement failed');
      }
      
      return data.image;
    } catch (error: any) {
      console.error('Refine image error:', error);
      
      if (error.message?.includes("entity was not found")) {
        throw new Error("AUTH_REQUIRED");
      }
      
      throw error;
    }
  }

  /**
   * Image Analysis - Powered by Gemini 3 Pro Vision (via Backend Proxy)
   */
  static async analyzeImage(imageData: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      return data.analysis;
    } catch (error: any) {
      console.error('Analyze image error:', error);
      throw new Error("Failed to parse neural analysis data.");
    }
  }
}
