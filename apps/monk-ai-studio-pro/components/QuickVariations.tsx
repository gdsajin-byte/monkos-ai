import React from 'react';
import { VARIATION_TEMPLATES } from '../promptTemplates';

interface QuickVariationsProps {
  onApplyVariation: (category: string, customPrompt?: string, referenceImage?: string) => void;
  language: 'KO' | 'EN';
}

export const QuickVariations: React.FC<QuickVariationsProps> = ({
  onApplyVariation,
  language
}) => {
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null);
  const [customPrompts, setCustomPrompts] = React.useState<Record<string, string>>({});
  const [referenceImages, setReferenceImages] = React.useState<Record<string, string>>({});
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const buttons = [
    { id: 'pose', icon: 'fa-person', color: 'blue', emoji: '🚶' },
    { id: 'outfit', icon: 'fa-shirt', color: 'emerald', emoji: '👕' },
    { id: 'background', icon: 'fa-image', color: 'purple', emoji: '🖼️' },
    { id: 'hair', icon: 'fa-scissors', color: 'pink', emoji: '💇' },
    { id: 'lighting', icon: 'fa-lightbulb', color: 'amber', emoji: '💡' },
    { id: 'accessory', icon: 'fa-bag-shopping', color: 'indigo', emoji: '👜' }
  ];

  const handleImageDrop = (e: React.DragEvent, category: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setReferenceImages({ ...referenceImages, [category]: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = (category: string) => {
    const customPrompt = customPrompts[category];
    const referenceImage = referenceImages[category];
    onApplyVariation(category, customPrompt, referenceImage);
    
    // 옵션 초기화
    setCustomPrompts({ ...customPrompts, [category]: '' });
    setReferenceImages({ ...referenceImages, [category]: '' });
    setExpandedCard(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
        {language === 'KO' ? '빠른 변주' : 'Quick Variations'}
      </label>
      
      <div className="space-y-1.5">
        {buttons.map(btn => {
          const template = VARIATION_TEMPLATES.find(t => t.id === btn.id);
          const isExpanded = expandedCard === btn.id;
          const hasCustom = customPrompts[btn.id] || referenceImages[btn.id];
          
          return (
            <div key={btn.id} className="space-y-1">
              {/* 메인 버튼 */}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (!isExpanded && !hasCustom) {
                      // 바로 실행 (디폴트)
                      handleApply(btn.id);
                    } else {
                      // 옵션 토글
                      setExpandedCard(isExpanded ? null : btn.id);
                    }
                  }}
                  className={`flex-1 flex items-center justify-between px-3 py-2.5 border rounded-xl transition-all group ${
                    isExpanded 
                      ? `bg-${btn.color}-600/20 border-${btn.color}-500/50` 
                      : `bg-${btn.color}-600/10 border-${btn.color}-500/20 hover:bg-${btn.color}-600/20`
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{btn.emoji}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider text-${btn.color}-400`}>
                      {template ? (language === 'KO' ? template.nameKR : template.name) : btn.id}
                    </span>
                  </div>
                  {hasCustom && (
                    <i className={`fa-solid fa-circle text-[6px] text-${btn.color}-500 animate-pulse`}></i>
                  )}
                </button>
                
                {/* 옵션 토글 버튼 */}
                <button
                  onClick={() => setExpandedCard(isExpanded ? null : btn.id)}
                  className={`px-2.5 border rounded-xl transition-all ${
                    isExpanded 
                      ? `bg-${btn.color}-600/20 border-${btn.color}-500/50 text-${btn.color}-400` 
                      : `bg-slate-800/30 border-white/5 text-slate-500 hover:text-${btn.color}-400`
                  }`}
                >
                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
                </button>
              </div>

              {/* 확장 옵션 */}
              {isExpanded && (
                <div className={`space-y-2 p-3 bg-${btn.color}-900/10 border border-${btn.color}-500/10 rounded-xl animate-in slide-in-from-top duration-200`}>
                  {/* 텍스트 입력 */}
                  <div className="space-y-1">
                    <label className={`text-[8px] font-bold text-${btn.color}-400/70 uppercase tracking-wider`}>
                      {language === 'KO' ? '구체적 지시' : 'Custom Prompt'}
                    </label>
                    <input
                      type="text"
                      value={customPrompts[btn.id] || ''}
                      onChange={(e) => setCustomPrompts({ ...customPrompts, [btn.id]: e.target.value })}
                      placeholder={language === 'KO' ? `예: 빨간 드레스` : 'e.g., red dress'}
                      className="w-full px-2.5 py-1.5 bg-black/40 border border-white/5 rounded-lg text-[9px] text-slate-300 placeholder-slate-700 focus:border-purple-500/30 focus:outline-none"
                    />
                  </div>

                  {/* 이미지 드롭존 */}
                  <div className="space-y-1">
                    <label className={`text-[8px] font-bold text-${btn.color}-400/70 uppercase tracking-wider`}>
                      {language === 'KO' ? '레퍼런스 이미지' : 'Reference Image'}
                    </label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(btn.id); }}
                      onDragLeave={() => setDragOver(null)}
                      onDrop={(e) => handleImageDrop(e, btn.id)}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setReferenceImages({ ...referenceImages, [btn.id]: ev.target?.result as string });
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }}
                      className={`relative h-16 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                        dragOver === btn.id
                          ? `border-${btn.color}-500 bg-${btn.color}-500/10`
                          : referenceImages[btn.id]
                            ? `border-${btn.color}-500/50 bg-${btn.color}-900/20`
                            : 'border-white/10 hover:border-white/20 bg-black/20'
                      }`}
                    >
                      {referenceImages[btn.id] ? (
                        <div className="relative w-full h-full flex items-center justify-center group">
                          <img src={referenceImages[btn.id]} alt="ref" className="h-full object-contain" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReferenceImages({ ...referenceImages, [btn.id]: '' });
                            }}
                            className="absolute top-1 right-1 bg-red-600/90 hover:bg-red-500 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <i className="fa-solid fa-xmark text-[10px] text-white"></i>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <i className={`fa-solid fa-cloud-arrow-up text-slate-600 text-lg ${dragOver === btn.id ? 'animate-bounce' : ''}`}></i>
                          <p className="text-[7px] text-slate-600 mt-1">{language === 'KO' ? '이미지 드롭' : 'Drop Image'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 실행 버튼 */}
                  <button
                    onClick={() => handleApply(btn.id)}
                    className={`w-full py-2 bg-${btn.color}-600 hover:bg-${btn.color}-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all`}
                  >
                    <i className="fa-solid fa-bolt mr-1.5"></i>
                    {language === 'KO' ? '변주 실행' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
