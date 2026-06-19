import React from 'react';
import { Language, LABELS } from '../types';

interface PromptAreaProps {
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
  language: Language;
}

export const PromptArea: React.FC<PromptAreaProps> = ({
  fixedPrompt,
  prompt,
  negativePrompt,
  setPrompt,
  setNegativePrompt,
  clearFixedPrompt,
  clearPrompt,
  clearNegativePrompt,
  promptLocked,
  setPromptLocked,
  language,
}) => {
  const L = LABELS[language];

  return (
    <div className="space-y-3">
      {fixedPrompt && (
        <div className="relative p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">
              Fixed Prompt
            </span>
            <button
              onClick={clearFixedPrompt}
              className="text-[8px] text-slate-600 hover:text-red-400 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <p className="text-[9px] text-purple-300 leading-relaxed line-clamp-3">
            {fixedPrompt}
          </p>
        </div>
      )}

      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={L.prompt}
          className="w-full h-32 bg-[#020617] border border-white/5 rounded-2xl p-4 text-sm focus:border-blue-500 transition-all resize-none outline-none font-medium custom-scrollbar"
        />
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            onClick={() => setPromptLocked(!promptLocked)}
            className={`p-1.5 rounded-lg text-[10px] transition-all ${
              promptLocked
                ? 'bg-amber-600/20 text-amber-400'
                : 'text-slate-600 hover:text-white'
            }`}
            title={promptLocked ? 'Unlock prompt' : 'Lock prompt'}
          >
            <i className={`fa-solid ${promptLocked ? 'fa-lock' : 'fa-lock-open'}`}></i>
          </button>
          {prompt && (
            <button
              onClick={clearPrompt}
              className="p-1.5 rounded-lg text-[10px] text-slate-600 hover:text-red-400 transition-all"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder={L.negativePrompt}
          className="w-full h-16 bg-[#020617] border border-white/5 rounded-xl p-3 text-xs text-slate-400 focus:border-red-500/50 transition-all resize-none outline-none custom-scrollbar"
        />
        {negativePrompt && (
          <button
            onClick={clearNegativePrompt}
            className="absolute top-2 right-2 p-1 text-[10px] text-slate-600 hover:text-red-400 transition-all"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>
    </div>
  );
};
