import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { TranslationCore } from '../core/TranslationCore';
import {
  TranslationState,
  TranslationActions,
  TranslationStore,
  ReactTranslationConfig,
  TranslationAdapter
} from '../types';

// Create the context
const TranslationContext = createContext<TranslationStore | null>(null);

// Context adapter implementation
export class ContextAdapter implements TranslationAdapter {
  private core: TranslationCore;
  private state: TranslationState;
  private listeners: Set<(state: TranslationState) => void> = new Set();

  constructor(core: TranslationCore) {
    this.core = core;
    this.state = core.getState();
    
    // Subscribe to core changes
    this.core.subscribe((newState) => {
      this.state = newState;
      this.notifyListeners();
    });
  }

  getState(): TranslationState {
    return this.state;
  }

  getActions(): TranslationActions {
    return this.core.getActions();
  }

  subscribe(listener: (state: TranslationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  async initialize(): Promise<void> {
    await this.core.initialize();
  }

  destroy(): void {
    this.listeners.clear();
    this.core.destroy();
  }
}

// Provider component
interface TranslationProviderProps {
  children: ReactNode;
  config: ReactTranslationConfig;
  initialLocale?: string;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  config,
  initialLocale
}) => {
  const [store, setStore] = useState<TranslationStore | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const core = new TranslationCore(config);
    const adapter = new ContextAdapter(core);
    
    // Create initial store immediately
    const initialStore: TranslationStore = {
      ...adapter.getState(),
      ...adapter.getActions()
    };
    
    // Set initial store immediately so components can use it
    setStore(initialStore);

    // Subscribe to adapter state changes
    const unsubscribe = adapter.subscribe((newState) => {
      const actions = adapter.getActions();
      setStore({
        ...newState,
        ...actions
      });
    });

    // Initialize
    const initialize = async () => {
      try {
        await core.initialize(initialLocale);
        
        // Update store with initial state
        const initialState = adapter.getState();
        const actions = adapter.getActions();
        
        setStore({
          ...initialState,
          ...actions
        });
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize translation provider:', error);
        // Set store even with error for error handling
        setStore({
          ...adapter.getState(),
          ...adapter.getActions()
        });
        setIsInitialized(true);
      }
    };

    initialize();

    // Cleanup
    return () => {
      unsubscribe();
      adapter.destroy();
    };
  }, [config, initialLocale]);

  // Show loading state while initializing
  if (!store) {
    return (
      <TranslationContext.Provider value={null}>
        <div>Loading...</div>
      </TranslationContext.Provider>
    );
  }

  return (
    <TranslationContext.Provider value={store}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to use the translation store
export const useTranslationStore = (): TranslationStore => {
  const store = useContext(TranslationContext);
  
  if (!store) {
    throw new Error(
      'useTranslationStore must be used within a TranslationProvider'
    );
  }
  
  return store;
};

// Hook for translation functionality
export const useTranslation = () => {
  const store = useTranslationStore();
  
  return {
    t: (key: string, options?: any) => store.translate(key, options?.params),
    translate: store.translate,
    translatePlural: store.translatePlural,
    formatDate: store.formatDate,
    formatNumber: store.formatNumber,
    getTextDirection: store.getTextDirection,
    isLoading: store.isLoading,
    error: store.error,
    locale: store.locale,
    setLocale: store.setLocale,
    isRTLLocale: store.isRTLLocale,
    reloadTranslations: store.reloadTranslations,
    clearCache: store.clearCache
  };
};

// Hook for locale management
export const useLocale = () => {
  const store = useTranslationStore();
  
  return {
    locale: store.locale,
    setLocale: store.setLocale,
    supportedLocales: ['en', 'fr', 'es'], // From config, but we'll hardcode for now
    isRTL: store.isRTLLocale(store.locale),
    direction: store.getTextDirection(''),
    isRTLLocale: store.isRTLLocale
  };
};

// Factory function to create context adapter
export const createContextAdapter = (core: TranslationCore): ContextAdapter => {
  return new ContextAdapter(core);
};
