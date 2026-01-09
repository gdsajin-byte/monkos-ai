/**
 * Imagen 4 Generator UI Component
 * Clean interface for text-to-image generation
 */

import React, { useState, useEffect } from 'react';
import { Imagen4Generator } from './Imagen4Generator';
import { GenerationParams, GenerationResult } from '../../core/EngineInterface';
import { ControlPanel } from '../../components/ControlPanel';
import { BatchDisplay } from '../../components/BatchDisplay';

interface Imagen4UIProps {
  apiKey: string;
}

export const Imagen4UI: React.FC<Imagen4UIProps> = ({ apiKey }) => {
  const [engine] = useState(() => new Imagen4Generator());
  const [fixedPrompt, setFixedPrompt] = useState('');
  const [mainPrompt, setMainPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [safetyLevel, setSafetyLevel] = useState<string>('block_low_and_above');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTagging, setShowTagging] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    if (apiKey) {
      console.log('Initializing with API key:', apiKey.substring(0, 10) + '...');
      engine.initialize({ apiKey, model: 'imagen-4.0' })
        .then(() => {
          setIsInitialized(true);
          console.log('✅ Imagen4 initialized successfully');
        })
        .catch((err) => {
          console.error('❌ Initialization failed:', err);
          setIsInitialized(false);
          setError(`Initialization failed: ${err.message}`);
        });
    } else {
      setIsInitialized(false);
      console.log('⚠️ No API key provided');
    }
  }, [apiKey, engine]);

  const handleGenerate = async () => {
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
        mode: 'text2image'
      };

      const generatedResults = await engine.generate(params);
      setResults(generatedResults);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = async () => {
    if (results.length === 0) {
      setError('No images to deploy');
      return;
    }

    setIsDeploying(true);
    setError(null);

    try {
      let uploadedCount = 0;

      // Upload each image separately
      for (const result of results) {
        // Convert base64 to Blob
        const base64Data = result.imageUrl.replace(/^data:image\/png;base64,/, '');
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'image/png' });
        const file = new File([blob], 'image.png', { type: 'image/png' });

        // Prepare FormData
        const formData = new FormData();
        formData.append('image', file);
        formData.append('metadata', JSON.stringify({
          prompt: result.metadata.prompt,
          negativePrompt: result.metadata.negativePrompt,
          model: result.metadata.model,
          mode: 'T2I',
          aspectRatio,
          imageSize: '1024x1024',
          safetyLevel,
          projectId: 'IMAGEN4',
          tags: [],
          styleAnalysis: null
        }));

        // Upload to API
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error(`Upload failed for image ${uploadedCount + 1}`);
        uploadedCount++;
      }
      
      alert(`✅ ${uploadedCount} images deployed successfully!`);
    } catch (err: any) {
      setError(err.message || 'Deploy failed');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Sidebar */}
      <aside className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white mb-2">🎨 Imagen 4 Generator</h2>
          <p className="text-sm text-white/60">Text-to-Image Creation</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Fixed Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Fixed Prompt
            </label>
            <textarea
              value={fixedPrompt}
              onChange={(e) => setFixedPrompt(e.target.value)}
              placeholder="Optional: background, lighting, style..."
              className="w-full h-20 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Main Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Main Prompt *
            </label>
            <textarea
              value={mainPrompt}
              onChange={(e) => setMainPrompt(e.target.value)}
              placeholder="예쁜여자..."
              className="w-full h-32 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-red-400 uppercase tracking-wider">
              Negative Prompt
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              placeholder="Optional: elements to exclude..."
              className="w-full h-20 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 resize-none focus:border-red-500 focus:outline-none"
            />
          </div>

          <ControlPanel
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            safetyLevel={safetyLevel}
            setSafetyLevel={setSafetyLevel}
            language="EN"
          />

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !mainPrompt.trim() || !isInitialized}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 rounded-xl text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
          >
            {isGenerating ? '⚡ Generating...' : 
             !isInitialized ? `🔒 Initializing... (API: ${apiKey ? 'Present' : 'Missing'})` :
             !mainPrompt.trim() ? '📝 Enter Prompt' :
             '✨ Generate Images'}
          </button>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Right Action Buttons */}
        <div className="absolute top-3 right-14 z-40 flex gap-2">
          <button
            onClick={() => setShowTagging(!showTagging)}
            className="w-8 h-8 bg-black/60 hover:bg-purple-600 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center transition-all"
            title="Detail Tagging"
          >
            <i className="fa-solid fa-hashtag text-white text-xs"></i>
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-8 h-8 bg-black/60 hover:bg-blue-600 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center transition-all"
            title="Gemini Chat"
          >
            <i className="fa-solid fa-comments text-white text-xs"></i>
          </button>
          <button
            onClick={handleDeploy}
            disabled={isDeploying || results.length === 0}
            className="w-8 h-8 bg-black/60 hover:bg-green-600 backdrop-blur-lg border border-white/20 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title="Deploy to R2/D1"
          >
            <i className={`fa-solid ${isDeploying ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-white text-xs`}></i>
          </button>
        </div>

        <BatchDisplay
          images={results.map((r, i) => {
            // Convert aspect ratio from "16:9" to "16/9" for CSS
            const aspectRatioCss = (r.metadata.aspectRatio || '1:1').replace(':', '/');
            return {
              id: `img-${i}`,
              url: r.imageUrl,
              thumbnailUrl: r.thumbnailUrl,
              aspectRatio: aspectRatioCss,
              timestamp: r.metadata.timestamp,
              safetyLevel: r.metadata.safetyLevel || 'BLOCK_ONLY_HIGH',
              metadata: {
                prompt: r.metadata.prompt,
                negativePrompt: r.metadata.negativePrompt,
                model: r.metadata.model
              }
            };
          })}
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
