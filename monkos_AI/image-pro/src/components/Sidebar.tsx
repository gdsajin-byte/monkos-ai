import React, { useRef, useState, useEffect } from 'react';
import {
  Protocol,
  EngineModel,
  Resolution,
  AspectRatio,
  Language,
  LABELS,
} from '../types';
import { PromptArea } from './PromptArea';
import { VariationPanel } from './VariationPanel';

interface SidebarProps {
  protocol: Protocol;
  setProtocol: (p: Protocol) => void;
  engineModel: EngineModel;
  setEngineModel: (e: EngineModel) => void;
  resolution: Resolution;
  setResolution: (r: Resolution) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (r: AspectRatio) => void;
  uploadedImage: string | null;
  setUploadedImage: (img: string | null) => void;
  fixedPrompt: string;
  prompt: string;
  negativePrompt: string;
  setFixedPrompt: (v: string) => void;
  setPrompt: (v: string) => void;
  setNegativePrompt: (v: string) => void;
  clearFixedPrompt: () => void;
  clearPrompt: () => void;
  clearNegativePrompt: () => void;
  promptLocked: boolean;
  setPromptLocked: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;
  isGenerating: boolean;
  performSynthesis: () => void;
  getActiveButtonText: () => string;
  language: Language;
  sidebarWidth: number;
  handleMouseDownResize: (e: React.MouseEvent) => void;
  onApplyVariation: (fixed: string, dynamic: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  protocol,
  setProtocol,
  engineModel,
  setEngineModel,
  resolution,
  setResolution,
  aspectRatio,
  setAspectRatio,
  uploadedImage,
  setUploadedImage,
  fixedPrompt,
  prompt,
  negativePrompt,
  setFixedPrompt,
  setPrompt,
  setNegativePrompt,
  clearFixedPrompt,
  clearPrompt,
  clearNegativePrompt,
  promptLocked,
  setPromptLocked,
  error,
  setError,
  isGenerating,
  performSynthesis,
  getActiveButtonText,
  language,
  sidebarWidth,
  handleMouseDownResize,
  onApplyVariation,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSourceUpload, setShowSourceUpload] = useState(false);
  const L = LABELS[language];

  useEffect(() => {
    if (protocol === 'T2I') setShowSourceUpload(true);
  }, [protocol]);

  const protocols: { id: Protocol; label: string; icon: string }[] = [
    { id: 'T2I', label: L.newGenerate, icon: 'fa-wand-sparkles' },
    { id: 'I2I', label: L.variation, icon: 'fa-images' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onload = (ev) => setUploadedImage(ev.target?.result as string);
      r.readAsDataURL(f);
    }
  };

  return (
    <>
      <aside
        style={{ width: `${sidebarWidth}px` }}
        className="bg-[#0a0f1e] border-r border-white/5 p-6 flex flex-col space-y-5 shrink-0 z-20 shadow-2xl overflow-y-auto custom-scrollbar relative"
      >
        {/* Protocol */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
            {L.protocol}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {protocols.map((p) => (
              <button
                key={p.id}
                onClick={() => setProtocol(p.id)}
                className={`flex items-center justify-center gap-2 py-3 text-[10px] font-black rounded-xl border transition-all ${
                  protocol === p.id
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                <i className={`fa-solid ${p.icon} text-xs ${protocol === p.id ? 'text-white' : 'text-slate-700'}`}></i>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source Image (I2I) */}
        {protocol !== 'T2I' && (
          <div className="space-y-2">
            <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <i className={`fa-solid fa-circle text-[6px] ${uploadedImage ? 'animate-pulse text-emerald-500' : 'text-slate-700'}`}></i>
              {L.sourceNode}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative aspect-[16/10] rounded-2xl border-2 border-dashed border-white/5 bg-[#020617] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center overflow-hidden group"
            >
              {uploadedImage ? (
                <img src={uploadedImage} alt="Source" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="text-center space-y-2">
                  <i className="fa-solid fa-cloud-arrow-up text-slate-700 text-2xl group-hover:text-emerald-500 transition-colors"></i>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{L.selectImage}</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>
          </div>
        )}

        {/* Variation Panel (I2I only) */}
        {protocol !== 'T2I' && uploadedImage && (
          <VariationPanel onApplyVariation={onApplyVariation} language={language} />
        )}

        {/* Engine */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {L.engine}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { id: 'fast' as EngineModel, label: 'Standard' },
              { id: 'ultra' as EngineModel, label: 'Premium' },
            ]).map((eng) => (
              <button
                key={eng.id}
                onClick={() => setEngineModel(eng.id)}
                className={`py-2.5 text-[10px] font-black rounded-lg border transition-all ${
                  engineModel === eng.id
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                {eng.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {L.resolution}
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(['1K', '2K'] as Resolution[]).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`py-2.5 text-[10px] font-black rounded-lg border transition-all ${
                  resolution === res
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Ratio */}
        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            {L.ratio}
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['1:1', '16:9', '9:16'] as AspectRatio[]).map((r) => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                className={`py-2.5 text-[10px] font-black rounded-lg border transition-all ${
                  aspectRatio === r
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                    : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Area */}
        <PromptArea
          fixedPrompt={fixedPrompt}
          prompt={prompt}
          negativePrompt={negativePrompt}
          setFixedPrompt={setFixedPrompt}
          setPrompt={setPrompt}
          setNegativePrompt={setNegativePrompt}
          clearFixedPrompt={clearFixedPrompt}
          clearPrompt={clearPrompt}
          clearNegativePrompt={clearNegativePrompt}
          promptLocked={promptLocked}
          setPromptLocked={setPromptLocked}
          language={language}
        />

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        {/* Synthesize Button */}
        <div className="pt-2 mt-auto">
          <button
            onClick={performSynthesis}
            disabled={isGenerating}
            className="w-full py-5 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 hover:from-blue-600 hover:to-blue-500 transition-all transform active:scale-[0.98]"
          >
            {getActiveButtonText()}
          </button>
        </div>
      </aside>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        className="w-1.5 cursor-col-resize bg-transparent hover:bg-blue-500/30 transition-colors group"
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-slate-600 group-hover:bg-blue-500 transition-colors rounded-l"></div>
      </div>
    </>
  );
};
