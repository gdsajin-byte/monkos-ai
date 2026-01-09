// Client-side service for uploading images to Cloudflare R2 via Pages Function

interface UploadResponse {
  success: boolean;
  imageId?: string;
  imageUrl?: string;
  error?: string;
}

export class StorageService {
  private static apiEndpoint = '/api/upload';

  /**
   * Upload image to R2 and save metadata to D1
   */
  static async saveImage(imageData: string, metadata: {
    prompt: string;
    model: string;
    mode: string;
    aspectRatio: string;
    imageSize: string;
    safetyLevel?: string;
    projectId?: string;
    comment?: string;
    tags?: string[];
    styleAnalysis?: string;
  }): Promise<UploadResponse> {
    try {
      // Convert base64 to Blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Create FormData
      const formData = new FormData();
      formData.append('image', blob, 'generated-image.png');
      formData.append('metadata', JSON.stringify(metadata));

      // Upload
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      if (!text) {
        console.error('Empty response from upload API');
        throw new Error('Empty response from server');
      }
      
      const result = JSON.parse(text) as { error?: string; imageId?: string; imageUrl?: string };
      
      if (!response.ok) {
        throw new Error(result?.error || 'Upload failed');
      }

      return {
        success: true,
        imageId: result?.imageId,
        imageUrl: result?.imageUrl
      };
    } catch (error: any) {
      console.error('Storage service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to save image'
      };
    }
  }

  /**
   * Save multiple images (batch)
   */
  static async saveBatch(images: Array<{ data: string; metadata: any }>): Promise<UploadResponse[]> {
    const results = await Promise.all(
      images.map(img => this.saveImage(img.data, img.metadata))
    );
    return results;
  }
}
