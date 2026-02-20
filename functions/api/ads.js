// Cloudflare Pages Function - Ad Image Rotation (이미지 프로 대기화면)
// GCS manifest.json 기반 동적 로드 — 재배포 불필요

const MANIFEST_URL = 'https://storage.googleapis.com/monk-ai-images/ads/manifest.json';

// 매니페스트 없을 때 폴백
const FALLBACK = {
  success: true,
  images: [],
  rotate: 6000,
  transition: 800
};

export async function onRequestGet() {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=60'
  };

  try {
    const res = await fetch(MANIFEST_URL, {
      headers: { 'Cache-Control': 'no-cache' }
    });

    if (!res.ok) {
      return new Response(JSON.stringify(FALLBACK), { headers: corsHeaders });
    }

    const manifest = await res.json();

    return new Response(JSON.stringify({
      success: true,
      images: manifest.images || [],
      rotate: manifest.rotate || 6000,
      transition: manifest.transition || 800
    }), { headers: corsHeaders });

  } catch (error) {
    return new Response(JSON.stringify(FALLBACK), { headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
