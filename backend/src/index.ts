/**
 * MONK AI Backend - Cloud Run Entry Point
 * Vertex AI Imagen 4.0 연동
 */

import express from 'express';
import cors from 'cors';
import { photoRouter } from './routes/photo';
import { lookbookRouter } from './routes/lookbook';
import { modelRouter } from './routes/model';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS 설정 - MONK.kr 도메인 허용
app.use(cors({
  origin: [
    'https://monk.kr',
    'https://www.monk.kr',
    'https://monk-kr.pages.dev',
    'https://main.monk-kr.pages.dev',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Sector']
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MONK AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// API Routes
app.use('/api/photo', photoRouter);      // 소소 - AI Photo
app.use('/api/lookbook', lookbookRouter); // 소소 - Lookbook
app.use('/api/model', modelRouter);       // 민아 - AI Model

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: '서버 오류가 발생했습니다.',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MONK AI Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Project: ${process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0105707468'}`);
});
