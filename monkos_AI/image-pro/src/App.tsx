import React, { useState, useCallback } from 'react';
import {
  Protocol,
  EngineModel,
  Resolution,
  AspectRatio,
  ViewMode,
  Language,
  GeneratedImage,
  NeuralLog,
  LABELS,
} from './types';
import { ApiService } from './services/apiService';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BatchDisplay } from './components/BatchDisplay';
import { LogsPanel } from './components/LogsPanel';
import { LoadingOverlay } from './components/LoadingOverlay';

const App: React.FC = () => {
  const [protocol, setProtocol] = useState<Protocol>('T2I');
  const [engineModel, setEngineModel] = useState<EngineModel>('fast');
  const [resolution, setResolution] = useState<Resolution>('1K');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [language, setLanguage] = useState<Language>('EN');
  const [viewMode, setViewMode] = useState<ViewMode>('single');

  const [fixedPrompt, setFixedPrompt] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [promptLocked, setPromptLocked] = useState(false);

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);

  const [logs, setLogs] = useState<NeuralLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(380);

  const projectId = 'INTERNAL';

  const addLog = useCallback(
    (operation: string, model: string, status: 'SUCCESS' | 'ERROR' | 'PENDING') => {
      const newLog: NeuralLog = {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        projectId,
        operation,
        model,
        status,
        timestamp: Date.now(),
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 50));
    },
    [projectId]
  );

  const handleMouseDownResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (ev: MouseEvent) => {
        const newWidth = Math.max(300, Math.min(600, startWidth + ev.clientX - startX));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [sidebarWidth]
  );

  const getActiveButtonText = useCallback(() => {
    const L = LABELS[language];
    if (isGenerating) return genStatus || 'Processing...';
    return protocol === 'T2I' ? L.synthesize : L.variation;
  }, [language, isGenerating, genStatus, protocol]);

  const performSynthesis = useCallback(async () => {
    const sourceImage = uploadedImage || history.find((h) => h.id === activeImageId)?.url;
    const mode = protocol === 'T2I' ? 'T2I' : 'I2I';

    if (protocol === 'T2I' && !prompt && !fixedPrompt) {
      setError('Prompt is required for generation');
      return;
    }
    if (protocol === 'I2I' && !sourceImage) {
      setError('Source image is required for variation');
      return;
    }

    setIsGenerating(true);
    setError(null);

    const fullPrompt = [fixedPrompt, prompt].filter(Boolean).join(' ');

    try {
      if (protocol === 'T2I') {
        setGenStatus('MONKOS ENGINE: T2I BATCH SYNTHESIZING...');
        const urls = await ApiService.generateBatch(fullPrompt, {
          aspectRatio,
          imageSize: resolution,
          model: engineModel,
        });

        const newImages: GeneratedImage[] = urls.map((url, idx) => ({
          id: `${Date.now()}-${idx}`,
          url,
          prompt: fullPrompt,
          projectId,
          timestamp: Date.now(),
          config: {
            aspectRatio,
            imageSize: resolution,
            mode,
            model: 'MONKOS',
          },
        }));

        setCurrentBatch(urls);
        setHistory((prev) => [...newImages, ...prev]);
        setActiveImageId(newImages[0].id);
        setViewMode('grid');
        addLog('T2I_BATCH', 'MONKOS Engine', 'SUCCESS');
      } else {
        setGenStatus(`MONKOS ENGINE: ${mode} ACTIVE...`);
        const resultUrl = await ApiService.refineImage(fullPrompt, {
          aspectRatio,
          imageSize: resolution,
          inputImage: sourceImage!,
          mode,
        });

        const refinedImg: GeneratedImage = {
          id: Date.now().toString(),
          url: resultUrl,
          prompt: fullPrompt,
          projectId,
          timestamp: Date.now(),
          config: {
            aspectRatio,
            imageSize: resolution,
            mode,
            model: 'MONKOS',
          },
        };

        setHistory((prev) => [refinedImg, ...prev]);
        setActiveImageId(refinedImg.id);
        setUploadedImage(resultUrl);
        setViewMode('single');
        addLog(mode, 'MONKOS Engine', 'SUCCESS');
      }

      if (!promptLocked) {
        setFixedPrompt('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      addLog(mode, 'Neural Core', 'ERROR');
      setError(msg);
    } finally {
      setIsGenerating(false);
      setGenStatus('');
    }
  }, [
    protocol,
    prompt,
    fixedPrompt,
    negativePrompt,
    uploadedImage,
    history,
    activeImageId,
    aspectRatio,
    resolution,
    engineModel,
    promptLocked,
    projectId,
    addLog,
  ]);

  const handleApplyVariation = useCallback(
    (fixed: string, dynamic: string) => {
      setFixedPrompt(fixed);
      if (!promptLocked) {
        setPrompt(dynamic);
      }
    },
    [promptLocked]
  );

  const handleExport = useCallback(async () => {
    if (history.length === 0) return;
    for (const img of history) {
      const a = document.createElement('a');
      a.href = img.url;
      a.download = `monk_${img.id}.png`;
      a.click();
      await new Promise((r) => setTimeout(r, 300));
    }
    addLog('EXPORT_ALL', 'System', 'SUCCESS');
  }, [history, addLog]);

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans select-none">
      <Header
        onExport={handleExport}
        onToggleLogs={() => setShowLogs(!showLogs)}
        logCount={logs.filter((l) => l.status === 'SUCCESS').length}
        language={language}
        onLanguageChange={setLanguage}
        hasImages={history.length > 0}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <Sidebar
          protocol={protocol}
          setProtocol={setProtocol}
          engineModel={engineModel}
          setEngineModel={setEngineModel}
          resolution={resolution}
          setResolution={setResolution}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          uploadedImage={uploadedImage}
          setUploadedImage={setUploadedImage}
          fixedPrompt={fixedPrompt}
          prompt={prompt}
          negativePrompt={negativePrompt}
          setFixedPrompt={setFixedPrompt}
          setPrompt={setPrompt}
          setNegativePrompt={setNegativePrompt}
          clearFixedPrompt={() => setFixedPrompt('')}
          clearPrompt={() => setPrompt('')}
          clearNegativePrompt={() => setNegativePrompt('')}
          promptLocked={promptLocked}
          setPromptLocked={setPromptLocked}
          error={error}
          setError={setError}
          isGenerating={isGenerating}
          performSynthesis={performSynthesis}
          getActiveButtonText={getActiveButtonText}
          language={language}
          sidebarWidth={sidebarWidth}
          handleMouseDownResize={handleMouseDownResize}
          onApplyVariation={handleApplyVariation}
        />

        <BatchDisplay
          currentBatch={currentBatch}
          history={history}
          language={language}
          setActiveImageId={setActiveImageId}
          setViewMode={setViewMode}
          setHistory={setHistory}
          setUploadedImage={setUploadedImage}
          activeImageId={activeImageId}
          viewMode={viewMode}
          uploadedImage={uploadedImage}
          addLog={addLog}
          genStatus={genStatus}
          setGenStatus={setGenStatus}
          projectId={projectId}
        />

        <LogsPanel logs={logs} showLogs={showLogs} setShowLogs={setShowLogs} />
      </main>

      {isGenerating && <LoadingOverlay genStatus={genStatus} />}
    </div>
  );
};

export default App;
