import { TranslationService, TranslationConfig } from '@logistically/i18n';
import {
  TranslationState,
  TranslationActions,
  TranslationStore,
  ReactTranslationConfig,
  TranslationAdapter
} from '../types';

export class TranslationCore {
  private translationService: TranslationService;
  private config: ReactTranslationConfig;
  private state: TranslationState;
  private listeners: Set<(state: TranslationState) => void> = new Set();
  private adapter?: TranslationAdapter;

  constructor(config: ReactTranslationConfig) {
    this.config = config;
    
    // Convert ReactTranslationConfig to TranslationConfig
    const coreConfig: TranslationConfig = {
      ...config,
      debug: typeof config.debug === 'boolean' ? config.debug : config.debug?.enabled || false
    };
    
    this.translationService = new TranslationService(coreConfig);
    
    this.state = {
      locale: config.defaultLocale || 'en',
      translations: {},
      isLoading: false,
      error: null,
      isInitialized: false
    };
  }

  // State management
  getState(): TranslationState {
    return { ...this.state };
  }

  private setState(updates: Partial<TranslationState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  subscribe(listener: (state: TranslationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Actions
  getActions(): TranslationActions {
    return {
      setLocale: this.setLocale.bind(this),
      loadTranslations: this.loadTranslations.bind(this),
      translate: this.translate.bind(this),
      translatePlural: this.translatePlural.bind(this),
      formatDate: this.formatDate.bind(this),
      formatNumber: this.formatNumber.bind(this),
      getTextDirection: this.getTextDirection.bind(this),
      isRTLLocale: this.isRTLLocale.bind(this),
      reloadTranslations: this.reloadTranslations.bind(this),
      clearCache: this.clearCache.bind(this)
    };
  }

  // Core actions implementation
  async setLocale(locale: string): Promise<void> {
    if (this.state.locale === locale) return;

    this.setState({ 
      locale, 
      isLoading: true, 
      error: null 
    });

    try {
      await this.loadTranslations(locale);
      this.setState({ 
        isLoading: false, 
        isInitialized: true 
      });
    } catch (error) {
      this.setState({ 
        isLoading: false, 
        error: error as Error 
      });
      throw error;
    }
  }

  async loadTranslations(locale: string): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });
      
      // The core service loads translations automatically
      // We just need to reload to ensure the locale is loaded
      this.translationService.reloadTranslations();
      
      // Get available keys for this locale
      const keys = this.translationService.getKeys(locale);
      const translations: Record<string, any> = {};
      
      // Build translations object from available keys
      keys.forEach(key => {
        translations[key] = this.translationService.translate(key, locale);
      });
      
      this.setState({ 
        translations, 
        isLoading: false,
        isInitialized: true 
      });
    } catch (error) {
      this.setState({ 
        isLoading: false, 
        error: error as Error 
      });
      throw error;
    }
  }

  translate(key: string, params?: Record<string, any>): string {
    try {
      return this.translationService.translate(key, this.state.locale, params);
    } catch (error) {
      const debugConfig = typeof this.config.debug === 'object' ? this.config.debug : { enabled: false };
      if (debugConfig.logMissingKeys) {
        console.warn(`Translation key not found: ${key} (locale: ${this.state.locale})`);
      }
      return key;
    }
  }

  translatePlural(key: string, count: number, params?: Record<string, any>): string {
    try {
      return this.translationService.translatePlural(key, count, this.state.locale, params);
    } catch (error) {
      const debugConfig = typeof this.config.debug === 'object' ? this.config.debug : { enabled: false };
      if (debugConfig.logMissingKeys) {
        console.warn(`Translation key not found: ${key} (locale: ${this.state.locale})`);
      }
      return key;
    }
  }

  formatDate(date: Date, options?: any): string {
    return this.translationService.formatDateForLocale(date, this.state.locale, options);
  }

  formatNumber(number: number, options?: any): string {
    return this.translationService.formatNumberForLocale(number, this.state.locale);
  }

  getTextDirection(text: string): 'ltr' | 'rtl' | 'auto' {
    return this.translationService.getTextDirection(text);
  }

  isRTLLocale(locale: string): boolean {
    return this.translationService.isRTLLocale(locale);
  }

  async reloadTranslations(): Promise<void> {
    await this.loadTranslations(this.state.locale);
  }

  clearCache(): void {
    this.translationService.clearCache();
  }

  // Adapter management
  setAdapter(adapter: TranslationAdapter): void {
    this.adapter = adapter;
  }

  getAdapter(): TranslationAdapter | undefined {
    return this.adapter;
  }

  // Initialization
  async initialize(initialLocale?: string): Promise<void> {
    const locale = initialLocale || this.config.defaultLocale || 'en';
    
    try {
      this.setState({ isLoading: true, error: null });
      
      // Set the locale first
      this.setState({ locale });
      
      // The translation service is already initialized in constructor
      // Load initial translations
      await this.loadTranslations(locale);
      
      this.setState({ 
        isLoading: false, 
        isInitialized: true 
      });
    } catch (error) {
      this.setState({ 
        isLoading: false, 
        error: error as Error 
      });
      throw error;
    }
  }

  // Cleanup
  destroy(): void {
    this.listeners.clear();
    this.translationService.clearCache();
  }

  // Utility methods
  getTranslationService(): TranslationService {
    return this.translationService;
  }

  getConfig(): ReactTranslationConfig {
    return this.config;
  }

  isInitialized(): boolean {
    return this.state.isInitialized;
  }
}
