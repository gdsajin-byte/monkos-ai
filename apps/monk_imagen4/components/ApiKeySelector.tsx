
import React, { useState } from 'react';

interface ApiKeySelectorProps {
  onApiKeyChange: (key: string) => void;
  onClose: () => void;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onApiKeyChange, onClose }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onApiKeyChange(apiKey.trim());
      onClose();
    } else {
      alert('Please enter a valid API key');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-10 bg-slate-900/90 rounded-[4rem] border border-white/10 backdrop-blur-3xl max-w-md w-full shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
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
            </p>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />

          <button 
            onClick={handleSave} 
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-500 transition-all active:scale-95"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
