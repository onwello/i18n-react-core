// Core exports
export { TranslationCore } from './core/TranslationCore';

// Types
export type {
  TranslationState,
  TranslationActions,
  TranslationStore,
  ReactTranslationConfig,
  UseTranslationOptions,
  UseTranslationReturn,
  UseLocaleReturn,
  TranslationProviderProps,
  TranslatedTextProps,
  TranslationAdapter,
  CreateStoreFunction,
  SSRContext,
  SSRUtils
} from './types';

// Context API (default adapter)
export {
  TranslationProvider,
  useTranslationStore,
  useTranslation,
  useLocale,
  createContextAdapter,
  ContextAdapter
} from './adapters/context';

// Redux adapter
export {
  ReduxAdapter,
  createReduxAdapter,
  translationReducer,
  loadTranslationsAsync,
  reloadTranslationsAsync,
  useReduxTranslation,
  useReduxTranslationWithMetrics
} from './adapters/redux';

export {
  ReduxTranslationProvider,
  useReduxStore,
  useReduxAdapter
} from './adapters/redux-provider';

export type {
  ReduxTranslationState,
  ReduxTranslationActions,
  ReduxTranslationStore
} from './adapters/redux';

// Components
export {
  TranslatedText,
  TranslatedSpan,
  TranslatedDiv,
  TranslatedP,
  TranslatedH1,
  TranslatedH2,
  TranslatedH3,
  TranslatedLabel,
  TranslatedButton
} from './components/TranslatedText';

// SSR utilities
export {
  SSRTranslationUtils,
  getTranslation,
  preloadTranslations,
  createSSRContext,
  serializeContext,
  deserializeContext,
  getServerSideTranslations,
  getServerTranslation
} from './ssr';

// Re-export core i18n types for convenience
export type {
  TranslationConfig,
  TranslationOptions,
  TranslationMetadata,
  TranslationStats
} from '@logistically/i18n';
