/**
 * Module Launcher App
 * Dynamic module loading with workspace-style interface
 */

import React, { useState, useEffect } from 'react';
import { ModuleLoader } from './core/ModuleLoader';
import { ModuleMetadata } from './core/EngineInterface';
import { Imagen4UI } from './modules/imagen4-generator/Imagen4UI';
import { Imagen3ProUI } from './modules/imagen3-pro/Imagen3ProUI';
import { ApiKeySelector } from './components/ApiKeySelector';

const App: React.FC = () => {
  const [loader] = useState(() => new ModuleLoader());
  const [modules, setModules] = useState<ModuleMetadata[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiDialog, setShowApiDialog] = useState(false);

  useEffect(() => {
    // Load available modules
    setModules(loader.getAvailableModules());

    // Use proxy mode (no API key required for public)
    setApiKey('proxy'); // Special value to indicate proxy mode
  }, []);

  const handleModuleSwitch = (moduleId: string) => {
    setActiveModuleId(moduleId);
  };

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowApiDialog(false);
  };

  // Render active module
  const renderModule = () => {
    // Always use proxy mode for public deployment
    switch (activeModuleId) {
      case 'imagen4-generator':
        return <Imagen4UI apiKey={apiKey} />;
      
      case 'imagen3-pro':
        return <Imagen3ProUI apiKey={apiKey} />;
      
      case 'lumina-lookbook':
        return (
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950">
            <div className="text-center max-w-md p-8 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
              <div className="text-6xl mb-4">👗</div>
              <h2 className="text-2xl font-bold text-white mb-4">Lumina Lookbook</h2>
              <p className="text-white/60 mb-6">
                This is a demo module showing how to integrate third-party AI engines.
                Replace the placeholder code with actual Lumina AI API integration.
              </p>
              <button
                onClick={() => setActiveModuleId(null)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium"
              >
                Back to Module Selector
              </button>
            </div>
          </div>
        );
      
      default:
        return <ModuleSelector modules={modules} onSelect={handleModuleSwitch} />;
    }
  };

  return (
    <>
      {renderModule()}

      {/* Module Switcher Button */}
      {activeModuleId && (
        <button
          onClick={() => setActiveModuleId(null)}
          className="fixed top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-lg border border-white/20 rounded-full hover:bg-black/80 transition-all z-50 flex items-center justify-center"
          title="Switch Module"
        >
          <i className="fa-solid fa-arrow-left text-white text-xs"></i>
        </button>
      )}
    </>
  );
};

// Module Selector Component
interface ModuleSelectorProps {
  modules: ModuleMetadata[];
  onSelect: (moduleId: string) => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ modules, onSelect }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-8">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            🎨 Monk AI Studio <span className="text-purple-400">Modular</span>
          </h1>
          <p className="text-xl text-white/60">
            Choose your AI generation workspace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => onSelect(module.id)}
              className="group relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${module.color}10, transparent)`
              }}
            >
              <div className="text-6xl mb-4">{module.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{module.displayName}</h3>
              <p className="text-sm text-white/60 mb-4">{module.description}</p>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{module.provider}</span>
                <span>v{module.version}</span>
              </div>
              <div className="absolute top-4 right-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  module.category === 'generator' ? 'bg-blue-500/20 text-blue-300' :
                  module.category === 'transformer' ? 'bg-green-500/20 text-green-300' :
                  'bg-purple-500/20 text-purple-300'
                }`}>
                  {module.category}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/40 text-sm">
            💡 Each module runs independently with isolated state and optimized bundle size
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
