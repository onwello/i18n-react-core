// React Native specific exports
export * from '../core/TranslationCore';
export * from '../adapters/context';
export * from '../types/react-native';
export * from '../components/TranslatedTextRN';

// Re-export core types that work in React Native
export type {
  TranslationState,
  TranslationActions,
  TranslationStore,
  UseTranslationReturn,
  UseLocaleReturn,
  TranslationProviderProps,
  TranslationAdapter
} from '../types';

// Re-export hooks that work in React Native
export {
  useTranslation,
  useLocale
} from '../adapters/context';

// Re-export core components
export {
  TranslationProvider
} from '../adapters/context';
