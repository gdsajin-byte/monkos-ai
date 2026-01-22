
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { ApiKeySelector } from './components/ApiKeySelector';
import { PromptSection } from './components/PromptSection';
import { ControlPanel } from './components/ControlPanel';
import { BatchDisplay } from './components/BatchDisplay';
import { Sidebar } from './components/Sidebar';
import { GeminiService } from './services/geminiService';
import { StorageService } from './services/storageService';
import { AspectRatio, ImageSize, GeneratedImage, AppState, SafetyLevel, NeuralLog, SynthesisMode } from './types';
import { createVariation, getRandomVariation } from './promptTemplates';
import JSZip from 'jszip';

// LocalStorage keys for persistence
const STORAGE_KEYS = {
  FIXED_PROMPT: 'monk_fixed_prompt',
  NEGATIVE_PROMPT: 'monk_negative_prompt',
  PROMPT_PRESETS: 'monk_prompt_presets'
};

// Default presets for future use
const DEFAULT_PRESETS = {
  studio: {
    name: 'Studio Setup',
    fixed: 'professional studio lighting, softbox, clean white background, high-key lighting',
    negative: 'outdoor, natural light, messy background, shadows'
  },
  outdoor: {
    name: 'Outdoor Scene',
    fixed: 'natural daylight, golden hour, outdoor environment, cinematic lighting',
    negative: 'studio, artificial light, indoor, dark'
  },
  dramatic: {
    name: 'Dramatic Light',
    fixed: 'dramatic lighting, high contrast, moody atmosphere, cinematic',
    negative: 'flat lighting, bright, cheerful, overexposed'
  }
};

const App: React.FC = () => {
  // 환경변수 기반 기능 제어
  const SHOW_ANALYSIS = import.meta.env.VITE_SHOW_ANALYSIS !== 'false';
  const SHOW_COMMENT = import.meta.env.VITE_SHOW_COMMENT !== 'false';
  
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  const [language, setLanguage] = useState<'EN' | 'KO'>('KO');
  const [mode, setMode] = useState<SynthesisMode>('T2I');
  const [fixedPrompt, setFixedPrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.FIXED_PROMPT) || '';
    }
    return '';
  });
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEYS.NEGATIVE_PROMPT) || '';
    }
    return '';
  });
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>('BLOCK_NONE');
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [logs, setLogs] = useState<NeuralLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [imageComment, setImageComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [variationStack, setVariationStack] = useState<string[]>([]);
  
  // Analysis State
  const [analysis, setAnalysis] = useState<{prompt: string, style: string, tags: string[]} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [promptLocked, setPromptLocked] = useState(false);

  // Inspector State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [isResizing, setIsResizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  // Save fixed prompt to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FIXED_PROMPT, fixedPrompt);
    }
  }, [fixedPrompt]);

  // Save negative prompt to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.NEGATIVE_PROMPT, negativePrompt);
    }
  }, [negativePrompt]);

  const checkApiKey = async () => {
    try {
      // 백엔드 프록시 사용 시 항상 메인 화면으로 진입
      // API 키는 백엔드에서 관리되므로 프론트엔드 체크 불필요
      setAppState(AppState.MAIN);
    } catch (error) {
      console.error('API key check error:', error);
      setAppState(AppState.AUTH);
    }
  };

  const addLog = (operation: string, model: string, status: 'SUCCESS' | 'ERROR' | 'PENDING') => {
    const newLog: NeuralLog = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      projectId: "INTERNAL_NODE",
      operation,
      model,
      status,
      timestamp: Date.now()
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const exportProject = async () => {
    if (history.length === 0) {
      setError(language === 'KO' ? '내보낼 이미지가 없습니다.' : 'No images to export.');
      return;
    }
    setShowExportMenu(false);
    setIsGenerating(true);
    
    try {
      for (let i = 0; i < history.length; i++) {
        const img = history[i];
        setGenStatus(`${language === 'KO' ? '처리 중' : 'Processing'} ${i + 1}/${history.length}`);
        
        // 로컬 다운로드
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `monk_${img.id}.png`;
        link.click();
        
        // R2 + D1 저장
        await StorageService.saveImage(img.url, {
          prompt: img.prompt,
          model: img.config.model || 'Unknown',
          mode: img.config.mode,
          aspectRatio: img.config.aspectRatio,
          imageSize: img.config.imageSize,
          safetyLevel: img.config.safetyLevel,
          projectId: img.projectId
        });
        
        await new Promise(resolve => setTimeout(resolve, 300)); // 다운로드 간격
      }
      
      addLog('BATCH_EXPORT', 'System', 'SUCCESS');
    } catch (error) {
      setError(language === 'KO' ? '내보내기 실패' : 'Export failed');
      addLog('BATCH_EXPORT', 'System', 'ERROR');
    } finally { setIsGenerating(false); setGenStatus(''); }
  };

  const exportCurrentBatch = async () => {
    if (currentBatch.length === 0) {
      setError(language === 'KO' ? '내보낼 배치가 없습니다.' : 'No batch to export.');
      return;
    }
    setShowExportMenu(false);
    setIsGenerating(true);
    
    try {
      const batchImages = history.filter(h => currentBatch.includes(h.url));
      
      for (let i = 0; i < batchImages.length; i++) {
        const img = batchImages[i];
        setGenStatus(`${language === 'KO' ? '처리 중' : 'Processing'} ${i + 1}/${batchImages.length}`);
        
        // 로컬 다운로드
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `monk_batch_${i + 1}.png`;
        link.click();
        
        // R2 + D1 저장
        await StorageService.saveImage(img.url, {
          prompt: img.prompt,
          model: img.config.model || 'Unknown',
          mode: img.config.mode,
          aspectRatio: img.config.aspectRatio,
          imageSize: img.config.imageSize,
          safetyLevel: img.config.safetyLevel,
          projectId: img.projectId
        });
        
        await new Promise(resolve => setTimeout(resolve, 300)); // 다운로드 간격
      }
      
      addLog('CURRENT_BATCH_EXPORT', 'System', 'SUCCESS');
    } catch (error) {
      setError(language === 'KO' ? '배치 내보내기 실패' : 'Batch export failed');
      addLog('CURRENT_BATCH_EXPORT', 'System', 'ERROR');
    } finally { setIsGenerating(false); setGenStatus(''); }
  };

  const downloadActive = async () => {
    const activeImage = history.find(h => h.id === activeImageId);
    const activeUrl = uploadedImage || activeImage?.url;
    if (!activeUrl) return;

    try {
      // Save to R2 and D1
      if (activeImage && !uploadedImage) {
        setGenStatus(language === 'KO' ? '클라우드에 저장 중...' : 'Saving to cloud...');
        const result = await StorageService.saveImage(activeUrl, {
          prompt: activeImage.prompt,
          model: activeImage.config.model || 'Unknown',
          mode: activeImage.config.mode,
          aspectRatio: activeImage.config.aspectRatio,
          imageSize: activeImage.config.imageSize,
          safetyLevel: activeImage.config.safetyLevel,
          projectId: activeImage.projectId
        });

        if (result.success) {
          addLog('CLOUD_SAVE', 'R2+D1', 'SUCCESS');
          console.log('Saved to cloud:', result.imageUrl);
        } else {
          console.error('Cloud save failed:', result.error);
        }
        setGenStatus('');
      }

      // Download locally
      const link = document.createElement('a');
      link.href = activeUrl;
      link.download = `MONK_ARTIFACT_${Date.now()}.png`;
      link.click();
      addLog('DOWNLOAD', 'System', 'SUCCESS');
    } catch (error) {
      console.error('Save/download error:', error);
      setGenStatus('');
    }
  };

  const analyzeImage = async () => {
    const activeUrl = uploadedImage || history.find(h => h.id === activeImageId)?.url;
    if (!activeUrl) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await GeminiService.analyzeImage(activeUrl);
      setAnalysis(result);
      addLog('ANALYSIS', 'Gemini 3 Pro Vision', 'SUCCESS');
    } catch (err: any) {
      setError(language === 'KO' ? "이미지 분석 엔진에 연결할 수 없습니다." : "Analysis engine unreachable.");
      addLog('ANALYSIS', 'Gemini 3 Pro Vision', 'ERROR');
    } finally { setIsAnalyzing(false); }
  };

  const downloadJson = () => {
    if (!analysis) return;
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NEURAL_METADATA_${Date.now()}.json`;
    link.click();
  };

  const downloadTxt = () => {
    if (!analysis) return;
    const content = `[NEURAL ANALYSIS REPORT]\n\nPROMPT:\n${analysis.prompt}\n\nSTYLE:\n${analysis.style}\n\nTAGS:\n${analysis.tags.join(', ')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NEURAL_METADATA_${Date.now()}.txt`;
    link.click();
  };

  const sendToSource = () => {
    const activeUrl = history.find(h => h.id === activeImageId)?.url;
    if (!activeUrl) return;
    setUploadedImage(activeUrl);
    setMode('I2I');
    addLog('ITERATE_BUS', 'Internal', 'SUCCESS');
  };

  const resetInspector = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setAnalysis(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom(prev => Math.min(8, Math.max(1, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const refreshGeneration = () => {
    if (!promptLocked) {
      // 프롬프트 잠금 해제 시에만 초기화하지 않음
    }
    setCurrentBatch([]);
    setViewMode('single');
    setError(null);
    resetInspector();
  };

  const clearPrompt = () => {
    if (!promptLocked) {
      setPrompt('');
    }
  };

  const clearFixedPrompt = () => {
    setFixedPrompt('');
  };

  const clearNegativePrompt = () => {
    setNegativePrompt('');
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(280, e.clientX), 600);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const performSynthesis = async () => {
    const sourceImage = uploadedImage || history.find(h => h.id === activeImageId)?.url;
    
    // Combine prompts
    const combinedPrompt = [fixedPrompt, prompt].filter(Boolean).join('. ');
    const finalPrompt = negativePrompt 
      ? `${combinedPrompt}. Negative: ${negativePrompt}` 
      : combinedPrompt;
    
    // Safety checks
    if (!combinedPrompt && (mode === 'T2I' || mode === 'EDIT' || mode === 'I2I')) { 
      setError(language === 'KO' ? "명령어(프롬프트)를 입력해야 합니다." : "Prompt command required."); 
      return; 
    }
    if (mode !== 'T2I' && !sourceImage) { 
      setError(language === 'KO' ? "수정할 소스 이미지가 업로드되어야 합니다." : "Reference artifact required."); 
      return; 
    }
    
    setIsGenerating(true);
    setError(null);
    try {
      if (mode === 'T2I') {
        setGenStatus('MONKOS ENGINE: SYNTHESIZING...');
        const urls = await GeminiService.generateBatch(finalPrompt, { aspectRatio, safetyLevel });
        const newImages = urls.map((url, idx) => ({ 
          id: `${Date.now()}-${idx}`, 
          url, prompt: finalPrompt, projectId: 'INTERNAL', timestamp: Date.now(), 
          config: { aspectRatio, imageSize: '1K' as ImageSize, mode, model: 'MONKOS' } 
        }));
        setCurrentBatch(urls);
        setHistory(prev => [...newImages, ...prev]);
        setActiveImageId(newImages[0].id);
        setViewMode('grid');
        addLog('T2I_BATCH', 'MONKOS Engine', 'SUCCESS');
      } else {
        const engineLabel = mode === 'UPSCALE' ? '4K RECONSTRUCTOR' : 'MONKOS ENGINE';
        setGenStatus(`${engineLabel}: ${mode} ACTIVE...`);
        const resultUrl = await GeminiService.refineImage(
          mode === 'UPSCALE' ? (finalPrompt || 'Enhance image quality') : finalPrompt, 
          { 
            aspectRatio, 
            imageSize: mode === 'UPSCALE' ? '4K' : '2K', 
            inputImage: sourceImage!, 
            mode, 
            safetyLevel 
          }
        );
        const refinedImg = { 
          id: Date.now().toString(), url: resultUrl, prompt: finalPrompt, projectId: 'INTERNAL', timestamp: Date.now(), 
          config: { aspectRatio, imageSize: mode === 'UPSCALE' ? '4K' as ImageSize : '2K' as ImageSize, mode, model: 'MONKOS' } 
        };
        setHistory(prev => [refinedImg, ...prev]);
        setActiveImageId(refinedImg.id);
        setViewMode('single');
        addLog(mode, 'MONKOS Engine', 'SUCCESS');
      }
      resetInspector();
    } catch (err: any) {
      addLog(mode, 'Neural Core', 'ERROR');
      if (err.message === "AUTH_REQUIRED") setAppState(AppState.AUTH);
      else setError(err.message);
    } finally { setIsGenerating(false); }
  };

  const handleApplyVariation = (category: string, customPrompt?: string) => {
    const variation = createVariation(category, customPrompt);
    
    if (!variation.dynamic) return;
    
    // 스택에 추가 (중복 방지)
    if (!variationStack.includes(category)) {
      setVariationStack(prev => [...prev, category]);
    }
    
    // 고정 프롬프트 설정 (정체성 유지)
    setFixedPrompt(variation.fixed);
    
    // 메인 프롬프트에 추가 (스택 누적)
    const currentPrompts = prompt ? prompt.split('. ').filter(Boolean) : [];
    const newPrompt = customPrompt || variation.dynamic;
    
    if (!currentPrompts.includes(newPrompt)) {
      setPrompt(currentPrompts.concat(newPrompt).join('. '));
    }
    
    // I2I 모드로 자동 전환
    if (mode !== 'I2I') {
      setMode('I2I');
    }
    
    // 에러 초기화
    setError(null);
    
    console.log(`🎲 ${category} stacked (${variationStack.length + 1}/6)`);
  };
  
  const handleSendToSource = () => {
    // 변주 스택 실행
    if (variationStack.length > 0) {
      console.log(`🚀 Applying ${variationStack.length} variations:`, variationStack);
      performSynthesis();
      // 실행 후 스택 초기화
      setVariationStack([]);
    } else {
      sendToSource();
    }
  };

  const getActiveButtonText = () => {
    if (language === 'KO') {
      switch(mode) {
        case 'T2I': return '신규 생성 시작';
        case 'I2I': return '변주 실행';
        case 'EDIT': return '편집 실행';
        case 'UPSCALE': return '4K 업스케일';
        default: return '생성 시작';
      }
    }
    switch(mode) {
      case 'T2I': return 'Generate New';
      case 'I2I': return 'Apply Variation';
      case 'EDIT': return 'Apply Edit';
      case 'UPSCALE': return '4K Upscale';
      default: return 'Execute';
    }
  };

  if (appState === AppState.LOADING) return null;

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans select-none">
      <Header 
        onExport={() => setShowExportMenu(true)} 
        onToggleLogs={() => setShowLogs(!showLogs)} 
        logCount={logs.filter(l => l.status === 'SUCCESS').length}
        language={language}
        onLanguageChange={setLanguage}
        hasImages={history.length > 0}
      />
      
      <main className="flex-1 flex overflow-hidden relative">
        {appState === AppState.AUTH ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
            <ApiKeySelector onKeySelected={() => setAppState(AppState.MAIN)} />
          </div>
        ) : (
          <>
            <Sidebar
              mode={mode}
              setMode={setMode}
              uploadedImage={uploadedImage}
              setUploadedImage={setUploadedImage}
              fileInputRef={fileInputRef}
              fixedPrompt={fixedPrompt}
              setFixedPrompt={setFixedPrompt}
              prompt={prompt}
              setPrompt={setPrompt}
              negativePrompt={negativePrompt}
              setNegativePrompt={setNegativePrompt}
              clearFixedPrompt={clearFixedPrompt}
              clearPrompt={clearPrompt}
              clearNegativePrompt={clearNegativePrompt}
              promptLocked={promptLocked}
              setPromptLocked={setPromptLocked}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              safetyLevel={safetyLevel}
              setSafetyLevel={setSafetyLevel}
              error={error}
              setError={setError}
              isGenerating={isGenerating}
              performSynthesis={performSynthesis}
              getActiveButtonText={getActiveButtonText}
              onApplyVariation={handleApplyVariation}
              language={language}
              sidebarWidth={sidebarWidth}
              handleMouseDownResize={handleMouseDownResize}
              history={history}
            />

            <section className="flex-1 flex flex-col bg-[#010409] relative p-8">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex bg-slate-900/40 p-1 rounded-2xl border border-white/5">
                  <button onClick={() => setViewMode('grid')} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {language === 'KO' ? '배치 뷰' : 'Batch View'}
                  </button>
                  <button onClick={() => { setViewMode('single'); resetInspector(); }} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'single' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                    {language === 'KO' ? '단일 집중 뷰' : 'Focus View'}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {viewMode === 'single' && (history.length > 0 || uploadedImage) && (
                    <div className="flex items-center gap-1.5 bg-slate-900/40 p-1 rounded-xl border border-white/5">
                      {SHOW_ANALYSIS && (
                        <button 
                          onClick={analyzeImage} 
                          disabled={isAnalyzing}
                          className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
                          title={language === 'KO' ? '이미지 정밀 분석' : 'Analyze'}
                        >
                          <i className={`fa-solid ${isAnalyzing ? 'fa-spinner animate-spin' : 'fa-brain'} text-sm`}></i>
                        </button>
                      )}
                      {SHOW_COMMENT && (
                        <button 
                          onClick={() => setShowCommentInput(!showCommentInput)}
                          className="p-2 hover:bg-slate-500/20 text-slate-400 rounded-lg transition-all"
                          title={language === 'KO' ? '코멘트' : 'Comment'}
                        >
                          <i className="fa-solid fa-comment text-sm"></i>
                        </button>
                      )}
                      {(SHOW_ANALYSIS || SHOW_COMMENT) && <div className="w-px h-4 bg-white/10"></div>}
                      {mode === 'I2I' ? (
                        <>
                          <button 
                            onClick={performSynthesis}
                            disabled={isGenerating}
                            className="p-2 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all"
                            title={language === 'KO' ? '재생성' : 'Regenerate'}
                          >
                            <i className="fa-solid fa-rotate text-sm"></i>
                          </button>
                          <button 
                            onClick={handleSendToSource}
                            className={`p-2 rounded-lg transition-all ${(variationStack?.length || 0) > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'hover:bg-emerald-500/20 text-emerald-400'}`}
                            title={language === 'KO' ? `변주 실행 (${variationStack?.length || 0}개 스택)` : `Apply Variations (${variationStack?.length || 0} stacked)`}
                          >
                            <i className="fa-solid fa-arrow-left text-sm"></i>
                            {(variationStack?.length || 0) > 0 && (
                              <span className="ml-1 text-[8px] font-black">{variationStack.length}</span>
                            )}
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={sendToSource}
                          className="p-2 hover:bg-purple-500/20 text-purple-400 rounded-lg transition-all"
                          title={language === 'KO' ? '변주 레퍼런스로 전송' : 'Send to Variation'}
                        >
                          <i className="fa-solid fa-arrow-right text-sm"></i>
                        </button>
                      )}
                      <div className="w-px h-4 bg-white/10"></div>
                      <button 
                        onClick={() => { setMode('UPSCALE'); performSynthesis(); }}
                        disabled={isGenerating || !activeImageId}
                        className="p-2 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-all"
                        title={language === 'KO' ? '4K 업스케일' : '4K Upscale'}
                      >
                        <i className="fa-solid fa-expand text-sm"></i>
                      </button>
                      <div className="w-px h-4 bg-white/10"></div>
                      <button 
                        onClick={downloadActive}
                        className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-all"
                        title={language === 'KO' ? '저장' : 'Save'}
                      >
                        <i className="fa-solid fa-download text-sm"></i>
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[8px] font-medium text-slate-700 uppercase tracking-wide">
                    <span>Engine:</span>
                    <span className="text-blue-400">Vertex</span>
                    <span className="text-slate-800">|</span>
                    <span className="text-slate-600">Anthropic</span>
                    <span className="text-slate-800">|</span>
                    <span className="text-purple-500">MonkOS</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex gap-8 items-center justify-center overflow-hidden">
                <div className="flex-1 h-full flex flex-col items-center justify-center relative overflow-hidden">
                  {(currentBatch.length > 0 || history.length > 0) ? (
                    viewMode === 'grid' ? (
                      <BatchDisplay
                        currentBatch={currentBatch}
                        history={history}
                        language={language}
                        setActiveImageId={setActiveImageId}
                        setImageComment={setImageComment}
                        setShowCommentInput={setShowCommentInput}
                        setViewMode={setViewMode}
                        setHistory={setHistory}
                        setCurrentBatch={setCurrentBatch}
                        setGenStatus={setGenStatus}
                        addLog={addLog}
                        resetInspector={resetInspector}
                        sourceImage={uploadedImage}
                      />
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      {/* Comment input section */}
                      {showCommentInput && (
                        <div className="absolute bottom-4 left-4 right-4 z-30 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                              {language === 'KO' ? '이미지 코멘트 (우선순위 메타데이터)' : 'Image Comment (Priority Metadata)'}
                            </label>
                            <button
                              onClick={() => setShowCommentInput(false)}
                              className="text-slate-500 hover:text-slate-300 transition-all"
                            >
                              <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                          </div>
                          <textarea
                            value={imageComment}
                            onChange={(e) => setImageComment(e.target.value)}
                            placeholder={language === 'KO' ? '이미지에 대한 메모, 개선사항, 특이점 등...' : 'Notes, improvements, observations...'}
                            className="w-full h-24 px-4 py-3 bg-[#020617] border border-white/5 rounded-xl text-xs text-slate-300 placeholder-slate-700 resize-none focus:border-emerald-500/30 focus:outline-none transition-all font-mono leading-relaxed custom-scrollbar"
                          />
                          <button
                            onClick={async () => {
                              const activeImage = history.find(h => h.id === activeImageId);
                              if (activeImage && imageComment.trim()) {
                                // Update local state
                                setHistory(prev => prev.map(img => 
                                  img.id === activeImageId 
                                    ? { ...img, comment: imageComment }
                                    : img
                                ));

                                // Save to cloud with comment
                                try {
                                  setGenStatus(language === 'KO' ? '코멘트 저장 중...' : 'Saving comment...');
                                  await StorageService.saveImage(activeImage.url, {
                                    prompt: activeImage.prompt,
                                    model: activeImage.config.model || 'Unknown',
                                    mode: activeImage.config.mode,
                                    aspectRatio: activeImage.config.aspectRatio,
                                    imageSize: activeImage.config.imageSize,
                                    safetyLevel: activeImage.config.safetyLevel,
                                    projectId: activeImage.projectId,
                                    comment: imageComment,
                                    tags: analysis?.tags,
                                    styleAnalysis: analysis?.style
                                  });
                                  addLog('COMMENT_SAVE', 'D1', 'SUCCESS');
                                  setShowCommentInput(false);
                                } catch (error) {
                                  console.error('Comment save error:', error);
                                } finally {
                                  setGenStatus('');
                                }
                              } else {
                                setShowCommentInput(false);
                              }
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            <i className="fa-solid fa-save mr-2"></i>
                            {language === 'KO' ? '코멘트 저장' : 'Save Comment'}
                          </button>
                        </div>
                      )}

                      <div 
                        ref={inspectorRef}
                        onWheel={handleWheel}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`relative w-full h-full flex items-center justify-center overflow-hidden cursor-${zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'} rounded-[4rem] border border-white/5 bg-black/40 shadow-2xl`}
                      >
                        <img 
                          src={history.find(h=>h.id === activeImageId)?.url || uploadedImage} 
                          alt="focus" 
                          style={{ 
                            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, 
                            transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%'
                          }}
                          className="block object-contain pointer-events-none" 
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center space-y-6 opacity-20">
                    <i className="fa-solid fa-atom text-8xl animate-spin-slow text-slate-700"></i>
                    <div className="text-slate-700 font-black uppercase tracking-[1.5em] text-2xl">
                      {language === 'KO' ? '대기 중: 합성 대상을 로드하세요' : 'System Idle: Awaiting Input'}
                    </div>
                  </div>
                )}
                </div>

                {analysis && (
                  <div className="w-96 h-full bg-[#0a0f1e]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-10 flex flex-col space-y-8 animate-in slide-in-from-right-10 duration-500 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center">
                       <h3 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">
                         {language === 'KO' ? '신경망 분석 보고서' : 'Neural Report'}
                       </h3>
                       <div className="flex gap-2">
                         <button onClick={downloadJson} title="JSON Download" className="text-slate-500 hover:text-blue-400 transition-all"><i className="fa-solid fa-file-code text-lg"></i></button>
                         <button onClick={downloadTxt} title="TXT Download" className="text-slate-500 hover:text-emerald-400 transition-all"><i className="fa-solid fa-file-lines text-lg"></i></button>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {language === 'KO' ? '역설계된 프롬프트' : 'Reversed Prompt'}
                          </label>
                          <p className="text-xs text-slate-300 leading-relaxed font-mono bg-black/40 p-5 rounded-2xl border border-white/5 select-text">{analysis.prompt}</p>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {language === 'KO' ? '스타일 지문 분석' : 'Stylistic Fingerprint'}
                          </label>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium bg-black/40 p-5 rounded-2xl border border-white/5 select-text">{analysis.style}</p>
                       </div>
                       <div className="space-y-3">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            {language === 'KO' ? '추출된 태그' : 'Extracted Tags'}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {analysis.tags.map((tag, i) => (
                              <span key={i} className="px-3 py-1.5 bg-blue-600/10 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-tighter border border-blue-500/10">#{tag}</span>
                            ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Export Menu Modal */}
      {showExportMenu && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xl flex items-center justify-center" onClick={() => setShowExportMenu(false)}>
          <div className="bg-[#0a0f1e]/95 border border-white/10 rounded-3xl p-8 space-y-6 w-[450px] animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                {language === 'KO' ? '내보내기 옵션' : 'Export Options'}
              </h3>
              <button onClick={() => setShowExportMenu(false)} className="text-slate-500 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={async () => {
                  setShowExportMenu(false);
                  await exportProject();
                }}
                disabled={history.length === 0}
                className="w-full bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 rounded-2xl p-5 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <div className="text-sm font-bold text-blue-400 group-hover:text-white transition-colors">
                      {language === 'KO' ? '전체 이미지 내보내기' : 'Export All Images'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {history.length} {language === 'KO' ? '개 이미지 + 메타데이터' : 'images + metadata'}
                    </div>
                  </div>
                  <i className="fa-solid fa-folder-tree text-blue-400 group-hover:text-white text-xl transition-colors"></i>
                </div>
              </button>

              <button
                onClick={async () => {
                  setShowExportMenu(false);
                  await exportCurrentBatch();
                }}
                disabled={currentBatch.length === 0}
                className="w-full bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/30 rounded-2xl p-5 transition-all group disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left space-y-1">
                    <div className="text-sm font-bold text-emerald-400 group-hover:text-white transition-colors">
                      {language === 'KO' ? '현재 배치만 내보내기' : 'Export Current Batch'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {currentBatch.length} {language === 'KO' ? '개 이미지' : 'images'}
                    </div>
                  </div>
                  <i className="fa-solid fa-layer-group text-emerald-400 group-hover:text-white text-xl transition-colors"></i>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Panel */}
      {showLogs && (
        <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-xl flex items-center justify-center" onClick={() => setShowLogs(false)}>
          <div className="bg-[#0a0f1e]/95 border border-white/10 rounded-3xl p-8 space-y-6 w-[900px] max-h-[80vh] animate-in slide-in-from-right-10 duration-300 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                {language === 'KO' ? '작업 로그' : 'Operation Logs'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const logData = JSON.stringify(logs, null, 2);
                    const blob = new Blob([logData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `MONK_LOGS_${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/30 rounded-xl text-[10px] font-bold text-amber-400 hover:text-white transition-all"
                >
                  <i className="fa-solid fa-download mr-2"></i>
                  {language === 'KO' ? '로그 저장' : 'Save Logs'}
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600 border border-red-500/30 rounded-xl text-[10px] font-bold text-red-400 hover:text-white transition-all"
                >
                  <i className="fa-solid fa-trash mr-2"></i>
                  {language === 'KO' ? '전체 삭제' : 'Clear All'}
                </button>
                <button onClick={() => setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors px-3">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <i className="fa-solid fa-inbox text-5xl mb-4 opacity-20"></i>
                  <p className="text-xs font-medium">{language === 'KO' ? '로그가 없습니다' : 'No logs available'}</p>
                </div>
              ) : (
                logs.map((log, idx) => (
                  <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            log.status === 'ERROR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {log.operation}
                          </span>
                          <span className="text-[9px] text-slate-600 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {log.message}
                        </p>
                        {log.model && (
                          <div className="flex items-center gap-2 text-[10px]">
                            <i className="fa-solid fa-microchip text-blue-400"></i>
                            <span className="text-blue-400 font-mono">{log.model}</span>
                          </div>
                        )}
                      </div>
                      {log.status === 'SUCCESS' && (
                        <i className="fa-solid fa-check-circle text-emerald-500 text-lg"></i>
                      )}
                      {log.status === 'ERROR' && (
                        <i className="fa-solid fa-exclamation-circle text-red-500 text-lg"></i>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center">
          <div className="text-center space-y-12">
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 border-[6px] border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <i className="fa-solid fa-brain absolute inset-0 flex items-center justify-center text-blue-400 text-4xl animate-pulse"></i>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-black text-white uppercase tracking-[0.8em]">{genStatus}</p>
              <div className="flex justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
