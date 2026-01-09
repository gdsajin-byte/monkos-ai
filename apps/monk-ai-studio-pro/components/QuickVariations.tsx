import React from 'react';
import { VARIATION_TEMPLATES, createVariation } from '../promptTemplates';

interface QuickVariationsProps {
  onApplyVariation: (category: string) => void;
  language: 'KO' | 'EN';
}

export const QuickVariations: React.FC<QuickVariationsProps> = ({
  onApplyVariation,
  language
}) => {
  const buttons = [
    { id: 'pose', icon: 'fa-person', color: 'blue' },
    { id: 'outfit', icon: 'fa-shirt', color: 'emerald' },
    { id: 'background', icon: 'fa-image', color: 'purple' },
    { id: 'hair', icon: 'fa-scissors', color: 'pink' },
    { id: 'lighting', icon: 'fa-lightbulb', color: 'amber' },
    { id: 'accessory', icon: 'fa-bag-shopping', color: 'indigo' }
  ];

  const getColorClasses = (color: string, active: boolean = false) => {
    const colors = {
      blue: active ? 'bg-blue-600 border-blue-500' : 'bg-blue-600/10 border-blue-500/20 hover:bg-blue-600/30 text-blue-400',
      emerald: active ? 'bg-emerald-600 border-emerald-500' : 'bg-emerald-600/10 border-emerald-500/20 hover:bg-emerald-600/30 text-emerald-400',
      purple: active ? 'bg-purple-600 border-purple-500' : 'bg-purple-600/10 border-purple-500/20 hover:bg-purple-600/30 text-purple-400',
      pink: active ? 'bg-pink-600 border-pink-500' : 'bg-pink-600/10 border-pink-500/20 hover:bg-pink-600/30 text-pink-400',
      amber: active ? 'bg-amber-600 border-amber-500' : 'bg-amber-600/10 border-amber-500/20 hover:bg-amber-600/30 text-amber-400',
      indigo: active ? 'bg-indigo-600 border-indigo-500' : 'bg-indigo-600/10 border-indigo-500/20 hover:bg-indigo-600/30 text-indigo-400'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
        {language === 'KO' ? '빠른 변주' : 'Quick Variations'}
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        {buttons.map(btn => {
          const template = VARIATION_TEMPLATES.find(t => t.id === btn.id);
          return (
            <button
              key={btn.id}
              onClick={() => onApplyVariation(btn.id)}
              className={`p-2.5 border rounded-lg transition-all group ${getColorClasses(btn.color)}`}
              title={template ? (language === 'KO' ? template.nameKR : template.name) : ''}
            >
              <i className={`fa-solid ${btn.icon} text-sm`}></i>
            </button>
          );
        })}
      </div>
    </div>
  );
};
