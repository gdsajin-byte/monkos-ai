/**
 * Google Cloud Storage Service
 * 생성된 이미지 저장
 */

import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'gen-lang-client-0105707468';
const BUCKET_NAME = process.env.GCS_BUCKET || 'monk-ai-images';

// Workload Identity 사용 - Cloud Run에서 자동 인증
const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET_NAME);

export interface UploadResult {
  url: string;
  path: string;
  id: string;
}

/**
 * Base64 이미지를 GCS에 업로드
 */
export async function uploadImage(
  base64Data: string, 
  options: {
    sector: 'soso' | 'mina' | 'yonga' | 'ssanga';
    category?: string;
    userId?: string;
    mimeType?: string;
  }
): Promise<UploadResult> {
  const { sector, category = 'general', userId = 'anonymous', mimeType = 'image/png' } = options;
  
  const id = uuidv4();
  const extension = mimeType.split('/')[1] || 'png';
  const date = new Date().toISOString().split('T')[0];  // YYYY-MM-DD
  
  // 경로: sector/category/date/userId/id.ext
  const path = `${sector}/${category}/${date}/${userId}/${id}.${extension}`;
  
  const file = bucket.file(path);
  const buffer = Buffer.from(base64Data, 'base64');
  
  await file.save(buffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        sector,
        category,
        userId,
        uploadedAt: new Date().toISOString()
      }
    }
  });
  
  // 공개 URL 생성 (버킷이 공개 설정된 경우)
  // 또는 서명된 URL 사용
  const url = `https://storage.googleapis.com/${BUCKET_NAME}/${path}`;
  
  return { url, path, id };
}

/**
 * 서명된 URL 생성 (비공개 버킷용)
 */
export async function getSignedUrl(path: string, expiresInMinutes: number = 60): Promise<string> {
  const file = bucket.file(path);
  
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000
  });
  
  return url;
}

/**
 * 이미지 삭제
 */
export async function deleteImage(path: string): Promise<void> {
  const file = bucket.file(path);
  await file.delete();
}

/**
 * 버킷 존재 확인 및 생성
 */
export async function ensureBucketExists(): Promise<void> {
  const [exists] = await bucket.exists();
  
  if (!exists) {
    await storage.createBucket(BUCKET_NAME, {
      location: 'ASIA-NORTHEAST3',  // 서울
      storageClass: 'STANDARD'
    });
    console.log(`✅ Bucket ${BUCKET_NAME} created`);
  }
}
