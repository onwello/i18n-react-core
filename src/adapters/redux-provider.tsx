import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { TranslationCore } from '../core/TranslationCore';
import { ReduxAdapter, translationReducer, createReduxAdapter } from './redux';
import {
  ReactTranslationConfig,
  TranslationStore
} from '../types';

// Create Redux store context
const ReduxStoreContext = createContext<any>(null);

// Redux store configuration
const createTranslationStore = (core: TranslationCore) => {
  // Create the store with the translation reducer
  const store = configureStore({
    reducer: {
      translation: translationReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types for serialization checks
          ignoredActions: [
            'translation/setError',
            'translation/loadTranslations/pending',
            'translation/loadTranslations/fulfilled',
            'translation/loadTranslations/rejected',
            'translation/reloadTranslations/pending',
            'translation/reloadTranslations/fulfilled',
            'translation/reloadTranslations/rejected'
          ],
          // Ignore these field paths in all actions
          ignoredActionPaths: ['payload.error', 'error'],
          // Ignore these paths in the state
          ignoredPaths: ['translation.error'],
          // Increase warning threshold for better performance
          warnAfter: 128
        },
        immutableCheck: {
          // Ignore these paths for immutability checks
          ignoredPaths: ['translation.error']
        }
      }),
    devTools: process.env.NODE_ENV !== 'production'
  });

  // Store the core instance in the store for async thunks to access
  (store as any).core = core;

  return store;
};

// Redux translation provider props
interface ReduxTranslationProviderProps {
  children: ReactNode;
  config: ReactTranslationConfig;
  initialLocale?: string;
  store?: any; // Allow external store injection
}

// Redux translation provider component
export const ReduxTranslationProvider: React.FC<ReduxTranslationProviderProps> = ({
  children,
  config,
  initialLocale,
  store: externalStore
}) => {
  const [internalStore, setInternalStore] = useState<any>(null);
  const [adapter, setAdapter] = useState<ReduxAdapter | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const core = new TranslationCore(config);
    
    // Use external store if provided, otherwise create internal store
    const store = externalStore || createTranslationStore(core);
    
    // Create Redux adapter
    const reduxAdapter = createReduxAdapter(core, store);
    
    setInternalStore(store);
    setAdapter(reduxAdapter);

    // Initialize the adapter
    const initialize = async () => {
      try {
        await reduxAdapter.initialize(config);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Redux translation provider:', error);
        setIsInitialized(true); // Set to true even on error to prevent infinite loading
      }
    };

    initialize();

    return () => {
      reduxAdapter.destroy();
    };
  }, [config, externalStore]);

  if (!internalStore || !adapter || !isInitialized) {
    return (
      <div>Initializing Redux Translation Provider...</div>
    );
  }

  return (
    <ReduxStoreContext.Provider value={internalStore}>
      <ReduxProvider store={internalStore}>
        {children}
      </ReduxProvider>
    </ReduxStoreContext.Provider>
  );
};

// Hook to access the Redux store context
export const useReduxStore = () => {
  const store = useContext(ReduxStoreContext);
  if (!store) {
    throw new Error('useReduxStore must be used within a ReduxTranslationProvider');
  }
  return store;
};

// Hook to access the Redux adapter
export const useReduxAdapter = () => {
  const store = useReduxStore();
  // This is a simplified approach - in a real implementation, you might want to
  // store the adapter reference differently or access it through the store
  return store;
};

// Export the Redux provider
export default ReduxTranslationProvider;
