import { AspectRatio, EngineModel, Resolution, SafetyLevel } from '../types';

const API_BASE = window.location.origin;

export interface GenerateConfig {
  aspectRatio: AspectRatio;
  imageSize: Resolution;
  model: EngineModel;
  safetyLevel?: SafetyLevel;
}

export interface RefineConfig {
  aspectRatio: AspectRatio;
  imageSize: Resolution;
  inputImage: string;
  mode: string;
  safetyLevel?: SafetyLevel;
}

export class ApiService {
  static apiEndpoint = '/api/upload';

  static async generateBatch(
    prompt: string,
    config: GenerateConfig
  ): Promise<string[]> {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        config,
        model: config.model || 'fast',
        aspectRatio: config.aspectRatio,
        imageSize: config.imageSize,
        numberOfImages: 4,
        safetyFilterLevel: 'block_none',
        personGeneration: 'allow_all',
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Generation failed');
    }

    const data = await res.json();
    if (!data.success && !data.images) throw new Error(data.error || 'No images returned');
    return data.images;
  }

  static async refineImage(
    prompt: string,
    config: RefineConfig
  ): Promise<string> {
    const res = await fetch(`${API_BASE}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        config: {
          aspectRatio: config.aspectRatio,
          imageSize: config.imageSize,
        },
        inputImage: config.inputImage,
        mode: config.mode,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Refinement failed');
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'No image returned');
    return data.image;
  }

  static async analyzeImage(imageData: string): Promise<{
    prompt: string;
    style: string;
    tags: string[];
  }> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData }),
    });

    if (!res.ok) throw new Error('Analysis failed');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Analysis failed');
    return data.analysis;
  }

  static async translate(text: string, targetLang: string): Promise<string> {
    const res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang }),
    });

    if (!res.ok) throw new Error('Translation failed');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Translation failed');
    return data.translated;
  }

  static async saveImage(
    imageUrl: string,
    metadata: Record<string, unknown>
  ): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
      const base64 = imageUrl.split(',')[1];
      const raw = atob(base64);
      const arr = new Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      const blob = new Blob([new Uint8Array(arr)], { type: 'image/png' });

      const formData = new FormData();
      formData.append('image', blob, 'image.png');
      formData.append('metadata', JSON.stringify(metadata));

      const res = await fetch(this.apiEndpoint, { method: 'POST', body: formData });
      const data = await res.json();
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save image';
      return { success: false, error: msg };
    }
  }
}
