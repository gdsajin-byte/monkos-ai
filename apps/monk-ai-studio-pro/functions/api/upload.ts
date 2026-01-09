// Cloudflare Pages Function for image upload to R2 and metadata to D1
/// <reference types="@cloudflare/workers-types" />

interface Env {
  IMAGES_BUCKET: R2Bucket;
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const formData = await request.formData();
    
    const imageFile = formData.get('image') as File;
    const metadata = JSON.parse(formData.get('metadata') as string);
    
    if (!imageFile) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const imageId = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;
    const filename = `생성모델폴더/${imageId}.png`;

    // Upload to R2
    const arrayBuffer = await imageFile.arrayBuffer();
    await env.IMAGES_BUCKET.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: 'image/png',
      },
      customMetadata: {
        prompt: metadata.prompt || '',
        model: metadata.model || '',
        mode: metadata.mode || '',
      }
    });

    // Get public URL (if R2 bucket has public access configured)
    const imageUrl = `https://your-r2-domain.com/${filename}`;

    // Save metadata to D1
    const result = await env.DB.prepare(`
      INSERT INTO images (
        id, url, prompt, model, mode, aspect_ratio, 
        image_size, safety_level, timestamp, project_id,
        comment, tags, style_analysis
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      imageId,
      imageUrl,
      metadata.prompt,
      metadata.model,
      metadata.mode,
      metadata.aspectRatio,
      metadata.imageSize,
      metadata.safetyLevel,
      timestamp,
      metadata.projectId || 'INTERNAL',
      metadata.comment || null,
      metadata.tags ? JSON.stringify(metadata.tags) : null,
      metadata.styleAnalysis || null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      imageId,
      imageUrl,
      metadata: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Upload failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
