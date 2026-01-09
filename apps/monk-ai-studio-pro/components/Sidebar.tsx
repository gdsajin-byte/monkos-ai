import React from 'react';
import { SynthesisMode, AspectRatio, SafetyLevel } from '../types';
import { PromptSection } from './PromptSection';
import { ControlPanel } from './ControlPanel';
import { QuickVariations } from './QuickVariations';

interface SidebarProps {
  mode: SynthesisMode;
  setMode: (mode: SynthesisMode) => void;
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  fixedPrompt: string;
  setFixedPrompt: (value: string) => void;
  prompt: string;
  setPrompt: (value: string) => void;
  negativePrompt: string;
  setNegativePrompt: (value: string) => void;
  clearFixedPrompt: () => void;
  clearPrompt: () => void;
  clearNegativePrompt: () => void;
  promptLocked: boolean;
  setPromptLocked: (value: boolean) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  safetyLevel: SafetyLevel;
  setSafetyLevel: (level: SafetyLevel) => void;
  error: string | null;
  setError: (error: string | null) => void;
  isGenerating: boolean;
  performSynthesis: () => void;
  getActiveButtonText: () => string;
  language: 'KO' | 'EN';
  sidebarWidth: number;
  handleMouseDownResize: (e: React.MouseEvent) => void;
  onApplyVariation: (category: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mode,
  setMode,
  uploadedImage,
  setUploadedImage,
  fileInputRef,
  fixedPrompt,
  setFixedPrompt,
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  clearFixedPrompt,
  clearPrompt,
  clearNegativePrompt,
  promptLocked,
  setPromptLocked,
  aspectRatio,
  setAspectRatio,
  safetyLevel,
  setSafetyLevel,
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
  const [showAdvancedPrompts, setShowAdvancedPrompts] = React.useState(false);
  return (
    <aside style={{ width: `${sidebarWidth}px` }} className="bg-[#0a0f1e] border-r border-white/5 p-4 flex flex-col shrink-0 z-20 shadow-2xl overflow-y-auto custom-scrollbar relative">
      <div className="flex flex-col h-full">
        <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
              {language === 'KO' ? '합성 프로토콜' : 'Protocol'}
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                {id: 'T2I', label: language === 'KO' ? '신규 생성' : 'New Generate', icon: 'fa-wand-sparkles'},
                {id: 'I2I', label: language === 'KO' ? '변주' : 'Variation', icon: 'fa-images'}
              ].map((m) => (
                <button 
                  key={m.id} 
                  onClick={() => { setMode(m.id as SynthesisMode); setError(null); }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-tighter transition-all ${mode === m.id ? 'bg-blue-600 border-blue-500 text-white shadow-xl' : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'}`}
                >
                  <i className={`fa-solid ${m.icon} text-xs ${mode === m.id ? 'text-white' : 'text-slate-700'}`}></i>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode !== 'T2I' && (
            <div className="space-y-2">
              <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <i className={`fa-solid fa-circle text-[7px] ${uploadedImage ? 'animate-pulse text-emerald-500' : 'text-slate-700'}`}></i> 
                {language === 'KO' ? '소스 데이터 노드' : 'Source Data Node'}
              </label>
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="relative w-24 h-24 rounded-xl border-2 border-dashed border-white/5 bg-[#020617] hover:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center overflow-hidden group shadow-inner"
              >
                {uploadedImage ? (
                  <>
                    <div className="relative w-full h-full group">
                      <img 
                        src={uploadedImage} 
                        alt="Input source" 
                        className="w-full h-full object-contain transition-transform group-hover:scale-150" 
                      />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }} 
                      className="absolute top-2 right-2 bg-red-500/20 hover:bg-red-500 p-1.5 rounded-full text-white transition-all z-10"
                    >
                      <i className="fa-solid fa-xmark text-xs"></i>
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-1">
                    <i className="fa-solid fa-cloud-arrow-up text-slate-700 text-2xl group-hover:text-emerald-500 transition-colors"></i>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                      {language === 'KO' ? '레퍼런스' : 'Load'}
                    </p>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => { 
                    const f = e.target.files?.[0]; 
                    if(f){ 
                      const r = new FileReader(); 
                      r.onload=(ev)=>setUploadedImage(ev.target?.result as string); 
                      r.readAsDataURL(f); 
                    } 
                  }} 
                  className="hidden" 
                />
              </div>
            </div>
          )}
          
          {mode !== 'T2I' && uploadedImage && (
            <QuickVariations
              onApplyVariation={onApplyVariation}
              language={language}
            />
          )}

          <button
            onClick={() => setShowAdvancedPrompts(!showAdvancedPrompts)}
            className="w-full py-2 px-3 bg-slate-800/30 hover:bg-slate-800/50 border border-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-wider transition-all flex items-center justify-between"
          >
            <span>{language === 'KO' ? '고급 프롬프트' : 'Advanced Prompts'}</span>
            <i className={`fa-solid fa-chevron-${showAdvancedPrompts ? 'up' : 'down'} text-xs`}></i>
          </button>

          {showAdvancedPrompts && (
            <div className="space-y-3 animate-in slide-in-from-top duration-200">
              <PromptSection
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
            </div>
          )}
          
          <ControlPanel
            aspectRatio={aspectRatio}
            setAspectRatio={setAspectRatio}
            language={language}
          />
        </div>
        
        <div className="pt-2 shrink-0">
          {error && <div className="p-3 mb-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] text-red-400 font-bold uppercase tracking-widest text-center animate-pulse">{error}</div>}
          <button 
            onClick={performSynthesis} 
            disabled={isGenerating} 
            className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:from-blue-600 transition-all transform active:scale-[0.98] group"
          >
            <i className={`fa-solid ${isGenerating ? 'fa-spinner animate-spin' : 'fa-bolt'} mr-3`}></i>
            {getActiveButtonText()}
          </button>
        </div>
      </div>
      
      {/* Resize Handle */}
      <div 
        onMouseDown={handleMouseDownResize}
        className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors group"
      >
        <div className="absolute top-1/2 right-0 transform -translate-y-1/2 w-1 h-12 bg-slate-600 group-hover:bg-blue-500 transition-colors rounded-l"></div>
      </div>
    </aside>
  );
};
