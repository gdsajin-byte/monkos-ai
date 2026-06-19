import React, { useState } from 'react';
import { Language } from '../types';
import { VARIATION_CATEGORIES, getRandomVariationPrompt } from '../services/variationData';

interface VariationPanelProps {
  onApplyVariation: (fixed: string, dynamic: string) => void;
  language: Language;
}

const CATEGORY_META = [
  { id: 'pose', icon: 'fa-person', color: 'blue', emoji: '🚶' },
  { id: 'outfit', icon: 'fa-shirt', color: 'emerald', emoji: '👕' },
  { id: 'background', icon: 'fa-image', color: 'purple', emoji: '🌄' },
  { id: 'hair', icon: 'fa-scissors', color: 'pink', emoji: '💇' },
  { id: 'lighting', icon: 'fa-lightbulb', color: 'amber', emoji: '💡' },
  { id: 'accessory', icon: 'fa-gem', color: 'rose', emoji: '💎' },
];

export const VariationPanel: React.FC<VariationPanelProps> = ({
  onApplyVariation,
  language,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  const handleApply = (catId: string) => {
    const cat = VARIATION_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    const dynamic = customPrompts[catId] || getRandomVariationPrompt(catId);
    onApplyVariation(cat.fixedPrompt, dynamic);
  };

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
        {language === 'KO' ? '변형 카테고리' : 'Variation Categories'}
      </label>
      <div className="grid grid-cols-3 gap-2">
        {CATEGORY_META.map((meta) => {
          const cat = VARIATION_CATEGORIES.find((c) => c.id === meta.id);
          if (!cat) return null;
          const isSelected = selectedCategory === meta.id;
          return (
            <button
              key={meta.id}
              onClick={() => {
                setSelectedCategory(isSelected ? null : meta.id);
                if (!isSelected) handleApply(meta.id);
              }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-[9px] font-black uppercase tracking-wide transition-all ${
                isSelected
                  ? `bg-${meta.color}-600/20 border-${meta.color}-500/50 text-${meta.color}-400`
                  : 'bg-[#020617] border-white/5 text-slate-500 hover:border-white/10'
              }`}
            >
              <span className="text-lg">{meta.emoji}</span>
              <span>{language === 'KO' ? cat.nameKR : cat.name}</span>
            </button>
          );
        })}
      </div>

      {selectedCategory && (
        <div className="space-y-2 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-1.5">
            {VARIATION_CATEGORIES.find((c) => c.id === selectedCategory)?.variationPrompts.map(
              (vp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCustomPrompts((prev) => ({ ...prev, [selectedCategory]: vp }));
                    const cat = VARIATION_CATEGORIES.find((c) => c.id === selectedCategory);
                    if (cat) onApplyVariation(cat.fixedPrompt, vp);
                  }}
                  className="p-2 text-[8px] text-slate-400 bg-[#020617] border border-white/5 rounded-lg hover:border-white/10 hover:text-white transition-all text-left leading-tight"
                >
                  {vp}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
