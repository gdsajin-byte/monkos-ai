/**
 * Imagen 3 Pro UI Component
 * Interface for image transformation and editing
 */

import React, { useState, useEffect, useRef } from 'react';
import { Imagen3ProSuite } from './Imagen3ProSuite';
import { GenerationParams, GenerationResult } from '../../core/EngineInterface';
import { PromptSection } from '../../components/PromptSection';
import { ControlPanel } from '../../components/ControlPanel';
import { BatchDisplay } from '../../components/BatchDisplay';

interface Imagen3ProUIProps {
  apiKey: string;
}

export const Imagen3ProUI: React.FC<Imagen3ProUIProps> = ({ apiKey }) => {
  const [engine] = useState(() => new Imagen3ProSuite());
  const [mode, setMode] = useState<'image2image' | 'edit' | 'upscale'>('image2image');
  const [fixedPrompt, setFixedPrompt] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [safetyLevel, setSafetyLevel] = useState<string>('BLOCK_ONLY_HIGH');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    engine.initialize({ apiKey, model: 'imagen-3.0-generate-001' });
  }, [apiKey]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const fullPrompt = [fixedPrompt, mainPrompt].filter(Boolean).join(', ');
      
      const params: GenerationParams = {
        prompt: fullPrompt,
        negativePrompt,
        aspectRatio,
        safetyLevel,
        imageCount: 4,
        mode,
        referenceImage: uploadedImage
      };

      const generatedResults = await engine.generate(params);
      setResults(generatedResults);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950">
      {/* Sidebar */}
      <aside className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">✨ Imagen 3 Pro Suite</h2>
          <p className="text-sm text-white/60">Transform & Edit Images</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mode Selector */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {['image2image', 'edit', 'upscale'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    mode === m
                      ? 'bg-green-600 text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {m === 'image2image' ? 'I2I' : m === 'edit' ? 'Edit' : 'Upscale'}
                </button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-3">Reference Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 text-sm transition-all"
            >
              {uploadedImage ? '✓ Image Uploaded' : '📁 Upload Image'}
            </button>
            {previewUrl && (
              <div className="mt-3">
                <img src={previewUrl} alt="Preview" className="w-full rounded-lg border border-white/10" />
              </div>
            )}
          </div>

          <PromptSection
            fixedPrompt={fixedPrompt}
            setFixedPrompt={setFixedPrompt}
            mainPrompt={mainPrompt}
            setMainPrompt={setMainPrompt}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
          />

          <ControlPanel
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            safetyLevel={safetyLevel}
            setSafetyLevel={setSafetyLevel}
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !uploadedImage || !mainPrompt}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isGenerating ? '⚡ Processing...' : '✨ Transform Image'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <BatchDisplay
          images={results.map((r, i) => ({
            id: `img-${i}`,
            url: r.imageUrl,
            thumbnailUrl: r.thumbnailUrl,
            aspectRatio: r.metadata.aspectRatio || '1:1',
            timestamp: r.metadata.timestamp,
            safetyLevel: r.metadata.safetyLevel || 'BLOCK_ONLY_HIGH',
            metadata: {
              prompt: r.metadata.prompt,
              negativePrompt: r.metadata.negativePrompt,
              model: r.metadata.model
            }
          }))}
          currentBatch={results.map((_, i) => `img-${i}`)}
          onDelete={(id) => {
            setResults(results.filter((_, i) => `img-${i}` !== id));
          }}
          onExpand={(id) => {
            console.log('Expand:', id);
          }}
        />
      </main>
    </div>
  );
};
