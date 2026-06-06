// Cloudflare Pages Function - API Proxy with Rate Limiting
/// <reference types="@cloudflare/workers-types" />

interface Env {
  IMAGES_BUCKET: R2Bucket;
  DB: D1Database;
  GEMINI_API_KEY: string;
}

const RATE_LIMIT_PER_HOUR = 3;
const DAILY_QUOTA = 100;

// Module-specific limits (can be adjusted per module)
const MODULE_LIMITS: Record<string, { hourly: number; daily: number }> = {
  'imagen4': { hourly: 3, daily: 100 },
  'imagen3pro': { hourly: 5, daily: 150 },
  'lumina': { hourly: 10, daily: 200 }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    
    // Detect module from request path or header
    const url = new URL(request.url);
    const module = url.searchParams.get('module') || 
                   request.headers.get('X-Module') || 
                   'imagen4';
    
    // Get module-specific limits
    const limits = MODULE_LIMITS[module] || { hourly: RATE_LIMIT_PER_HOUR, daily: DAILY_QUOTA };
    
    // Get client IP
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';
    
    // Check rate limiting
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Check IP rate limit (per hour)
    const ipUsage = await env.DB.prepare(`
      SELECT SUM(request_count) as total 
      FROM usage_logs 
      WHERE ip_address = ? AND timestamp > ?
    `).bind(clientIP, oneHourAgo).first() as { total: number } | null;
    
    if (ipUsage && ipUsage.total >= limits.hourly) {
      return new Response(JSON.stringify({ 
        error: '시간당 요청 제한을 초과했습니다. 1시간 후 다시 시도해주세요.',
        limit: limits.hourly,
        remaining: 0
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check daily quota
    const dailyUsage = await env.DB.prepare(`
      SELECT COUNT(*) as total 
      FROM usage_logs 
      WHERE timestamp > ?
    `).bind(oneDayAgo).first() as { total: number } | null;
    
    if (dailyUsage && dailyUsage.total >= limits.daily) {
      return new Response(JSON.stringify({ 
        error: '일일 전체 할당량을 초과했습니다. 내일 다시 시도해주세요.',
        dailyLimit: limits.daily
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request
    const body = await request.json() as {
      prompt: string;
      negativePrompt?: string;
      aspectRatio?: string;
      imageCount?: number;
    };
    const { prompt, negativePrompt, aspectRatio, imageCount } = body;
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Log usage
    await env.DB.prepare(`
      INSERT INTO usage_logs (ip_address, user_agent, endpoint, request_count, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).bind(clientIP, userAgent, `/api/generate/${module}`, 1, now).run();
    
    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:generateImages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        prompt: prompt,
        ...(negativePrompt && { negativePrompt }),
        config: {
          numberOfImages: imageCount || 4,
          aspectRatio: aspectRatio || '1:1',
          safetyFilterLevel: 'block_low_and_above',
          personGeneration: 'allow_adult',
          enhancePrompt: false,
        }
      })
    });
    
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Image generation failed',
        details: errorText
      }), {
        status: geminiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await geminiResponse.json() as Record<string, any>;
    
    // Calculate remaining quota
    const remaining = limits.hourly - ((ipUsage?.total as number || 0) + 1);
    
    return new Response(JSON.stringify({
      ...result,
      rateLimit: {
        limit: limits.hourly,
        remaining: Math.max(0, remaining),
        resetAt: oneHourAgo + (60 * 60 * 1000)
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': limits.hourly.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString()
      }
    });
    
  } catch (error: any) {
    console.error('Generate API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
