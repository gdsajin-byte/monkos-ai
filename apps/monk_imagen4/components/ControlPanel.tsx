import React from 'react';
import { AspectRatio, SafetyLevel } from '../types';

interface ControlPanelProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  safetyLevel: SafetyLevel;
  setSafetyLevel: (level: SafetyLevel) => void;
  language: 'KO' | 'EN';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  aspectRatio,
  setAspectRatio,
  safetyLevel,
  setSafetyLevel,
  language,
}) => {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
          {language === 'KO' ? '비율' : 'Ratio'}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {(['1:1', '16:9', '9:16'] as AspectRatio[]).map(r => (
            <button 
              key={r} 
              onClick={() => setAspectRatio(r)} 
              className={`py-2 text-[9px] font-black rounded-lg border transition-all ${
                aspectRatio === r 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
          {language === 'KO' ? '보안' : 'Safety'}
        </label>
        <div className="grid grid-cols-1 gap-1.5">
          {[
            { id: 'BLOCK_NONE', label: language === 'KO' ? '제한 해제 (내부용)' : 'Unrestricted Access' },
            { id: 'BLOCK_ONLY_HIGH', label: language === 'KO' ? '표준 보안 적용' : 'Standard Protocol' }
          ].map((level) => (
            <button 
              key={level.id} 
              onClick={() => setSafetyLevel(level.id as SafetyLevel)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-[8px] font-black uppercase tracking-tighter transition-all ${
                safetyLevel === level.id 
                  ? 'bg-slate-800 border-white/20 text-white shadow-xl' 
                  : 'bg-[#020617] border-white/5 text-slate-600'
              }`}
            >
              <span>{level.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                safetyLevel === level.id ? 'bg-amber-500' : 'bg-slate-800'
              }`}></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
