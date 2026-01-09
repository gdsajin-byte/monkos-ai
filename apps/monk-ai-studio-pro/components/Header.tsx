
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  onExport: () => void;
  onToggleLogs: () => void;
  logCount: number;
  language: 'EN' | 'KO';
  onLanguageChange: (lang: 'EN' | 'KO') => void;
  hasImages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onToggleLogs, logCount, language, onLanguageChange, hasImages = false }) => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const t = {
    EN: {
      title: "MONK AI STUDIO",
      subtitle: "Master Neural Orchestrator v4.0.1",
      logs: "Logs",
      export: "Export",
      deploy: "Deploy",
      guideTitle: "Professional Deployment",
      guideSub: "Install as a standalone PWA.",
      copy: "Copy App URL",
      close: "Close"
    },
    KO: {
      title: "몽크 AI 스튜디오",
      subtitle: "마스터 신경망 오케스트레이터 v4.0.1",
      logs: "로그",
      export: "내보내기",
      deploy: "배포",
      guideTitle: "전문가용 배포",
      guideSub: "독립형 PWA 앱으로 설치합니다.",
      copy: "앱 URL 복사",
      close: "닫기"
    }
  }[language];

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 px-8 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 bg-gradient-to-tr from-emerald-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i className="fa-solid fa-microchip text-white text-lg"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tighter uppercase">{t.title}</h1>
                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black text-[9px] font-black rounded-md shadow-lg shadow-orange-500/20">PRO</span>
              </div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 mx-2"></div>

          {/* Language Selection Tab */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
            {(['EN', 'KO'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${
                  language === lang ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={onToggleLogs}
            className="relative px-4 py-2.5 bg-slate-800 text-slate-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:text-emerald-400 transition-all active:scale-95"
          >
            <i className="fa-solid fa-terminal mr-2"></i>
            {t.logs}
            {logCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-black text-[8px] flex items-center justify-center rounded-full font-black">
                {logCount}
              </span>
            )}
          </button>

          <button 
            onClick={onExport}
            disabled={!hasImages}
            className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 active:scale-95 ${
              hasImages 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white' 
                : 'bg-slate-800/50 text-slate-600 border border-slate-700/30 cursor-not-allowed'
            }`}
            title={hasImages ? '' : (language === 'KO' ? '내보낼 이미지가 없습니다' : 'No images to export')}
          >
            <i className="fa-solid fa-file-export"></i>
            <span>{t.export}</span>
          </button>

          {!isInstalled && (
            <button 
              onClick={() => setShowGuide(true)}
              className="px-5 py-2.5 bg-white text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center space-x-2 shadow-xl active:scale-95"
            >
              <i className="fa-solid fa-cloud-arrow-down"></i>
              <span>{t.deploy}</span>
            </button>
          )}
        </div>
      </header>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="max-w-lg w-full glass-panel border border-white/10 rounded-[2.5rem] p-10 space-y-8 relative shadow-[0_0_100px_rgba(30,58,138,0.5)]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="text-3xl font-black text-white tracking-tighter uppercase">{t.guideTitle}</h3>
                <p className="text-slate-400 text-sm font-medium">{t.guideSub}</p>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fa-solid fa-circle-xmark text-2xl"></i>
              </button>
            </div>
            <div className="space-y-6 text-slate-300 text-sm">
              <p>1. {language === 'KO' ? '아래 버튼을 눌러 URL을 복사합니다.' : 'Click the button below to copy the URL.'}</p>
              <button onClick={handleCopyLink} className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">
                {copySuccess ? (language === 'KO' ? '복사됨!' : 'Copied!') : t.copy}
              </button>
              <p>2. {language === 'KO' ? '브라우저 메뉴에서 [앱 설치]를 선택하세요.' : 'Select [Install App] from the browser menu.'}</p>
            </div>
            <button onClick={() => setShowGuide(false)} className="w-full py-4 border border-slate-800 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest">{t.close}</button>
          </div>
        </div>
      )}
    </>
  );
};
