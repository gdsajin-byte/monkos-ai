
import React from 'react';

interface ApiKeySelectorProps {
  onKeySelected: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
  /**
   * Direct API key configuration via .env.local file.
   */
  const handleOpenSelectKey = async () => {
    // API key should be set in .env.local file
    alert('Please set your GEMINI_API_KEY in .env.local file and restart the server.');
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-10 bg-slate-900/60 rounded-[4rem] border border-white/10 backdrop-blur-3xl max-w-md w-full shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
      <div className="w-24 h-24 bg-gradient-to-tr from-emerald-600 to-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/40">
        <i className="fa-solid fa-brain text-4xl text-white"></i>
      </div>
      <div className="space-y-4">
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">MONK AI STUDIO<br/><span className="text-emerald-500">Neural Gateway</span></h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Agent-Level Identity Verification</p>
      </div>
      
      <div className="space-y-6 w-full text-left">
        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-3">
          <p className="text-slate-300 text-[11px] leading-relaxed font-medium">
            Get your free API key from
            <a href="https://ai.google.dev/" target="_blank" rel="noreferrer" className="text-blue-400 underline mx-1 font-black">
              Google AI Studio
            </a> 
            and add it to .env.local file.
          </p>
        </div>

        <button 
          onClick={handleOpenSelectKey} 
          className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all active:scale-95"
        >
          Initialize Workspace
        </button>
      </div>
    </div>
  );
};
