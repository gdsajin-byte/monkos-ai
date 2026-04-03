import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_BASE = 'https://api.elevenlabs.io';

const app = express();

// ── 로깅 ──
const isCloudRun = !!process.env.K_SERVICE;
function log(msg) {
  if (isCloudRun) {
    console.log(JSON.stringify({ severity: 'INFO', message: msg }));
  } else {
    console.log(msg);
  }
}

// ── 정적 파일 서빙 (Vite build output) ──
app.use(express.static(join(__dirname, 'dist'), {
  maxAge: '1h',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ── ElevenLabs API 프록시 ──
app.all('/api/elevenlabs/*', async (req, res) => {
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  // /api/elevenlabs/v1/... → https://api.elevenlabs.io/v1/...
  const targetPath = req.params[0]; // wildcard capture
  const targetUrl = `${ELEVENLABS_BASE}/${targetPath}`;

  try {
    const headers = {
      'xi-api-key': ELEVENLABS_API_KEY,
    };

    // POST/PUT 요청 시 body 전달
    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      // raw body 수집
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      fetchOptions.body = body;
      headers['Content-Type'] = req.headers['content-type'] || 'application/json';
    }

    log(`[Proxy] ${req.method} ${targetUrl}`);

    const upstream = await fetch(targetUrl, fetchOptions);

    // 응답 헤더 전달
    res.status(upstream.status);
    const contentType = upstream.headers.get('content-type');
    if (contentType) res.set('Content-Type', contentType);

    // 스트리밍 응답
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));

  } catch (err) {
    log(`[Proxy] ERROR: ${err.message}`);
    res.status(502).json({ error: 'Proxy error', message: err.message });
  }
});

// ── SPA 폴백 ──
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// ── 서버 시작 ──
app.listen(PORT, () => {
  log(`[pt.monkos.ai] Server running on port ${PORT}`);
  log(`[pt.monkos.ai] ElevenLabs API key: ${ELEVENLABS_API_KEY ? 'configured' : 'NOT SET'}`);
});
