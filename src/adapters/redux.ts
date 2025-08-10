import { createSlice, createAsyncThunk, PayloadAction, SliceCaseReducers, ValidateSliceCaseReducers } from '@reduxjs/toolkit';
import { TranslationCore } from '../core/TranslationCore';
import {
  TranslationState,
  TranslationActions,
  TranslationStore,
  ReactTranslationConfig,
  TranslationAdapter
} from '../types';

// Serializable error interface
export interface SerializableError {
  message: string;
  name: string;
  stack?: string;
}

// Redux state interface extending the base TranslationState
export interface ReduxTranslationState extends TranslationState {
  // Additional Redux-specific state
  lastUpdated: number;
  pendingActions: string[];
  performanceMetrics: {
    translationTime: number;
    cacheHitRate: number;
    lastCacheCleanup: number;
  };
  // Use serializable error instead of Error object
  error: SerializableError | null;
}

// Redux actions interface
export interface ReduxTranslationActions {
  // Core actions
  setLocale: (locale: string) => Promise<void>;
  loadTranslations: (locale: string) => Promise<void>;
  translate: (key: string, params?: Record<string, any>) => string;
  translatePlural: (key: string, count: number, params?: Record<string, any>) => string;
  formatDate: (date: Date, options?: any) => string;
  formatNumber: (number: number, options?: any) => string;
  getTextDirection: (text: string) => 'ltr' | 'rtl' | 'auto';
  isRTLLocale: (locale: string) => boolean;
  reloadTranslations: () => Promise<void>;
  clearCache: () => void;
  
  // Redux-specific actions
  setPerformanceMetrics: (metrics: Partial<ReduxTranslationState['performanceMetrics']>) => void;
  addPendingAction: (actionId: string) => void;
  removePendingAction: (actionId: string) => void;
  updateLastUpdated: () => void;
}

// Combined Redux store interface
export interface ReduxTranslationStore extends ReduxTranslationState, ReduxTranslationActions {
  getAvailableLocales?: () => string[];
  dispatch: any;
  getState: () => ReduxTranslationState;
}

// Utility function to serialize errors
const serializeError = (error: Error | null): SerializableError | null => {
  if (!error) return null;
  return {
    message: error.message,
    name: error.name,
    stack: error.stack
  };
};

// Utility function to deserialize errors
const deserializeError = (serializedError: SerializableError | null): Error | null => {
  if (!serializedError) return null;
  const error = new Error(serializedError.message);
  error.name = serializedError.name;
  error.stack = serializedError.stack;
  return error;
};

// Async thunk for loading translations
export const loadTranslationsAsync = createAsyncThunk(
  'translation/loadTranslations',
  async (locale: string, { dispatch, getState }: { dispatch: any; getState: any }) => {
    const startTime = performance.now();
    
    try {
      // Get the core instance from the store
      const state = getState() as { translation: ReduxTranslationState & { core?: TranslationCore } };
      const core = (getState as any).core || (state as any).core || state.translation.core;
      
      if (!core) {
        throw new Error('Translation core not initialized');
      }
      
      // Load translations
      await core.loadTranslations(locale);
      
      const endTime = performance.now();
      const translationTime = endTime - startTime;
      
      // Update performance metrics
      dispatch(setPerformanceMetrics({ translationTime }));
      
      return { locale, success: true };
    } catch (error) {
      const endTime = performance.now();
      const translationTime = endTime - startTime;
      
      dispatch(setPerformanceMetrics({ translationTime }));
      throw error;
    }
  }
);

// Async thunk for reloading translations
export const reloadTranslationsAsync = createAsyncThunk(
  'translation/reloadTranslations',
  async (_, { dispatch, getState }: { dispatch: any; getState: any }) => {
    const startTime = performance.now();
    
    try {
      const state = getState() as { translation: ReduxTranslationState & { core?: TranslationCore } };
      const core = (getState as any).core || (state as any).core || state.translation.core;
      
      if (!core) {
        throw new Error('Translation core not initialized');
      }
      
      await core.reloadTranslations();
      
      const endTime = performance.now();
      const translationTime = endTime - startTime;
      
      dispatch(setPerformanceMetrics({ translationTime }));
      
      return { success: true };
    } catch (error) {
      const endTime = performance.now();
      const translationTime = endTime - startTime;
      
      dispatch(setPerformanceMetrics({ translationTime }));
      throw error;
    }
  }
);

// Redux slice for translation state
export const translationSlice = createSlice({
  name: 'translation',
  initialState: {
    locale: 'en',
    translations: {},
    isLoading: false,
    error: null,
    isInitialized: false,
    lastUpdated: Date.now(),
    pendingActions: [],
    performanceMetrics: {
      translationTime: 0,
      cacheHitRate: 0,
      lastCacheCleanup: Date.now()
    }
  } as ReduxTranslationState,
  reducers: {
    setLocale: (state, action: PayloadAction<string>) => {
      state.locale = action.payload;
      state.lastUpdated = Date.now();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<Error | SerializableError | null | undefined>) => {
      // Handle both Error objects and SerializableError
      if (action.payload instanceof Error) {
        state.error = serializeError(action.payload);
      } else {
        // Convert undefined to null for consistency
        state.error = action.payload ?? null;
      }
      state.lastUpdated = Date.now();
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
    setTranslations: (state, action: PayloadAction<Record<string, any>>) => {
      state.translations = action.payload;
      state.lastUpdated = Date.now();
    },
    setPerformanceMetrics: (state, action: PayloadAction<Partial<ReduxTranslationState['performanceMetrics']>>) => {
      state.performanceMetrics = { ...state.performanceMetrics, ...action.payload };
    },
    addPendingAction: (state, action: PayloadAction<string>) => {
      if (!state.pendingActions.includes(action.payload)) {
        state.pendingActions.push(action.payload);
      }
    },
    removePendingAction: (state, action: PayloadAction<string>) => {
      state.pendingActions = state.pendingActions.filter(id => id !== action.payload);
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = Date.now();
    },
    clearCache: (state) => {
      state.translations = {};
      state.performanceMetrics.lastCacheCleanup = Date.now();
      state.lastUpdated = Date.now();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTranslationsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        // Fix: Use the action creator instead of calling it as a function
        if (!state.pendingActions.includes('loadTranslations')) {
          state.pendingActions.push('loadTranslations');
        }
      })
      .addCase(loadTranslationsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Fix: Use the action creator instead of calling it as a function
        state.pendingActions = state.pendingActions.filter(id => id !== 'loadTranslations');
        state.lastUpdated = Date.now();
      })
      .addCase(loadTranslationsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = serializeError(action.error as Error);
        // Fix: Use the action creator instead of calling it as a function
        state.pendingActions = state.pendingActions.filter(id => id !== 'loadTranslations');
        state.lastUpdated = Date.now();
      })
      .addCase(reloadTranslationsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        // Fix: Use the action creator instead of calling it as a function
        if (!state.pendingActions.includes('reloadTranslations')) {
          state.pendingActions.push('reloadTranslations');
        }
      })
      .addCase(reloadTranslationsAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        // Fix: Use the action creator instead of calling it as a function
        state.pendingActions = state.pendingActions.filter(id => id !== 'reloadTranslations');
        state.lastUpdated = Date.now();
      })
      .addCase(reloadTranslationsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = serializeError(action.error as Error);
        // Fix: Use the action creator instead of calling it as a function
        state.pendingActions = state.pendingActions.filter(id => id !== 'reloadTranslations');
        state.lastUpdated = Date.now();
      });
  }
});

// Export actions
export const {
  setLocale,
  setLoading,
  setError,
  setInitialized,
  setTranslations,
  setPerformanceMetrics,
  addPendingAction,
  removePendingAction,
  updateLastUpdated,
  clearCache
} = translationSlice.actions;

// Export reducer
export const translationReducer = translationSlice.reducer;

// Redux adapter implementation
export class ReduxAdapter implements TranslationAdapter {
  private core: TranslationCore;
  private store: any;
  private unsubscribe: (() => void) | null = null;

  constructor(core: TranslationCore, store: any) {
    this.core = core;
    this.store = store;
    
    // Subscribe to core changes and sync with Redux
    this.unsubscribe = this.core.subscribe((newState) => {
      this.store.dispatch(setTranslations(newState.translations));
      this.store.dispatch(setLocale(newState.locale));
      this.store.dispatch(setLoading(newState.isLoading));
      this.store.dispatch(setError(newState.error));
      this.store.dispatch(setInitialized(newState.isInitialized));
    });
  }

  getState(): TranslationState {
    const reduxState = this.store.getState().translation;
    return {
      ...reduxState,
      // Convert serialized error back to Error object for compatibility
      error: deserializeError(reduxState.error)
    };
  }

  getActions(): TranslationActions {
    const dispatch = this.store.dispatch;
    const getState = () => this.store.getState().translation;
    
    return {
      setLocale: async (locale: string) => {
        await this.core.setLocale(locale);
        dispatch(setLocale(locale));
      },
      loadTranslations: async (locale: string) => {
        // Call core method first, then dispatch async thunk
        await this.core.loadTranslations(locale);
        dispatch(loadTranslationsAsync(locale));
      },
      translate: (key: string, params?: Record<string, any>) => {
        const result = this.core.translate(key, params);
        dispatch(updateLastUpdated());
        return result;
      },
      translatePlural: (key: string, count: number, params?: Record<string, any>) => {
        const result = this.core.translatePlural(key, count, params);
        dispatch(updateLastUpdated());
        return result;
      },
      formatDate: (date: Date, options?: any) => {
        const result = this.core.formatDate(date, options);
        dispatch(updateLastUpdated());
        return result;
      },
      formatNumber: (number: number, options?: any) => {
        const result = this.core.formatNumber(number, options);
        dispatch(updateLastUpdated());
        return result;
      },
      getTextDirection: (text: string) => {
        return this.core.getTextDirection(text);
      },
      isRTLLocale: (locale: string) => {
        return this.core.isRTLLocale(locale);
      },
      reloadTranslations: async () => {
        // Call core method first, then dispatch async thunk
        await this.core.reloadTranslations();
        dispatch(reloadTranslationsAsync());
      },
      clearCache: () => {
        this.core.clearCache();
        dispatch(clearCache());
      }
    };
  }

  subscribe(listener: (state: TranslationState) => void): () => void {
    let previousState = this.getState();
    
    const unsubscribe = this.store.subscribe(() => {
      const currentState = this.getState();
      if (currentState !== previousState) {
        previousState = currentState;
        listener(currentState);
      }
    });
    
    return unsubscribe;
  }

  async initialize(config: ReactTranslationConfig): Promise<void> {
    try {
      this.store.dispatch(setLoading(true));
      this.store.dispatch(setError(null));
      
      await this.core.initialize();
      
      this.store.dispatch(setInitialized(true));
      this.store.dispatch(setLoading(false));
    } catch (error) {
      this.store.dispatch(setError(error as Error));
      this.store.dispatch(setLoading(false));
      throw error;
    }
  }

  destroy(): void {
    if (this.unsubscribe && typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.core.destroy();
  }
}

// Factory function to create Redux adapter
export const createReduxAdapter = (core: TranslationCore, store: any): ReduxAdapter => {
  return new ReduxAdapter(core, store);
};

// Hook to use Redux translation store
export const useReduxTranslation = () => {
  const { useSelector, useDispatch } = require('react-redux');
  const dispatch = useDispatch();
  
  const state = useSelector((rootState: any) => rootState.translation);
  
  const actions = {
    setLocale: (locale: string) => dispatch(setLocale(locale)),
    loadTranslations: (locale: string) => dispatch(loadTranslationsAsync(locale)),
    reloadTranslations: () => dispatch(reloadTranslationsAsync()),
    clearCache: () => dispatch(clearCache()),
    setPerformanceMetrics: (metrics: Partial<ReduxTranslationState['performanceMetrics']>) => 
      dispatch(setPerformanceMetrics(metrics))
  };
  
  return {
    ...state,
    // Convert serialized error back to Error object for compatibility
    error: deserializeError(state.error),
    ...actions
  };
};

// Hook to use Redux translation with performance monitoring
export const useReduxTranslationWithMetrics = () => {
  const { useSelector, useDispatch } = require('react-redux');
  const dispatch = useDispatch();
  
  const state = useSelector((rootState: any) => rootState.translation);
  
  const actions = {
    setLocale: (locale: string) => {
      const startTime = performance.now();
      dispatch(setLocale(locale));
      const endTime = performance.now();
      dispatch(setPerformanceMetrics({ 
        translationTime: endTime - startTime 
      }));
    },
    loadTranslations: (locale: string) => dispatch(loadTranslationsAsync(locale)),
    reloadTranslations: () => dispatch(reloadTranslationsAsync()),
    clearCache: () => dispatch(clearCache()),
    setPerformanceMetrics: (metrics: Partial<ReduxTranslationState['performanceMetrics']>) => 
      dispatch(setPerformanceMetrics(metrics))
  };
  
  return {
    ...state,
    // Convert serialized error back to Error object for compatibility
    error: deserializeError(state.error),
    ...actions,
    // Performance monitoring utilities
    getPerformanceMetrics: () => state.performanceMetrics,
    isActionPending: (actionId: string) => state.pendingActions.includes(actionId),
    getLastUpdated: () => state.lastUpdated
  };
};


