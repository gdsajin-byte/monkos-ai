import React from 'react';
import { AspectRatio } from '../types';

interface ControlPanelProps {
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  language: 'KO' | 'EN';
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  aspectRatio,
  setAspectRatio,
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
    </div>
  );
};
