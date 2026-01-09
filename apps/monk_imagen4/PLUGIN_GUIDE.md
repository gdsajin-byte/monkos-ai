# 🔌 Plugin Development Guide

Complete guide for integrating third-party AI engines into Monk AI Studio Modular.

---

## Quick Start (5 Minutes)

### Step 1: Create Your Engine Class

```typescript
// modules/your-engine/YourEngine.ts
import { IImageEngine, EngineConfig, GenerationParams, GenerationResult, EngineCapabilities } from '../../core/EngineInterface';

export class YourEngine implements IImageEngine {
  readonly name = 'Your Engine Name';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['text2image'],
    maxImageCount: 4,
    supportedAspectRatios: ['1:1', '16:9'],
    supportsSafetyLevels: true,
    supportsNegativePrompt: true,
    supportsReferenceImage: false
  };

  private config: EngineConfig | null = null;
  private ready = false;

  async initialize(config: EngineConfig): Promise<void> {
    this.config = config;
    // Your initialization logic here
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    if (!this.ready || !this.config) {
      throw new Error('Engine not initialized');
    }

    // Your API call here
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config.apiKey}` },
      body: JSON.stringify({
        prompt: params.prompt,
        // ... your parameters
      })
    });

    const data = await response.json();

    // Map to GenerationResult format
    return data.images.map((img: any) => ({
      imageUrl: img.url,
      thumbnailUrl: img.thumbnail,
      metadata: {
        prompt: params.prompt,
        model: this.config!.model,
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
    try {
      // Ping your API
      return true;
    } catch {
      return false;
    }
  }

  dispose(): void {
    this.config = null;
    this.ready = false;
  }
}
```

### Step 2: Register in ModuleLoader

```typescript
// core/ModuleLoader.ts
private registerModules() {
  this.metadata = [
    // ... existing modules
    {
      id: 'your-engine',
      displayName: 'Your Engine Name',
      description: 'Brief description',
      icon: '🚀',
      color: '#FF6B6B',
      category: 'generator',
      provider: 'Your Company',
      version: '1.0.0'
    }
  ];
}

async loadModule(moduleId: string): Promise<IImageEngine> {
  // ... existing cases
  case 'your-engine':
    const { YourEngine } = await import('../modules/your-engine/YourEngine');
    engine = new YourEngine();
    break;
}
```

### Step 3: Done! 🎉

Your engine is now available in the module selector.

---

## Complete Examples

### Example 1: Stable Diffusion XL

```typescript
export class StableDiffusionXL implements IImageEngine {
  readonly name = 'Stable Diffusion XL';
  readonly version = '1.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['text2image', 'image2image'],
    maxImageCount: 4,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportsSafetyLevels: false,
    supportsNegativePrompt: true,
    supportsReferenceImage: true
  };

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    const endpoint = params.mode === 'text2image' 
      ? 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image'
      : 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';

    const formData = new FormData();
    formData.append('text_prompts[0][text]', params.prompt);
    if (params.negativePrompt) {
      formData.append('text_prompts[1][text]', params.negativePrompt);
      formData.append('text_prompts[1][weight]', '-1');
    }
    formData.append('samples', params.imageCount?.toString() || '1');

    if (params.referenceImage) {
      formData.append('init_image', params.referenceImage);
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.config!.apiKey}` },
      body: formData
    });

    const data = await response.json();
    
    return data.artifacts.map((artifact: any) => ({
      imageUrl: `data:image/png;base64,${artifact.base64}`,
      thumbnailUrl: `data:image/png;base64,${artifact.base64}`,
      metadata: {
        prompt: params.prompt,
        model: 'sdxl-1.0',
        timestamp: Date.now(),
        negativePrompt: params.negativePrompt
      }
    }));
  }
}
```

### Example 2: Midjourney (API)

```typescript
export class MidjourneyEngine implements IImageEngine {
  readonly name = 'Midjourney';
  readonly version = '6.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['text2image'],
    maxImageCount: 1,
    supportedAspectRatios: ['1:1', '16:9', '9:16', '2:3', '3:2'],
    supportsSafetyLevels: false,
    supportsNegativePrompt: true,
    supportsReferenceImage: true
  };

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    // Build Midjourney-style prompt
    let mjPrompt = params.prompt;
    
    if (params.aspectRatio) {
      const arMap: Record<string, string> = {
        '1:1': '1:1',
        '16:9': '16:9',
        '9:16': '9:16',
        '2:3': '2:3',
        '3:2': '3:2'
      };
      mjPrompt += ` --ar ${arMap[params.aspectRatio]}`;
    }

    if (params.negativePrompt) {
      mjPrompt += ` --no ${params.negativePrompt}`;
    }

    // Trigger imagine
    const imagineResponse = await fetch('https://api.midjourney.com/v1/imagine', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt: mjPrompt })
    });

    const { task_id } = await imagineResponse.json();

    // Poll for result
    let result;
    while (true) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const statusResponse = await fetch(`https://api.midjourney.com/v1/tasks/${task_id}`, {
        headers: { 'Authorization': `Bearer ${this.config!.apiKey}` }
      });
      
      result = await statusResponse.json();
      if (result.status === 'completed') break;
      if (result.status === 'failed') throw new Error('Generation failed');
    }

    return [{
      imageUrl: result.image_url,
      thumbnailUrl: result.thumbnail_url,
      metadata: {
        prompt: params.prompt,
        model: 'midjourney-v6',
        timestamp: Date.now(),
        negativePrompt: params.negativePrompt
      }
    }];
  }
}
```

### Example 3: DALL·E 3

```typescript
export class DallE3Engine implements IImageEngine {
  readonly name = 'DALL·E 3';
  readonly version = '3.0.0';
  readonly capabilities: EngineCapabilities = {
    supportedModes: ['text2image'],
    maxImageCount: 1,
    supportedAspectRatios: ['1:1', '16:9', '9:16'],
    supportsSafetyLevels: false,
    supportsNegativePrompt: false,
    supportsReferenceImage: false
  };

  async generate(params: GenerationParams): Promise<GenerationResult[]> {
    const sizeMap: Record<string, string> = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792'
    };

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config!.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: params.prompt,
        n: 1,
        size: sizeMap[params.aspectRatio || '1:1'],
        quality: 'hd',
        style: 'vivid'
      })
    });

    const data = await response.json();

    return data.data.map((img: any) => ({
      imageUrl: img.url,
      thumbnailUrl: img.url,
      metadata: {
        prompt: params.prompt,
        model: 'dall-e-3',
        timestamp: Date.now(),
        aspectRatio: params.aspectRatio
      }
    }));
  }
}
```

---

## API Reference

### IImageEngine Interface

```typescript
interface IImageEngine {
  // Required readonly properties
  readonly name: string;              // Display name
  readonly version: string;           // Version string (e.g., '1.0.0')
  readonly capabilities: EngineCapabilities;

  // Lifecycle methods
  initialize(config: EngineConfig): Promise<void>;
  isReady(): boolean;
  dispose(): void;

  // Generation methods
  generate(params: GenerationParams): Promise<GenerationResult[]>;
  generateBatch(params: GenerationParams[]): Promise<GenerationResult[]>;

  // Health check
  healthCheck(): Promise<boolean>;
}
```

### EngineConfig

```typescript
interface EngineConfig {
  apiKey: string;      // API key or token
  model: string;       // Model identifier
  endpoint?: string;   // Optional custom endpoint
}
```

### GenerationParams

```typescript
interface GenerationParams {
  prompt: string;                // Main prompt
  aspectRatio?: string;          // '1:1', '16:9', etc.
  safetyLevel?: string;          // Safety filter level
  negativePrompt?: string;       // Negative prompt
  imageCount?: number;           // Number of images (1-4 typical)
  referenceImage?: File;         // Reference image file
  mode?: 'text2image' | 'image2image' | 'edit' | 'upscale';
}
```

### GenerationResult

```typescript
interface GenerationResult {
  imageUrl: string;              // Full-size image URL or data URL
  thumbnailUrl?: string;         // Optional thumbnail
  metadata: {
    prompt: string;
    model: string;
    timestamp: number;
    aspectRatio?: string;
    safetyLevel?: string;
    negativePrompt?: string;
  };
}
```

---

## Best Practices

### 1. Error Handling

```typescript
async generate(params: GenerationParams): Promise<GenerationResult[]> {
  try {
    const response = await fetch(endpoint, {...});
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message}`);
    }
    
    return await this.processResponse(response);
  } catch (error: any) {
    console.error(`[${this.name}] Generation failed:`, error);
    throw new Error(`Failed to generate: ${error.message}`);
  }
}
```

### 2. Rate Limiting

```typescript
private rateLimiter = {
  requests: 0,
  resetTime: Date.now()
};

async generate(params: GenerationParams): Promise<GenerationResult[]> {
  // Check rate limit
  if (Date.now() < this.rateLimiter.resetTime) {
    if (this.rateLimiter.requests >= 10) {
      throw new Error('Rate limit exceeded. Please wait.');
    }
  } else {
    this.rateLimiter.requests = 0;
    this.rateLimiter.resetTime = Date.now() + 60000; // 1 minute
  }
  
  this.rateLimiter.requests++;
  
  // Continue with generation...
}
```

### 3. Response Caching

```typescript
private cache = new Map<string, GenerationResult[]>();

async generate(params: GenerationParams): Promise<GenerationResult[]> {
  const cacheKey = JSON.stringify(params);
  
  if (this.cache.has(cacheKey)) {
    console.log('[Cache] Returning cached result');
    return this.cache.get(cacheKey)!;
  }
  
  const results = await this.performGeneration(params);
  this.cache.set(cacheKey, results);
  
  return results;
}
```

### 4. Progress Reporting

```typescript
async generate(params: GenerationParams): Promise<GenerationResult[]> {
  // Emit progress events
  this.emit('progress', { stage: 'preparing', percent: 0 });
  
  const response = await fetch(endpoint, {...});
  this.emit('progress', { stage: 'processing', percent: 50 });
  
  const results = await this.processResponse(response);
  this.emit('progress', { stage: 'complete', percent: 100 });
  
  return results;
}
```

---

## Testing Your Plugin

### Unit Test Example

```typescript
import { YourEngine } from './YourEngine';

describe('YourEngine', () => {
  let engine: YourEngine;

  beforeEach(() => {
    engine = new YourEngine();
  });

  test('should initialize correctly', async () => {
    await engine.initialize({
      apiKey: 'test-key',
      model: 'your-model'
    });
    
    expect(engine.isReady()).toBe(true);
  });

  test('should generate images', async () => {
    await engine.initialize({
      apiKey: process.env.YOUR_API_KEY!,
      model: 'your-model'
    });

    const results = await engine.generate({
      prompt: 'a beautiful sunset',
      imageCount: 1
    });

    expect(results).toHaveLength(1);
    expect(results[0].imageUrl).toBeDefined();
  });

  test('should handle errors gracefully', async () => {
    await engine.initialize({
      apiKey: 'invalid-key',
      model: 'your-model'
    });

    await expect(
      engine.generate({ prompt: 'test' })
    ).rejects.toThrow();
  });
});
```

---

## Troubleshooting

### Common Issues

**Issue:** Module not appearing in selector
- **Fix:** Check registration in `ModuleLoader.registerModules()`

**Issue:** Import errors
- **Fix:** Verify file paths in `ModuleLoader.loadModule()`

**Issue:** API errors
- **Fix:** Check API key validity in `healthCheck()`

**Issue:** Memory leaks
- **Fix:** Implement proper cleanup in `dispose()`

---

## Support & Resources

- **Core Interface:** `/core/EngineInterface.ts`
- **Example Module:** `/modules/imagen4-generator/`
- **Documentation:** `BENCHMARK.md`
- **Issues:** GitHub Issues

---

**Last Updated:** 2026-01-06  
**Version:** 1.0.0
