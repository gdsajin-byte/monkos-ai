/**
 * CMS 이미지 업로드 핸들러
 * GCS 버킷에 이미지 업로드 (Toast UI Editor 호환)
 */
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import { GCS_BUCKET, log, firestore } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const blogCollection = firestore.collection('blog_posts');

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuf = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuf) + boundaryBuf.length;

  while (start < buffer.length) {
    const nextBoundary = buffer.indexOf(boundaryBuf, start);
    if (nextBoundary === -1) break;

    const part = buffer.subarray(start, nextBoundary);
    // \r\n\r\n separates headers from body
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) { start = nextBoundary + boundaryBuf.length; continue; }

    const headerStr = part.subarray(0, headerEnd).toString();
    const body = part.subarray(headerEnd + 4, part.length - 2); // trim trailing \r\n

    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (nameMatch) {
      parts.push({
        name: nameMatch[1],
        filename: filenameMatch ? filenameMatch[1] : null,
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : null,
        data: body,
      });
    }

    start = nextBoundary + boundaryBuf.length;
  }

  return parts;
}

export async function handleImageDelete(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const filename = decodeURIComponent(req.url.split('/api/admin/images/')[1]);
  if (!filename) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Filename required' }));
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const force = url.searchParams.get('force') === 'true';

  try {
    // 역링크 체크: blog_posts에서 이 이미지를 사용하는 글 검색
    const postsSnap = await blogCollection.get();
    const usedIn = [];
    postsSnap.docs.forEach(doc => {
      const data = doc.data();
      if ((data.content || '').includes(filename) || (data.thumbnail || '').includes(filename)) {
        usedIn.push({ slug: doc.id, title: data.title });
      }
    });

    if (usedIn.length > 0 && !force) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        warning: true,
        usedIn,
        message: `이 이미지는 ${usedIn.length}개 글에서 사용 중입니다`
      }));
    }

    const file = bucket.file(`blog/${filename}`);
    await file.delete();
    log(`[CMS] 이미지 삭제: blog/${filename}${usedIn.length ? ` (경고 무시: ${usedIn.length}건 참조)` : ''}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    log(`[CMS] 이미지 삭제 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleImageList(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const [files] = await bucket.getFiles({ prefix: 'blog/' });

    const images = files
      .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name))
      .filter(f => !f.name.replace('blog/', '').includes('/'))  // blog/{slug}/ nested 제외
      .sort((a, b) => new Date(b.metadata.timeCreated) - new Date(a.metadata.timeCreated))
      .map(f => ({
        name: f.name.replace('blog/', ''),
        url: `https://storage.googleapis.com/${GCS_BUCKET}/${f.name}`,
        size: parseInt(f.metadata.size, 10),
        created: f.metadata.timeCreated,
      }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ images }));
  } catch (err) {
    log(`[CMS] 이미지 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

export async function handleUpload(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  try {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'multipart/form-data 필요' }));
    }

    // raw body 수집
    const chunks = [];
    let totalSize = 0;
    for await (const chunk of req) {
      totalSize += chunk.length;
      if (totalSize > MAX_FILE_SIZE) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: '파일 크기 제한 초과 (5MB)' }));
      }
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const parts = parseMultipart(buffer, boundaryMatch[1]);
    const filePart = parts.find(p => p.filename);
    if (!filePart) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: '이미지 파일 필요' }));
    }

    if (!ALLOWED_MIMES.includes(filePart.contentType)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: `허용되지 않는 파일 형식: ${filePart.contentType}` }));
    }

    // WebP 변환 + GCS 업로드
    const timestamp = Date.now();
    const safeName = filePart.filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    let imageData = filePart.data;
    let uploadContentType = filePart.contentType;
    let fileName = safeName;

    // JPEG 변환 (GIF 제외 — 애니메이션 손실 방지)
    // JPEG 통일: 외부 배포 호환 (Medium, 카카오톡 등 WebP 미지원 플랫폼 대응)
    if (filePart.contentType !== 'image/gif') {
      imageData = await sharp(filePart.data).jpeg({ quality: 85 }).toBuffer();
      uploadContentType = 'image/jpeg';
      fileName = fileName.replace(/\.(png|webp)$/i, '.jpg');
      if (!fileName.match(/\.jpe?g$/i)) fileName += '.jpg';
    }

    const gcsPath = `blog/${timestamp}_${fileName}`;
    const file = bucket.file(gcsPath);

    await file.save(imageData, {
      metadata: { contentType: uploadContentType },
      public: true,
    });

    const url = `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`;
    log(`[CMS] 이미지 업로드: ${gcsPath} (${(filePart.data.length / 1024).toFixed(1)}KB → ${(imageData.length / 1024).toFixed(1)}KB jpeg)`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url }));
  } catch (err) {
    log(`[CMS] 업로드 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}
