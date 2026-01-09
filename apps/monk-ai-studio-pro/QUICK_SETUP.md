# 🚀 Vertex AI Premier 구독자용 빠른 설정

## 현재 상황
- ✅ Vertex AI Premier 구독 보유
- ✅ API 키 보유
- ⚠️ .env.local 파일 존재하나 플레이스홀더 상태
- ⚠️ 개발 모드 우회로 UI만 작동 중

---

## 즉시 실행 (5분)

### 1. API 키 설정

```bash
cd "/Users/monk_project_sync/monk_project /apps/monk-ai-studio-pro"

# 실제 Gemini/Vertex AI API 키로 교체
echo 'GEMINI_API_KEY=여기에_실제_키' > .env.local
```

### 2. 서버 재시작

터미널에서 실행 중인 `npm run dev` 중지 후 재시작:

```bash
# Ctrl+C로 중지
npm run dev
```

### 3. 브라우저 새로고침

http://localhost:3000/ 새로고침 → 즉시 사용 가능!

---

## 현재 아키텍처 (단순)

```
브라우저 (React)
    ↓
process.env.API_KEY (본인 Vertex 키)
    ↓
Gemini API 직접 호출
```

**장점**: 즉시 사용 가능, 추가 설정 없음  
**단점**: 클라이언트 노출, 빌드 파일에 포함됨

---

## 다음 단계 (선택)

### Option A: 현재 상태 유지 (개인 사용)
- 본인만 사용
- 추가 작업 없음
- 빌드 배포 시 키 노출 주의

### Option B: 최소 백엔드 추가 (1-2시간)
- API 키 보안
- 나중에 다중 사용자 확장 가능
- 아래 설정 따라하기

---

## Option B: 최소 백엔드 설정

### 1. 백엔드 폴더 생성

```bash
mkdir backend
cd backend
npm init -y

npm install express cors dotenv @google/genai
npm install --save-dev nodemon
```

### 2. 서버 파일 생성

**backend/server.js:**
```javascript
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 이미지 생성
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, config } = req.body;
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config: { numberOfImages: 4, aspectRatio: config.aspectRatio }
    });
    
    res.json({
      success: true,
      images: response.generatedImages.map(img => 
        `data:image/png;base64,${img.image.imageBytes}`
      )
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이미지 편집/업스케일
app.post('/api/refine', async (req, res) => {
  try {
    const { prompt, config, inputImage, mode } = req.body;
    
    const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = inputImage.split(',')[1];
    
    let instruction = '';
    if (mode === 'UPSCALE') {
      instruction = `[STRICT 4K RECONSTRUCTION] ${prompt}`;
    } else if (mode === 'EDIT') {
      instruction = `[NEURAL EDITING] ${prompt}`;
    } else {
      instruction = `[IMAGE-TO-IMAGE TRANSFORM] ${prompt}`;
    }
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: instruction }
        ]
      },
      config: {
        imageConfig: { 
          aspectRatio: config.aspectRatio, 
          imageSize: config.imageSize 
        }
      }
    });
    
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData) throw new Error('No image in response');
    
    res.json({
      success: true,
      image: `data:image/png;base64,${part.inlineData.data}`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이미지 분석
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    const mimeTypeMatch = imageData.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = imageData.split(',')[1];
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: 'Perform a deep neural analysis. Provide: 1. A detailed English prompt to recreate it. 2. A description of its artistic style and lighting. 3. Key technical metadata tags. Respond strictly in JSON format.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            prompt: { type: 'STRING' },
            style: { type: 'STRING' },
            tags: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['prompt', 'style', 'tags']
        }
      }
    });
    
    const analysis = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend proxy running on http://localhost:${PORT}`);
});
```

### 3. 백엔드 .env 파일

**backend/.env:**
```env
GEMINI_API_KEY=여기에_실제_Vertex_키
PORT=3001
```

### 4. 백엔드 package.json 수정

```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon server.js"
  }
}
```

### 5. 프론트엔드 서비스 수정

**services/geminiService.ts 전체 교체:**
```typescript
import { AspectRatio, ImageSize, SafetyLevel, SynthesisMode } from "../types";

const API_BASE = 'http://localhost:3001/api';

export class GeminiService {
  static async generateBatch(prompt: string, config: { aspectRatio: AspectRatio; safetyLevel: SafetyLevel; }): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config })
      });
      
      if (!response.ok) throw new Error('Generation failed');
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      return data.images;
    } catch (error: any) {
      if (error.message?.includes('AUTH')) throw new Error('AUTH_REQUIRED');
      throw error;
    }
  }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, config, inputImage: config.inputImage, mode: config.mode })
      });
      
      if (!response.ok) throw new Error('Refinement failed');
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      return data.image;
    } catch (error: any) {
      if (error.message?.includes('AUTH')) throw new Error('AUTH_REQUIRED');
      throw error;
    }
  }

  static async analyzeImage(imageData: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      return data.analysis;
    } catch (error) {
      throw new Error('Failed to analyze image');
    }
  }
}
```

### 6. 동시 실행 스크립트

**루트 package.json에 추가:**
```json
{
  "scripts": {
    "dev:full": "concurrently \"npm run dev\" \"cd backend && npm run dev\"",
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

```bash
npm install -D concurrently
npm run dev:full
```

---

## 최종 아키텍처

```
브라우저 (React :3000)
    ↓ fetch
Backend Proxy (:3001)
    ↓ API_KEY (안전)
Gemini API
```

---

## 체크리스트

### 즉시 사용 (현재 방식)
- [ ] .env.local에 실제 키 입력
- [ ] 서버 재시작
- [ ] 브라우저 테스트

### 백엔드 추가 (권장)
- [ ] backend 폴더 생성
- [ ] server.js 작성
- [ ] backend/.env 설정
- [ ] 프론트엔드 서비스 수정
- [ ] 동시 실행 확인

---

## 문제 해결

### Q: API 키는 어디서?
A: [Google AI Studio](https://ai.google.dev/) 또는 [Vertex AI Console](https://console.cloud.google.com/vertex-ai)

### Q: Vertex AI vs Gemini API 차이?
A: 같은 모델, Vertex는 GCP 통합 버전. Gemini API 키도 작동함.

### Q: Premier 구독 확인?
A: GCP Console → Billing → Vertex AI 사용량 확인

### Q: 비용 걱정?
A: Premier 플랜 내에서 무제한 (쿼터 내), 추가 비용 없음
