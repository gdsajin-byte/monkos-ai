/**
 * SEO 유틸 — Google Indexing API + llms.txt + Sitemap ping
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleAuth } from 'google-auth-library';
import { log } from '../shared/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function requestIndexing(url) {
  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/indexing'] });
    const client = await auth.getClient();
    const res = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });
    log(`[SEO] Indexing API 성공: ${url} → ${res.status}`);
  } catch (e) {
    log(`[SEO] Indexing API 실패: ${url} — ${e.message}`, 'WARN');
  }
}

export function appendToLlmsTxt(slug, title) {
  try {
    const llmsPath = resolve(__dirname, '../../public/llms.txt');
    if (!existsSync(llmsPath)) return;
    const content = readFileSync(llmsPath, 'utf-8');
    const blogUrl = `https://monkos.ai/blog/${slug}`;
    if (content.includes(blogUrl)) return;
    const citation = content.indexOf('## Citation');
    const entry = `- ${title}: ${blogUrl}\n`;
    if (citation > -1) {
      const updated = content.slice(0, citation) + entry + '\n' + content.slice(citation);
      writeFileSync(llmsPath, updated, 'utf-8');
    } else {
      writeFileSync(llmsPath, content + '\n' + entry, 'utf-8');
    }
    log(`[SEO] llms.txt 갱신: ${slug}`);
  } catch (e) {
    log(`[SEO] llms.txt 갱신 실패: ${e.message}`, 'WARN');
  }
}

export function pingSitemap() {
  fetch('https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml').catch(() => {});
}
