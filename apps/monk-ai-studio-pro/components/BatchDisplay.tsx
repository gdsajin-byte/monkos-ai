import React from 'react';
import { GeneratedImage } from '../types';
import { StorageService } from '../services/storageService';

interface BatchDisplayProps {
  currentBatch: string[];
  history: GeneratedImage[];
  language: 'KO' | 'EN';
  setActiveImageId: (id: string) => void;
  setImageComment: (comment: string) => void;
  setShowCommentInput: (show: boolean) => void;
  setViewMode: (mode: 'single' | 'grid') => void;
  setHistory: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  setCurrentBatch: React.Dispatch<React.SetStateAction<string[]>>;
  setGenStatus: (status: string) => void;
  addLog: (operation: string, model: string, status: 'SUCCESS' | 'ERROR' | 'PENDING') => void;
  resetInspector: () => void;
}

export const BatchDisplay: React.FC<BatchDisplayProps> = ({
  currentBatch,
  history,
  language,
  setActiveImageId,
  setImageComment,
  setShowCommentInput,
  setViewMode,
  setHistory,
  setCurrentBatch,
  setGenStatus,
  addLog,
  resetInspector,
}) => {
  return (
    <div className="grid grid-cols-2 gap-6 max-w-[960px] w-full animate-in fade-in zoom-in duration-500 overflow-y-auto p-4 custom-scrollbar">
      {(currentBatch.length > 0 ? currentBatch : history.map(h => h.url)).map((u, i) => {
        const matched = history.find(h => h.url === u);
        return (
          <div key={i} className="relative group">
            <img 
              src={u} 
              alt="batch" 
              onClick={() => { 
                if (matched) {
                  setActiveImageId(matched.id);
                  setImageComment(matched.comment || '');
                  setShowCommentInput(true);
                }
                setViewMode('single'); 
                resetInspector(); 
              }} 
              className="rounded-[3rem] border border-white/5 cursor-pointer hover:scale-[1.02] transition-all shadow-2xl w-full h-auto object-contain bg-black/20" 
            />
            
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (matched) {
                    setActiveImageId(matched.id);
                    setImageComment(matched.comment || '');
                    setShowCommentInput(true);
                    setViewMode('single');
                    resetInspector();
                  }
                }}
                className="bg-blue-600/90 hover:bg-blue-500 text-white p-2.5 rounded-full transition-all shadow-xl backdrop-blur-sm"
                title={language === 'KO' ? '확대' : 'Expand'}
              >
                <i className="fa-solid fa-expand text-sm"></i>
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (matched) {
                    setHistory(prev => prev.filter(h => h.id !== matched.id));
                    setCurrentBatch(prev => prev.filter(url => url !== u));
                  }
                }}
                className="bg-red-600/90 hover:bg-red-500 text-white p-2.5 rounded-full transition-all shadow-xl backdrop-blur-sm"
                title={language === 'KO' ? '제거' : 'Remove'}
              >
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>

            <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (!matched) return;
                
                try {
                  setGenStatus(language === 'KO' ? '클라우드에 저장 중...' : 'Saving to cloud...');
                  
                  // Save to R2 and D1
                  const result = await StorageService.saveImage(matched.url, {
                    prompt: matched.prompt,
                    model: matched.config.model || 'Unknown',
                    mode: matched.config.mode,
                    aspectRatio: matched.config.aspectRatio,
                    imageSize: matched.config.imageSize,
                    safetyLevel: matched.config.safetyLevel,
                    projectId: matched.projectId
                  });

                  if (result.success) {
                    addLog('CLOUD_SAVE', 'R2+D1', 'SUCCESS');
                  }

                  // Download locally
                  const link = document.createElement('a');
                  link.href = matched.url;
                  link.download = `MONK_ARTIFACT_${Date.now()}.png`;
                  link.click();
                  addLog('DOWNLOAD', 'System', 'SUCCESS');
                } catch (error) {
                  console.error('Save/download error:', error);
                } finally {
                  setGenStatus('');
                }
              }}
              className="absolute bottom-4 right-4 bg-blue-600/90 hover:bg-blue-500 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-xl backdrop-blur-sm"
              title={language === 'KO' ? '저장' : 'Save'}
            >
              <i className="fa-solid fa-download text-sm"></i>
            </button>
          </div>
        );
      })}
    </div>
  );
};
