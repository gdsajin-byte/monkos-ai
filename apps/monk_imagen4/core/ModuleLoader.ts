/**
 * Dynamic Module Loader
 * Handles lazy loading and lifecycle management of AI engine modules
 */

import { IImageEngine, ModuleMetadata } from './EngineInterface';

export class ModuleLoader {
  private modules: Map<string, IImageEngine> = new Map();
  private metadata: ModuleMetadata[] = [];

  constructor() {
    this.registerModules();
  }

  /**
   * Register available modules
   */
  private registerModules() {
    this.metadata = [
      {
        id: 'imagen4-generator',
        displayName: 'Imagen 4 Generator',
        description: 'Text-to-Image generation with Google Imagen 4.0',
        icon: '🎨',
        color: '#4285F4',
        category: 'generator',
        provider: 'Google Gemini',
        version: '4.0.0'
      },
      {
        id: 'imagen3-pro',
        displayName: 'Imagen 3 Pro Suite',
        description: 'Image transformation, editing, and upscaling',
        icon: '✨',
        color: '#34A853',
        category: 'transformer',
        provider: 'Google Gemini',
        version: '3.0.0'
      },
      {
        id: 'lumina-lookbook',
        displayName: 'Lumina Lookbook',
        description: 'Fashion-specific AI generation for lookbooks',
        icon: '👗',
        color: '#EA4335',
        category: 'generator',
        provider: 'Lumina AI',
        version: '1.0.0'
      }
    ];
  }

  /**
   * Load a module dynamically
   */
  async loadModule(moduleId: string): Promise<IImageEngine> {
    // Check if already loaded
    if (this.modules.has(moduleId)) {
      return this.modules.get(moduleId)!;
    }

    // Dynamic import based on module ID
    let engine: IImageEngine;
    
    switch (moduleId) {
      case 'imagen4-generator':
        const { Imagen4Generator } = await import('../modules/imagen4-generator/Imagen4Generator');
        engine = new Imagen4Generator();
        break;
      
      case 'imagen3-pro':
        const { Imagen3ProSuite } = await import('../modules/imagen3-pro/Imagen3ProSuite');
        engine = new Imagen3ProSuite();
        break;
      
      case 'lumina-lookbook':
        const { LuminaLookbook } = await import('../modules/lumina-lookbook/LuminaLookbook');
        engine = new LuminaLookbook();
        break;
      
      default:
        throw new Error(`Unknown module: ${moduleId}`);
    }

    // Store in cache
    this.modules.set(moduleId, engine);
    return engine;
  }

  /**
   * Get list of available modules
   */
  getAvailableModules(): ModuleMetadata[] {
    return [...this.metadata];
  }

  /**
   * Unload a module and cleanup
   */
  unloadModule(moduleId: string): void {
    const engine = this.modules.get(moduleId);
    if (engine) {
      engine.dispose();
      this.modules.delete(moduleId);
    }
  }

  /**
   * Unload all modules
   */
  dispose(): void {
    this.modules.forEach(engine => engine.dispose());
    this.modules.clear();
  }
}
