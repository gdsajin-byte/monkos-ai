import React, { useState } from 'react';
import { GeneratedImage, ViewMode, Language, LABELS } from '../types';
import { ApiService } from '../services/apiService';

interface BatchDisplayProps {
  currentBatch: string[];
  history: GeneratedImage[];
  language: Language;
  setActiveImageId: (id: string | null) => void;
  setViewMode: (v: ViewMode) => void;
  setHistory: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  setUploadedImage: (img: string | null) => void;
  activeImageId: string | null;
  viewMode: ViewMode;
  uploadedImage: string | null;
  addLog: (op: string, model: string, status: 'SUCCESS' | 'ERROR' | 'PENDING') => void;
  genStatus: string;
  setGenStatus: (s: string) => void;
  projectId: string;
}

export const BatchDisplay: React.FC<BatchDisplayProps> = ({
  currentBatch,
  history,
  language,
  setActiveImageId,
  setViewMode,
  setHistory,
  setUploadedImage,
  activeImageId,
  viewMode,
  uploadedImage,
  addLog,
  genStatus,
  setGenStatus,
  projectId,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const L = LABELS[language];
  const activeImage = history.find((h) => h.id === activeImageId);
  const displayUrl = uploadedImage || activeImage?.url;

  const handleExportAll = async () => {
    if (history.length === 0) return;
    setIsExporting(true);
    try {
      for (let i = 0; i < history.length; i++) {
        const img = history[i];
        setGenStatus(`${L.processing} ${i + 1}/${history.length}`);
        const a = document.createElement('a');
        a.href = img.url;
        a.download = `monk_${img.id}.png`;
        a.click();
        await ApiService.saveImage(img.url, {
          prompt: img.prompt,
          model: img.config.model || 'Unknown',
          mode: img.config.mode,
          aspectRatio: img.config.aspectRatio,
          imageSize: img.config.imageSize,
          safetyLevel: img.config.safetyLevel,
          projectId: img.projectId,
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      addLog('BATCH_EXPORT', 'System', 'SUCCESS');
    } catch {
      addLog('BATCH_EXPORT', 'System', 'ERROR');
    } finally {
      setIsExporting(false);
      setGenStatus('');
    }
  };

  const handleExportBatch = async () => {
    if (currentBatch.length === 0) return;
    setIsExporting(true);
    try {
      const batchImages = history.filter((h) => currentBatch.includes(h.url));
      for (let i = 0; i < batchImages.length; i++) {
        const img = batchImages[i];
        setGenStatus(`${L.processing} ${i + 1}/${batchImages.length}`);
        const a = document.createElement('a');
        a.href = img.url;
        a.download = `monk_batch_${i + 1}.png`;
        a.click();
        await ApiService.saveImage(img.url, {
          prompt: img.prompt,
          model: img.config.model || 'Unknown',
          mode: img.config.mode,
          aspectRatio: img.config.aspectRatio,
          imageSize: img.config.imageSize,
          safetyLevel: img.config.safetyLevel,
          projectId: img.projectId,
        });
        await new Promise((r) => setTimeout(r, 300));
      }
      addLog('CURRENT_BATCH_EXPORT', 'System', 'SUCCESS');
    } catch {
      addLog('CURRENT_BATCH_EXPORT', 'System', 'ERROR');
    } finally {
      setIsExporting(false);
      setGenStatus('');
    }
  };

  const handleSingleDownload = async () => {
    if (!activeImage) return;
    try {
      setGenStatus('Saving...');
      const result = await ApiService.saveImage(activeImage.url, {
        prompt: activeImage.prompt,
        model: activeImage.config.model || 'Unknown',
        mode: activeImage.config.mode,
        aspectRatio: activeImage.config.aspectRatio,
        imageSize: activeImage.config.imageSize,
        safetyLevel: activeImage.config.safetyLevel,
        projectId: activeImage.projectId,
      });
      if (result.success) addLog('CLOUD_SAVE', 'R2+D1', 'SUCCESS');

      const a = document.createElement('a');
      a.href = activeImage.url;
      a.download = `MONK_ARTIFACT_${Date.now()}.png`;
      a.click();
      addLog('DOWNLOAD', 'System', 'SUCCESS');
    } catch (err) {
      console.error('Save/download error:', err);
    } finally {
      setGenStatus('');
    }
  };

  const handleRemove = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (activeImageId === id) {
      const remaining = history.filter((h) => h.id !== id);
      setActiveImageId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const hasContent = currentBatch.length > 0 || history.length > 0;

  return (
    <section className="flex-1 flex flex-col bg-[#010409] relative p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            {L.batchGrid}
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            {L.activeFocus}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <>
              <button
                onClick={handleExportBatch}
                disabled={isExporting || currentBatch.length === 0}
                className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[9px] font-black uppercase tracking-wide hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30"
              >
                {L.exportBatch}
              </button>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-lg text-[9px] font-black uppercase tracking-wide hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
              >
                {L.exportAll}
              </button>
            </>
          )}
          <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-microchip text-blue-500"></i> MONKOS ENGINE
            </span>
            <span className="flex items-center gap-2">
              <i className="fa-solid fa-server text-emerald-500"></i> {projectId}
            </span>
          </div>
        </div>
      </div>

      {/* Main Display */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {hasContent ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-6 max-w-[900px] w-full">
              {currentBatch.map((url, i) => {
                const img = history.find((h) => h.url === url);
                return (
                  <div key={i} className="relative group">
                    <img
                      src={url}
                      alt={`Generated ${i}`}
                      onClick={() => {
                        setActiveImageId(img?.id || null);
                        setViewMode('single');
                      }}
                      className="rounded-[2rem] border border-white/5 cursor-pointer hover:scale-[1.02] transition-all shadow-2xl hover:shadow-blue-500/10 w-full"
                    />
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (img) {
                            setUploadedImage(img.url);
                          }
                        }}
                        className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm text-xs hover:bg-blue-600 transition-all"
                        title="Use as source"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket"></i>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (img) handleRemove(img.id);
                        }}
                        className="p-2 bg-black/60 text-white rounded-full backdrop-blur-sm text-xs hover:bg-red-600 transition-all"
                        title="Remove"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative group">
              {displayUrl && (
                <>
                  <div className="rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/5 bg-black flex items-center justify-center max-h-[70vh]">
                    <img
                      src={displayUrl}
                      alt="Active image"
                      className="max-h-full w-auto block mx-auto object-contain"
                    />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={handleSingleDownload}
                      className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-blue-600 transition-all"
                      title="Download"
                    >
                      <i className="fa-solid fa-download text-sm"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (activeImage) setUploadedImage(activeImage.url);
                      }}
                      className="p-3 bg-black/60 text-white rounded-full backdrop-blur-sm hover:bg-emerald-600 transition-all"
                      title="Use as source"
                    >
                      <i className="fa-solid fa-arrow-right-to-bracket text-sm"></i>
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        ) : (
          <div className="text-center space-y-4 opacity-20">
            <i className="fa-solid fa-atom text-7xl text-slate-700 animate-spin-slow"></i>
            <div className="text-slate-700 font-black uppercase tracking-[1em] text-2xl">
              {L.idle}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="h-10 border-t border-white/5 mt-6 flex items-center justify-between px-4 text-slate-500">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              Sync Active
            </span>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest bg-blue-600/10 px-3 py-1 rounded-full text-blue-400 font-mono">
            v6.0.0-PRO
          </span>
        </div>
        <div className="text-[8px] font-medium text-slate-600 uppercase tracking-wide">
          Engineered by MONKOS.AI
        </div>
      </footer>
    </section>
  );
};
