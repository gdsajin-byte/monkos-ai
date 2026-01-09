import React, { useState } from 'react';

// Prompt presets
const PRESETS = {
  studio: {
    name: { KO: '스튜디오', EN: 'Studio' },
    fixed: 'professional studio lighting, softbox, clean white background, high-key lighting, studio photography',
    negative: 'outdoor, natural light, messy background, harsh shadows, low quality'
  },
  outdoor: {
    name: { KO: '야외', EN: 'Outdoor' },
    fixed: 'natural daylight, golden hour, outdoor environment, cinematic lighting, beautiful scenery',
    negative: 'studio, artificial light, indoor, dark, windowless'
  },
  dramatic: {
    name: { KO: '드라마틱', EN: 'Dramatic' },
    fixed: 'dramatic lighting, high contrast, moody atmosphere, cinematic, rim light, side lighting',
    negative: 'flat lighting, bright, overexposed, washed out, low contrast'
  },
  minimal: {
    name: { KO: '미니멀', EN: 'Minimal' },
    fixed: 'minimalist, clean, simple composition, negative space, modern aesthetic',
    negative: 'cluttered, busy, complex, ornate, detailed background'
  }
};

interface PromptSectionProps {
  fixedPrompt: string;
  prompt: string;
  negativePrompt: string;
  setFixedPrompt: (value: string) => void;
  setPrompt: (value: string) => void;
  setNegativePrompt: (value: string) => void;
  clearFixedPrompt: () => void;
  clearPrompt: () => void;
  clearNegativePrompt: () => void;
  promptLocked: boolean;
  setPromptLocked: (value: boolean) => void;
  language: 'KO' | 'EN';
}

export const PromptSection: React.FC<PromptSectionProps> = ({
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
  language,
}) => {
  const [showPresets, setShowPresets] = useState(false);

  const applyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setFixedPrompt(preset.fixed);
    setNegativePrompt(preset.negative);
    setShowPresets(false);
  };

  return (
    <div className="flex-1 flex flex-col space-y-3 min-h-[200px]">
      {/* Fixed Prompt - Top */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
            {language === 'KO' ? '고정 프롬프트' : 'Fixed Prompt'}
          </label>
          <div className="flex items-center gap-1">
            <div className="relative">
              <button 
                onClick={() => setShowPresets(!showPresets)}
                className="p-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                title={language === 'KO' ? '프리셋 불러오기' : 'Load Preset'}
              >
                <i className="fa-solid fa-layer-group text-[9px]"></i>
              </button>
              {showPresets && (
                <div className="absolute top-8 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 space-y-1 min-w-[160px]">
                  {(Object.keys(PRESETS) as Array<keyof typeof PRESETS>).map((key) => (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className="w-full text-left px-3 py-2 text-[10px] font-bold text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg transition-all"
                    >
                      {PRESETS[key].name[language]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={clearFixedPrompt}
              className="p-1 bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all"
              title={language === 'KO' ? '초기화' : 'Clear'}
            >
              <i className="fa-solid fa-xmark text-[9px]"></i>
            </button>
          </div>
        </div>
        <textarea 
          value={fixedPrompt}
          onChange={(e) => setFixedPrompt(e.target.value)}
          placeholder={language === 'KO' ? '선택: 배경, 조명, 스타일...' : 'Optional: background, lighting, style...'}
          className="w-full h-16 px-4 py-2 bg-[#020617] border border-white/5 rounded-xl text-xs text-slate-300 placeholder-slate-700 resize-none focus:border-blue-500/30 focus:outline-none transition-all font-mono leading-relaxed custom-scrollbar"
        />
      </div>

      {/* Main Prompt - Middle (Largest) */}
      <div className="flex-1 flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
            {language === 'KO' ? '메인 프롬프트' : 'Main Prompt'}
          </label>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPromptLocked(!promptLocked)}
              className={`p-1.5 rounded-lg transition-all ${promptLocked ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              title={language === 'KO' ? '프롬프트 고정' : 'Lock Prompt'}
            >
              <i className={`fa-solid ${promptLocked ? 'fa-lock' : 'fa-lock-open'} text-[9px]`}></i>
            </button>
            <button 
              onClick={clearPrompt}
              className="p-1 bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all"
              title={language === 'KO' ? '초기화' : 'Clear'}
            >
              <i className="fa-solid fa-xmark text-[9px]"></i>
            </button>
          </div>
        </div>
        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={language === 'KO' ? '생성할 이미지 설명...' : 'Describe the image to generate...'}
          className="w-full flex-1 px-4 py-3 bg-[#020617] border border-white/5 rounded-xl text-xs text-slate-300 placeholder-slate-700 resize-none focus:border-emerald-500/30 focus:outline-none transition-all font-mono leading-relaxed custom-scrollbar"
        />
      </div>

      {/* Negative Prompt - Bottom */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[8px] font-black text-red-400 uppercase tracking-widest">
            {language === 'KO' ? '네거티브 프롬프트' : 'Negative Prompt'}
          </label>
          <button 
            onClick={clearNegativePrompt}
            className="p-1 bg-slate-800 text-slate-500 hover:text-red-400 rounded-lg transition-all"
            title={language === 'KO' ? '초기화' : 'Clear'}
          >
            <i className="fa-solid fa-xmark text-[9px]"></i>
          </button>
        </div>
        <textarea 
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder={language === 'KO' ? '선택: 제외할 요소...' : 'Optional: elements to exclude...'}
          className="w-full h-16 px-4 py-2 bg-[#020617] border border-white/5 rounded-xl text-xs text-slate-300 placeholder-slate-700 resize-none focus:border-red-500/30 focus:outline-none transition-all font-mono leading-relaxed custom-scrollbar"
        />
      </div>
    </div>
  );
};
