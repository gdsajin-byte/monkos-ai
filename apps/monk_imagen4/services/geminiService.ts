
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
import { AspectRatio, ImageSize, SafetyLevel, SynthesisMode } from "../types";

export class GeminiService {
  private static getThreshold(level: SafetyLevel): HarmBlockThreshold {
    switch (level) {
      case 'BLOCK_LOW_AND_ABOVE': return HarmBlockThreshold.BLOCK_LOW_AND_ABOVE;
      case 'BLOCK_MEDIUM_AND_ABOVE': return HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE;
      case 'BLOCK_ONLY_HIGH': return HarmBlockThreshold.BLOCK_ONLY_HIGH;
      case 'BLOCK_NONE': return HarmBlockThreshold.BLOCK_NONE;
      default: return HarmBlockThreshold.BLOCK_ONLY_HIGH;
    }
  }

  private static async getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * T2I - Powered by Imagen 4.0
   */
  static async generateBatch(prompt: string, config: { aspectRatio: AspectRatio; safetyLevel: SafetyLevel; }): Promise<string[]> {
    const ai = await this.getAI();
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { 
          numberOfImages: 4, 
          aspectRatio: config.aspectRatio 
        },
      });
      return response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);
    } catch (error: any) {
      if (error.message?.includes("entity was not found") || error.message?.includes("API_KEY_INVALID")) {
        throw new Error("AUTH_REQUIRED");
      }
      throw error;
    }
  }

  /**
   * I2I, Edit, Upscale - Powered by Imagen 3 Pro (mapped to gemini-3-pro-image-preview)
   */
  static async refineImage(prompt: string, config: { 
    aspectRatio: AspectRatio; 
    imageSize: ImageSize; 
    inputImage: string; 
    mode: SynthesisMode;
    safetyLevel: SafetyLevel; 
  }): Promise<string> {
    const ai = await this.getAI();
    // Guideline: gemini-3-pro-image-preview is the high-quality model for 2K/4K and I2I/Edit tasks.
    const modelName = 'gemini-3-pro-image-preview';
    
    const mimeTypeMatch = config.inputImage.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = config.inputImage.includes(',') ? config.inputImage.split(',')[1] : config.inputImage;

    let instruction = "";
    switch(config.mode) {
      case 'UPSCALE':
        instruction = `[STRICT 4K RECONSTRUCTION] Perform high-fidelity super-resolution on this image. Target 4K resolution. Enhance details, textures, and edges while perfectly preserving the original artistic intent. ${prompt}`;
        break;
      case 'EDIT':
        instruction = `[NEURAL EDITING] Modify the provided image based on these specific instructions: ${prompt}. Blend changes seamlessly.`;
        break;
      case 'I2I':
      default:
        instruction = `[IMAGE-TO-IMAGE TRANSFORM] Using the provided image as a structural and thematic foundation, synthesize a new high-quality image. Prompt: ${prompt}`;
        break;
    }

    const parts = [
      { inlineData: { data: base64Data, mimeType: mimeType } },
      { text: instruction }
    ];

    try {
      const threshold = this.getThreshold(config.safetyLevel);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: { 
            aspectRatio: config.aspectRatio, 
            imageSize: config.imageSize // Spec says 1K, 2K, 4K supported here
          },
          safetySettings: [{ category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold }],
          tools: [{ googleSearch: {} }] // Real-time grounding for higher quality
        },
      });

      // Find the image part in the multi-part response
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      throw new Error("Neural response contained no image data. The model might have declined the request.");
    } catch (error: any) {
      if (error.message?.includes("entity was not found")) throw new Error("AUTH_REQUIRED");
      throw error;
    }
  }

  static async analyzeImage(imageData: string): Promise<any> {
    const ai = await this.getAI();
    const mimeTypeMatch = imageData.match(/data:([^;]+);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
    const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Perform a deep neural analysis. Provide: 1. A detailed English prompt to recreate it. 2. A description of its artistic style and lighting. 3. Key technical metadata tags. Respond strictly in JSON format." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            style: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["prompt", "style", "tags"]
        }
      }
    });

    try {
      return JSON.parse(response.text || "{}");
    } catch {
      throw new Error("Failed to parse neural analysis data.");
    }
  }
}
