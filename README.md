# @logistically/i18n-react-core

React integration for `@logistically/i18n` with state management agnostic design, supporting React 18+, SSR, and React Native.

## ✨ Features

- **React 18+ Support**: Full compatibility with React 18+ features
- **SSR Priority**: Optimized for Next.js App Router and server-side rendering
- **State Management Agnostic**: Flexible core with adapters for different state management libraries
- **React Native Support**: Cross-platform components and utilities
- **TypeScript First**: Full TypeScript support with comprehensive type definitions
- **Performance Optimized**: Efficient rendering and caching strategies
- **RTL Support**: Built-in right-to-left language support
- **CLDR Compliant**: Unicode CLDR pluralization rules
- **Bundle Optimized**: Tree-shakable with multiple entry points

## 🚀 Quick Start

### Installation

```bash
npm install @logistically/i18n-react-core @logistically/i18n
```

### Basic Usage (Context API - Default)

```tsx
import React from 'react';
import { TranslationProvider, useTranslation } from '@logistically/i18n-react-core';

const config = {
  serviceName: 'my-app',
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
  translationsPath: 'src/translations'
};

const App = () => (
  <TranslationProvider config={config}>
    <MyComponent />
  </TranslationProvider>
);

const MyComponent = () => {
  const { t, locale, setLocale } = useTranslation();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.message', { name: 'John' })}</p>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );
};
```

### React Native Usage

```tsx
import React from 'react';
import { TranslationProvider, useTranslation } from '@logistically/i18n-react-core';
import { TranslatedTextRN } from '@logistically/i18n-react-core/react-native';

const App = () => (
  <TranslationProvider config={config}>
    <MyNativeComponent />
  </TranslationProvider>
);

const MyNativeComponent = () => {
  const { t, locale } = useTranslation();
  
  return (
    <TranslatedTextRN 
      translationKey="welcome.title"
      style={{ fontSize: 18, fontWeight: 'bold' }}
    />
  );
};
```

## 🔌 State Management Adapters

### Available Adapters

- **Context API** (default) - React Context with hooks
- **Redux** - Full Redux Toolkit integration with async thunks
- **Zustand** - Lightweight state management (placeholder - coming soon)

### Redux Integration (Full Implementation)

The Redux adapter provides a complete Redux Toolkit integration with performance monitoring, async actions, and comprehensive state management.

#### Setup with Redux

```tsx
import React from 'react';
import { ReduxTranslationProvider, useReduxTranslation } from '@logistically/i18n-react-core';

const config = {
  serviceName: 'my-app',
  defaultLocale: 'en',
  supportedLocales: ['en', 'es', 'fr', 'ar'],
  translationsPath: 'src/translations',
  pluralization: {
    enabled: true,
    formatNumbers: true,
    useDirectionalMarkers: true
  },
  cache: {
    enabled: true,
    maxSize: 1000,
    ttl: 300000 // 5 minutes
  }
};

const App = () => (
  <ReduxTranslationProvider config={config}>
    <MyReduxComponent />
  </ReduxTranslationProvider>
);
```

#### Using Redux Translation Hooks

```tsx
import React from 'react';
import { useReduxTranslation, useReduxTranslationWithMetrics } from '@logistically/i18n-react-core';

// Basic Redux translation hook
const BasicComponent = () => {
  const { t, locale, setLocale, isLoading, error } = useReduxTranslation();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      <button onClick={() => setLocale('es')}>Switch to Spanish</button>
    </div>
  );
};

// Advanced Redux translation hook with performance metrics
const AdvancedComponent = () => {
  const { 
    t, 
    locale, 
    setLocale, 
    performanceMetrics, 
    pendingActions,
    getPerformanceMetrics,
    isActionPending 
  } = useReduxTranslationWithMetrics();
  
  return (
    <div>
      <h1>{t('welcome.title')}</h1>
      
      {/* Performance Monitoring */}
      <div>
        <h3>Performance Metrics</h3>
        <p>Translation Time: {performanceMetrics.translationTime.toFixed(2)}ms</p>
        <p>Cache Hit Rate: {performanceMetrics.cacheHitRate.toFixed(2)}%</p>
        <p>Pending Actions: {pendingActions.length}</p>
      </div>
      
      {/* Action Status */}
      {isActionPending('loadTranslations') && (
        <div>Loading translations...</div>
      )}
    </div>
  );
};
```

#### Redux Store Integration

```tsx
import { configureStore } from '@reduxjs/toolkit';
import { translationReducer } from '@logistically/i18n-react-core';

// Create your Redux store
const store = configureStore({
  reducer: {
    translation: translationReducer,
    // ... other reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['translation/setError'],
        ignoredActionPaths: ['payload.error'],
        ignoredPaths: ['translation.error']
      }
    })
});

// Use with external store
const AppWithExternalStore = () => (
  <ReduxTranslationProvider config={config} store={store}>
    <MyApp />
  </ReduxTranslationProvider>
);
```

#### Redux Async Actions

```tsx
import { useDispatch, useSelector } from 'react-redux';
import { 
  loadTranslationsAsync, 
  reloadTranslationsAsync,
  setLocale,
  setPerformanceMetrics 
} from '@logistically/i18n-react-core';

const ReduxActionsComponent = () => {
  const dispatch = useDispatch();
  const { locale, isLoading, error } = useSelector((state: any) => state.translation);
  
  const handleLocaleChange = async (newLocale: string) => {
    try {
      // Dispatch async action
      await dispatch(loadTranslationsAsync(newLocale));
      
      // Update locale
      dispatch(setLocale(newLocale));
      
      // Update performance metrics
      dispatch(setPerformanceMetrics({ 
        translationTime: 150,
        cacheHitRate: 90 
      }));
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  };
  
  return (
    <div>
      <select value={locale} onChange={(e) => handleLocaleChange(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      
      <button onClick={() => dispatch(reloadTranslationsAsync())}>
        Reload Translations
      </button>
    </div>
  );
};
```

#### Redux State Structure

```typescript
interface ReduxTranslationState {
  // Core translation state
  locale: string;
  translations: Record<string, any>;
  isLoading: boolean;
  error: Error | null;
  isInitialized: boolean;
  
  // Redux-specific enhancements
  lastUpdated: number;
  pendingActions: string[];
  performanceMetrics: {
    translationTime: number;
    cacheHitRate: number;
    lastCacheCleanup: number;
  };
}
```

#### Redux DevTools Integration

The Redux adapter automatically integrates with Redux DevTools in development mode, providing:

- Action history and timing
- State inspection and time-travel debugging
- Performance monitoring
- Async action tracking

### Zustand Integration (Coming Soon)

```tsx
// Placeholder for future Zustand implementation
import { ZustandTranslationProvider, useZustandTranslation } from '@logistically/i18n-react-core';

// Will provide lightweight state management with similar API
```

## 🧪 Testing

### Current Test Coverage

- **Total Tests**: 140 passing
- **Statements**: 85.34%
- **Branches**: 56.45%
- **Functions**: 81.81%
- **Lines**: 83.16%

### Test Categories

- ✅ **React Components**: All 15 component tests passing
- ✅ **Context Adapter**: All 12 context tests passing
- ✅ **Integration Tests**: All 8 integration tests passing
- ✅ **React Native Support**: All 8 React Native tests passing
- ✅ **Redux Integration**: All 15 Redux tests passing
- ✅ **SSR Utilities**: All 12 SSR tests passing
- ✅ **Core Translation**: All 12 core tests passing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## 📦 Bundle Analysis

### Entry Points

- **Main**: `dist/index.js` - Full library with all adapters
- **React Native**: `dist/react-native.js` - React Native specific exports
- **SSR**: `dist/ssr.js` - Server-side rendering utilities
- **Adapters**: `dist/adapters/*.js` - Individual adapter exports

### Tree Shaking

The library is fully tree-shakable. Import only what you need:

```tsx
// Only import what you use
import { useTranslation } from '@logistically/i18n-react-core';

// Or import specific adapters
import { ReduxTranslationProvider } from '@logistically/i18n-react-core/adapters/redux';
```

## 🔧 Configuration

### Required Configuration

```typescript
interface ReactTranslationConfig {
  serviceName: string;           // Required: Unique service identifier
  defaultLocale: string;         // Required: Default locale
  supportedLocales: string[];    // Required: Supported locales
  translationsPath: string;      // Required: Path to translation files
  
  // Optional configurations
  pluralization?: {
    enabled: boolean;
    formatNumbers: boolean;
    useDirectionalMarkers: boolean;
  };
  
  cache?: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  
  debug?: {
    enabled: boolean;
    logMissingKeys: boolean;
    logPerformance: boolean;
  } | boolean;
  
  ssr?: {
    enabled: boolean;
    preloadLocales?: string[];
  };
}
```

## 📚 Examples

### Example Directories

- `examples/redux-example.tsx` - Complete Redux integration example
- `examples/react-app.integration.spec.tsx` - React app integration tests
- `examples/nextjs.integration.spec.tsx` - Next.js SSR integration tests
- `examples/performance.integration.spec.tsx` - Performance testing examples

### Redux Example Features

The Redux example demonstrates:

- **Multi-language Support**: English, Spanish, French, Arabic
- **Performance Monitoring**: Translation timing, cache metrics
- **Async Actions**: Loading and reloading translations
- **State Management**: Redux store integration
- **Error Handling**: Graceful error states
- **RTL Support**: Arabic language with RTL layout
- **Pluralization**: CLDR-compliant plural rules

## 🌐 Internationalization Features

### Supported Locales

- **LTR Languages**: English, Spanish, French, German, etc.
- **RTL Languages**: Arabic, Hebrew, Persian, Urdu
- **Complex Plural Rules**: Arabic (6 categories), Hebrew (4 categories)

### Pluralization Examples

```typescript
// English (simple)
"FILES_COUNT": {
  "one": "1 file",
  "other": "{count} files"
}

// Arabic (complex)
"FILES_COUNT": {
  "0": "لا توجد ملفات",
  "1": "ملف واحد",
  "2": "ملفان",
  "few": "{count} ملفات",
  "many": "{count} ملف",
  "other": "{count} ملف"
}
```

## 🚀 Performance Features

### Caching Strategy

- **In-Memory Cache**: Configurable size and TTL
- **Cache Invalidation**: Automatic cleanup and reload
- **Performance Metrics**: Cache hit rates and timing

### Optimization Features

- **Lazy Loading**: Load translations on demand
- **Bundle Splitting**: Separate bundles for different use cases
- **Tree Shaking**: Remove unused code in production

## 🔍 Debugging

### Debug Mode

```typescript
const config = {
  // ... other config
  debug: {
    enabled: true,
    logMissingKeys: true,
    logPerformance: true
  }
};
```

### Redux DevTools

- **Action Logging**: Track all translation actions
- **State Inspection**: View translation state changes
- **Performance Monitoring**: Monitor translation timing

## 🤝 Contributing

### Development Setup

```bash
# Clone the repository
git clone https://github.com/onwello/i18n-react-core.git

# Install dependencies
npm install

# Run tests
npm test

# Build the library
npm run build
```

### Testing Strategy

- **Unit Tests**: Individual component and utility testing
- **Integration Tests**: End-to-end functionality testing
- **Performance Tests**: Memory usage and rendering performance
- **Bundle Tests**: Bundle size and tree shaking validation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Repository](https://github.com/onwello/i18n-react-core)
- **Issues**: [GitHub Issues](https://github.com/onwello/i18n-react-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/onwello/i18n-react-core/discussions)

## 🔗 Related Packages

- **Core Library**: [@logistically/i18n](https://www.npmjs.com/package/@logistically/i18n)
- **React Integration**: [@logistically/i18n-react-core](https://www.npmjs.com/package/@logistically/i18n-react-core)
