import React from 'react';

interface LoadingOverlayProps {
  genStatus: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ genStatus }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center">
      <div className="text-center space-y-10">
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 border-[4px] border-blue-500/10 rounded-full"></div>
          <div className="absolute inset-0 border-[4px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-4 border-[4px] border-emerald-500 border-b-transparent rounded-full animate-reverse-spin opacity-50"></div>
          <i className="fa-solid fa-brain absolute inset-0 flex items-center justify-center text-blue-400 text-3xl animate-pulse"></i>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">{genStatus}</p>
          <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">
            Allocation Resources from MONKOS Cloud...
          </p>
        </div>
      </div>
    </div>
  );
};
