/**
 * CMS 네이버 검색 API 프록시
 * GET /api/admin/search?query={검색어}&type={news|blog|image}&start=1&display=10
 */
import { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const ALLOWED_TYPES = ['news', 'blog', 'image'];

export async function handleSearch(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Naver API 키가 설정되지 않았습니다' }));
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const query = url.searchParams.get('query');
  const type = url.searchParams.get('type') || 'news';
  const start = parseInt(url.searchParams.get('start') || '1', 10);
  const display = Math.min(parseInt(url.searchParams.get('display') || '10', 10), 100);

  if (!query) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '검색어를 입력하세요' }));
    return;
  }

  if (!ALLOWED_TYPES.includes(type)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `허용된 타입: ${ALLOWED_TYPES.join(', ')}` }));
    return;
  }

  try {
    const naverUrl = `https://openapi.naver.com/v1/search/${type}?query=${encodeURIComponent(query)}&start=${start}&display=${display}`;
    const response = await fetch(naverUrl, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      log(`[Search] Naver API 오류: ${response.status} ${errText}`, 'WARNING');
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Naver API 오류 (${response.status})` }));
      return;
    }

    const data = await response.json();

    const items = (data.items || []).map(item => {
      const result = {
        title: stripHtml(item.title),
        link: item.link,
        description: stripHtml(item.description),
      };
      if (type === 'news' || type === 'blog') {
        result.pubDate = item.pubDate || '';
        result.source = item.originallink || item.bloggerlink || '';
      }
      if (type === 'image') {
        result.thumbnail = item.thumbnail || item.link;
        result.sizewidth = item.sizewidth;
        result.sizeheight = item.sizeheight;
      }
      return result;
    });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      type,
      total: data.total || 0,
      start: data.start || start,
      display: data.display || display,
      items,
    }));
  } catch (err) {
    log(`[Search] 프록시 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '검색 중 오류가 발생했습니다' }));
  }
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<\/?[^>]+(>|$)/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
