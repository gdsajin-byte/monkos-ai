import React, { useState, useEffect } from 'react';
import { Language, LABELS } from '../types';

interface HeaderProps {
  onExport: () => void;
  onToggleLogs: () => void;
  logCount: number;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  hasImages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onExport,
  onToggleLogs,
  logCount,
  language,
  onLanguageChange,
  hasImages = false,
}) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const L = LABELS[language];

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 bg-gradient-to-tr from-emerald-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <i className="fa-solid fa-microchip text-white text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">
                {L.title}
              </h1>
              <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black rounded-md shadow-lg shadow-orange-500/20">
                PRO
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
              {L.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-800/60 p-0.5 rounded-lg border border-white/5">
            {(['EN', 'KO'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${
                  language === lang
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={onToggleLogs}
            className="relative px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-emerald-400 transition-all active:scale-95"
          >
            <i className="fa-solid fa-terminal mr-2"></i>
            {L.logs}
            {logCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[8px] flex items-center justify-center rounded-full font-black">
                {logCount}
              </span>
            )}
          </button>

          {hasImages && (
            <button
              onClick={onExport}
              className="px-5 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center space-x-2 active:scale-95"
            >
              <i className="fa-solid fa-file-export"></i>
              <span>{L.export}</span>
            </button>
          )}

          {!isInstalled && (
            <button
              onClick={() => setShowGuide(true)}
              className="px-5 py-2.5 bg-white text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center space-x-2 shadow-xl active:scale-95"
            >
              <i className="fa-solid fa-cloud-arrow-down"></i>
              <span>{L.deploy}</span>
            </button>
          )}
        </div>
      </header>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="max-w-lg w-full glass-panel border border-white/10 rounded-[2.5rem] p-10 space-y-8 relative shadow-[0_0_100px_rgba(30,58,138,0.5)]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">
                  {L.guideTitle}
                </h3>
                <p className="text-slate-400 text-sm font-medium">{L.guideSub}</p>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              </button>
            </div>
            <div className="space-y-6 text-slate-300 text-sm">
              <p>1. 아래 버튼을 눌러 URL을 복사합니다.</p>
              <button
                onClick={handleCopyLink}
                className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest"
              >
                {copySuccess ? 'Copied!' : L.copy}
              </button>
              <p>2. 브라우저 메뉴에서 [앱 설치]를 선택하세요.</p>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-4 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest"
            >
              {L.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
