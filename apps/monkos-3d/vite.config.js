import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 프로젝트 루트(monk_project)의 .env에서 API 키 로딩
function getApiKey() {
  try {
    const envPath = resolve(__dirname, '../../.env');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/ELEVENLABS_API_KEY=(.+)/);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

const apiKey = getApiKey();

export default defineConfig({
  server: {
    proxy: {
      '/api/elevenlabs': {
        target: 'https://api.elevenlabs.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/elevenlabs/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('xi-api-key', apiKey);
          });
        },
      },
    },
  },
});
