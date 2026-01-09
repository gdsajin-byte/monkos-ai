# 🔐 API 키 보안 가이드

## 현재 문제점
- API 키가 클라이언트 사이드에 노출 (`process.env.API_KEY`)
- 빌드 시 번들에 포함되어 브라우저에서 추출 가능
- Rate limiting 우회 불가

---

## 해결 방안

### ⭐ 단계별 구현 (권장 순서)

#### **Phase 1: 백엔드 프록시 추가 (필수)**

```
프로젝트 구조:
monk-ai-studio-pro/
├── frontend/          # 기존 React 앱
└── backend/           # 새로운 API 서버
    ├── server.js
    ├── routes/
    │   └── gemini.js  # Gemini API 프록시
    └── .env           # API 키 저장 (서버 전용)
```

**백엔드 서버 (Express)**
```javascript
// backend/server.js
import express from 'express';
import cors from 'cors';
import geminiRoutes from './routes/gemini.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));

app.use(express.json());
app.use('/api/gemini', geminiRoutes);

app.listen(3001, () => {
  console.log('🔒 Secure API proxy running on port 3001');
});
```

**Gemini 프록시 라우트**
```javascript
// backend/routes/gemini.js
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY  // 서버에서만 읽기
});

// 이미지 생성 엔드포인트
router.post('/generate', async (req, res) => {
  try {
    const { prompt, config } = req.body;
    
    // Rate limiting 체크
    // 사용자 인증 체크
    // 크레딧 차감
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt,
      config
    });
    
    res.json({
      success: true,
      images: response.generatedImages.map(img => 
        `data:image/png;base64,${img.image.imageBytes}`
      )
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
```

**프론트엔드 수정**
```typescript
// services/geminiService.ts
static async generateBatch(prompt: string, config: any): Promise<string[]> {
  // 기존: 직접 Gemini API 호출 ❌
  // const ai = await this.getAI();
  // const response = await ai.models.generateImages(...);
  
  // 새로운 방식: 자체 백엔드 호출 ✅
  const response = await fetch('http://localhost:3001/api/gemini/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({ prompt, config })
  });
  
  const data = await response.json();
  return data.images;
}
```

---

#### **Phase 2: 사용자 인증 시스템**

```javascript
// backend/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// routes/gemini.js에 적용
router.post('/generate', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  // 사용자별 사용량 추적
});
```

---

#### **Phase 3: Rate Limiting**

```javascript
// backend/middleware/rateLimit.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:'
  }),
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100회
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// 적용
app.use('/api/gemini', apiLimiter);
```

---

#### **Phase 4: 크레딧 시스템**

```javascript
// backend/services/creditService.js
export class CreditService {
  static async deductCredits(userId, operation) {
    const cost = {
      'imagen-4.0': 10,
      'imagen-3-pro': 5,
      'upscale': 5,
      'analysis': 1
    }[operation];
    
    const user = await db.users.findOne({ id: userId });
    
    if (user.credits < cost) {
      throw new Error('Insufficient credits');
    }
    
    await db.users.update(
      { id: userId },
      { $inc: { credits: -cost } }
    );
    
    // 사용 내역 기록
    await db.usage.insert({
      userId,
      operation,
      cost,
      timestamp: Date.now()
    });
  }
}

// routes/gemini.js
router.post('/generate', authenticateToken, async (req, res) => {
  await CreditService.deductCredits(req.user.id, 'imagen-4.0');
  // ... 이미지 생성
});
```

---

#### **Phase 5: API 키 로테이션**

```javascript
// backend/services/apiKeyManager.js
export class APIKeyManager {
  constructor() {
    this.keys = [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
    ];
    this.currentIndex = 0;
  }
  
  getNextKey() {
    const key = this.keys[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return key;
  }
  
  async markKeyAsFailed(key) {
    // 실패한 키는 일시적으로 제외
    this.keys = this.keys.filter(k => k !== key);
    
    // 1시간 후 복구
    setTimeout(() => {
      this.keys.push(key);
    }, 60 * 60 * 1000);
  }
}
```

---

## 🚀 빠른 시작 (Phase 1 구현)

### 1. 백엔드 설정

```bash
# backend 폴더 생성
mkdir backend && cd backend
npm init -y

# 의존성 설치
npm install express cors dotenv @google/genai
npm install --save-dev nodemon

# .env 파일 생성
echo "GEMINI_API_KEY=your_actual_key" > .env
echo "JWT_SECRET=your_jwt_secret" >> .env
echo "PORT=3001" >> .env
```

### 2. 프론트엔드 수정

```typescript
// vite.config.ts - API 키 제거
export default defineConfig({
  // define 섹션 완전 제거 또는 더미 값
  define: {
    'process.env.API_KEY': JSON.stringify('BACKEND_PROXY')
  }
});
```

### 3. 동시 실행

```json
// package.json (루트)
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev"
  }
}
```

---

## 🎯 최종 아키텍처

```
┌─────────────┐
│  브라우저    │
│  (React)    │
└──────┬──────┘
       │ ❌ API 키 없음
       │
       ▼
┌─────────────────┐
│  자체 백엔드     │
│  (Express)      │
│  ✅ API 키 보관  │
└──────┬──────────┘
       │
       ├─► 인증 체크 (JWT)
       ├─► Rate Limiting (Redis)
       ├─► 크레딧 차감 (DB)
       │
       ▼
┌─────────────────┐
│  Gemini API     │
│  (Google)       │
└─────────────────┘
```

---

## 📊 보안 레벨 비교

| 방법 | 보안성 | 구현 난이도 | 추천 |
|------|--------|------------|------|
| 클라이언트 직접 호출 | ⚠️ 낮음 | 쉬움 | ❌ 개발용만 |
| 백엔드 프록시 | ✅ 높음 | 중간 | ✅ 필수 |
| + 인증 | ✅✅ 매우 높음 | 중간 | ✅ 권장 |
| + Rate Limiting | ✅✅✅ 최고 | 어려움 | ⭐ 프로덕션 |

---

## 🔍 체크리스트

- [ ] 백엔드 API 서버 구축
- [ ] API 키를 서버로 이동
- [ ] 프론트엔드 → 백엔드 통신 구현
- [ ] JWT 인증 시스템
- [ ] Rate Limiting 설정
- [ ] 크레딧 시스템 구현
- [ ] API 키 로테이션
- [ ] 에러 핸들링 & 로깅
- [ ] HTTPS 적용 (프로덕션)
- [ ] CORS 설정 검증

---

## 💡 참고 자료

- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Authentication](https://jwt.io/)
- [Rate Limiting with Redis](https://github.com/express-rate-limit/express-rate-limit)
- [API Security Checklist](https://github.com/shieldfy/API-Security-Checklist)
