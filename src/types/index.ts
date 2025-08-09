import { ReactNode } from 'react';
import { TranslationService, TranslationConfig } from '@logistically/i18n';

// Core state interface
export interface TranslationState {
  locale: string;
  translations: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean;
}

// Core actions interface
export interface TranslationActions {
  setLocale: (locale: string) => void;
  loadTranslations: (locale: string) => Promise<void>;
  translate: (key: string, params?: Record<string, any>) => string;
  translatePlural: (key: string, count: number, params?: Record<string, any>) => string;
  formatDate: (date: Date, options?: any) => string;
  formatNumber: (number: number, options?: any) => string;
  getTextDirection: (text: string) => 'ltr' | 'rtl' | 'auto';
  isRTLLocale: (locale: string) => boolean;
  reloadTranslations: () => Promise<void>;
  clearCache: () => void;
}

// Combined state and actions
export interface TranslationStore extends TranslationState, TranslationActions {
  getAvailableLocales?: () => string[];
}

// Configuration interface
export interface ReactTranslationConfig extends Omit<TranslationConfig, 'debug'> {
  // React-specific options
  ssr?: {
    enabled: boolean;
    preloadLocales?: string[];
  };
  debug?: {
    enabled: boolean;
    logMissingKeys?: boolean;
    logPerformance?: boolean;
  } | boolean;
}

// Hook options
export interface UseTranslationOptions {
  locale?: string;
  fallbackLocale?: string;
  params?: Record<string, any>;
  debug?: boolean;
}

// Hook return type
export interface UseTranslationReturn {
  t: (key: string, options?: UseTranslationOptions) => string;
  translate: (key: string, options?: UseTranslationOptions) => string;
  translatePlural: (key: string, count: number, options?: UseTranslationOptions) => string;
  formatDate: (date: Date, options?: any) => string;
  formatNumber: (number: number, options?: any) => string;
  getTextDirection: (text: string) => 'ltr' | 'rtl' | 'auto';
  isLoading: boolean;
  error: Error | null;
  locale: string;
  setLocale: (locale: string) => void;
  isRTLLocale: (locale: string) => boolean;
  reloadTranslations: () => Promise<void>;
  clearCache: () => void;
}

// Locale hook return type
export interface UseLocaleReturn {
  locale: string;
  setLocale: (locale: string) => void;
  supportedLocales: string[];
  isRTL: boolean;
  direction: 'ltr' | 'rtl' | 'auto';
  isRTLLocale: (locale: string) => boolean;
}

// Provider props
export interface TranslationProviderProps {
  children: ReactNode;
  config: ReactTranslationConfig;
  initialLocale?: string;
}

// Component props
export interface TranslatedTextProps {
  translationKey: string;
  params?: Record<string, any>;
  locale?: string;
  fallback?: string;
  component?: React.ComponentType<any>;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  debug?: boolean;
}

// Adapter interface
export interface TranslationAdapter {
  getState: () => TranslationState;
  getActions: () => TranslationActions;
  subscribe: (listener: (state: TranslationState) => void) => () => void;
  initialize: (config: ReactTranslationConfig) => Promise<void>;
  destroy: () => void;
}

// Store factory function
export type CreateStoreFunction<T = any> = (
  core: any,
  config?: any
) => T;

// SSR context
export interface SSRContext {
  locale: string;
  translations: Record<string, any>;
  preloadedLocales: string[];
}

// SSR utilities
export interface SSRUtils {
  getTranslation: (locale: string) => Promise<Record<string, any>>;
  preloadTranslations: (locales: string[]) => Promise<void>;
  createSSRContext: (locale: string) => Promise<SSRContext>;
  serializeContext: (context: SSRContext) => string;
  deserializeContext: (serialized: string) => SSRContext;
}
