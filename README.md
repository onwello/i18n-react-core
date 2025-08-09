# @logistically/i18n-react-core

React integration for `@logistically/i18n` with state management agnostic design, supporting both React Web and React Native.

## 🚀 **Features**

### **Core Features:**
- ✅ **State Management Agnostic** - Use with Context API, Zustand, Redux, or custom solutions
- ✅ **React 18+ Support** - Full compatibility with modern React
- ✅ **TypeScript First** - Complete type safety
- ✅ **Tree Shaking** - Optimized bundle sizes
- ✅ **SSR Support** - Server-side rendering utilities
- ✅ **React Native Support** - Cross-platform compatibility

### **Translation Features:**
- ✅ **Multi-locale Support** - Easy locale switching
- ✅ **Parameter Interpolation** - Dynamic content support
- ✅ **Pluralization** - Complex plural rules
- ✅ **RTL Support** - Right-to-left language support
- ✅ **Date/Number Formatting** - Locale-aware formatting
- ✅ **Error Handling** - Graceful fallbacks

## 📦 **Installation**

```bash
npm install @logistically/i18n-react-core
```

## 🎯 **Quick Start**

### **Basic Usage (Web):**

```tsx
import React from 'react';
import { 
  TranslationProvider, 
  TranslatedText, 
  useTranslation 
} from '@logistically/i18n-react-core';

const config = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'src/translations',
  serviceName: 'my-app'
};

const App = () => (
  <TranslationProvider config={config}>
    <MyComponent />
  </TranslationProvider>
);

const MyComponent = () => {
  const { t, setLocale } = useTranslation();
  
  return (
    <div>
      <h1><TranslatedText translationKey="welcome.title" /></h1>
      <TranslatedText translationKey="welcome.message" params={{ name: 'John' }} />
      <button onClick={() => setLocale('fr')}>Switch to French</button>
    </div>
  );
};
```

### **React Native Usage:**

```tsx
import React from 'react';
import { View } from 'react-native';
import { 
  TranslationProvider, 
  TranslatedTextRN, 
  useTranslation 
} from '@logistically/i18n-react-core/react-native';

const config = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'src/translations',
  serviceName: 'my-app'
};

const App = () => (
  <TranslationProvider config={config}>
    <MyComponent />
  </TranslationProvider>
);

const MyComponent = () => {
  const { t, setLocale } = useTranslation();
  
  return (
    <View>
      <TranslatedTextRN translationKey="welcome.title" />
      <TranslatedTextRN translationKey="welcome.message" params={{ name: 'John' }} />
    </View>
  );
};
```

## 🔧 **API Reference**

### **Hooks:**

#### `useTranslation()`
```tsx
const { 
  t,                    // Translation function
  translate,            // Direct translation
  translatePlural,      // Plural translation
  formatDate,          // Date formatting
  formatNumber,        // Number formatting
  getTextDirection,    // Text direction
  isLoading,           // Loading state
  error,               // Error state
  locale,              // Current locale
  setLocale,           // Change locale
  isRTLLocale,         // RTL detection
  reloadTranslations,  // Reload translations
  clearCache           // Clear cache
} = useTranslation();
```

#### `useLocale()`
```tsx
const { 
  locale,              // Current locale
  setLocale,           // Change locale
  supportedLocales,    // Available locales
  isRTL,               // Current RTL state
  direction,           // Text direction
  isRTLLocale          // RTL detection function
} = useLocale();
```

### **Components:**

#### `TranslatedText`
```tsx
<TranslatedText 
  translationKey="translation.key"
  params={{ name: 'John', count: 5 }}
  locale="fr"
  fallback="Fallback text"
  className="my-class"
  style={{ color: 'red' }}
  debug={true}
/>
```

#### **Convenience Components (Web):**
- `TranslatedSpan`, `TranslatedDiv`, `TranslatedP`
- `TranslatedH1`, `TranslatedH2`, `TranslatedH3`
- `TranslatedLabel`, `TranslatedButton`

#### **Convenience Components (React Native):**
- `TranslatedTextRN`, `TranslatedView`
- `TranslatedHeading`, `TranslatedSubheading`
- `TranslatedBody`, `TranslatedCaption`

### **SSR Utilities:**

```tsx
import { SSRTranslationUtils } from '@logistically/i18n-react-core/ssr';

const utils = new SSRTranslationUtils(config);

// Get translations for server-side rendering
const translations = await utils.getTranslation('en');

// Create SSR context
const context = await utils.createSSRContext('en');

// Serialize/deserialize context
const serialized = utils.serializeContext(context);
const deserialized = utils.deserializeContext(serialized);

// Next.js utilities
const serverTranslations = await utils.getServerSideTranslations('en');
const serverUtils = await utils.getServerTranslation('en');
const { t } = serverUtils; // Use the t function from serverUtils
```

## 🏗️ **Architecture**

### **Package Structure:**
```
@logistically/i18n-react-core/
├── dist/
│   ├── index.js              # Main bundle (Web)
│   ├── react-native.js       # React Native bundle
│   ├── ssr.js               # SSR utilities
│   └── adapters/            # State management adapters
├── src/
│   ├── core/                # Core translation logic
│   ├── adapters/            # State management adapters
│   ├── components/          # React components
│   ├── ssr/                 # SSR utilities
│   ├── types/               # TypeScript definitions
│   └── react-native/        # React Native specific
```

### **Bundle Sizes:**
- **Main Bundle (Web)**: ~20KB (gzipped: ~6-8KB)
- **React Native Bundle**: ~19KB (gzipped: ~6-7KB)
- **SSR Utilities**: ~1.5KB (gzipped: ~0.5KB)
- **Total**: ~40KB (gzipped: ~12-15KB)

## 🧪 **Testing**

### **Test Coverage:**
- ✅ **Core Functionality**: Translation logic, state management (92.53%)
- ✅ **React Integration**: Hooks, components, context (76.74%)
- ✅ **SSR Support**: Server-side utilities (comprehensive coverage)
- ✅ **Error Handling**: Graceful fallbacks
- ✅ **Integration Tests**: React apps, Next.js, performance
- 🟡 **React Native**: Platform-specific testing (80% coverage)

### **Running Tests:**
```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm run test:watch         # Watch mode
```

## 🔄 **State Management**

### **Default: Context API**
The package uses React Context API by default, but supports multiple state management solutions:

### **Available Adapters:**
```tsx
// Context API (default) ✅
import { TranslationProvider } from '@logistically/i18n-react-core';

// Zustand (placeholder - coming soon)
import { createZustandAdapter } from '@logistically/i18n-react-core/adapters/zustand';

// Redux (placeholder - coming soon)
import { createReduxAdapter } from '@logistically/i18n-react-core/adapters/redux';

// Custom adapter
const customAdapter = (core) => ({
  getState: () => core.getState(),
  getActions: () => core.getActions(),
  subscribe: (listener) => core.subscribe(listener),
});
```

## 🌐 **Internationalization Features**

### **Supported Locales:**
- **Western Languages**: English, French, Spanish, German, etc.
- **RTL Languages**: Arabic, Hebrew, Persian, etc.
- **Asian Languages**: Chinese, Japanese, Korean, etc.

### **Pluralization:**
```tsx
// Simple plural
<TranslatedText translationKey="user.count" params={{ count: 5 }} />

// Complex plural rules
<TranslatedText translationKey="item.count" params={{ count: 21 }} />
```

### **RTL Support:**
```tsx
const { isRTL, direction } = useLocale();

// Automatic RTL detection
<div dir={direction}>
  <TranslatedText translationKey="welcome.message" />
</div>
```

## 🚀 **Performance**

### **Optimizations:**
- **Tree Shaking**: Only include what you use
- **Lazy Loading**: Load translations on demand
- **Caching**: Intelligent translation caching
- **Bundle Splitting**: Separate bundles for different use cases

### **Best Practices:**
```tsx
// ✅ Good: Use specific imports
import { TranslatedText } from '@logistically/i18n-react-core';

// ❌ Avoid: Import everything
import * as I18n from '@logistically/i18n-react-core';

// ✅ Good: Preload critical translations
await utils.preloadTranslations(['en', 'fr']);

// ✅ Good: Use fallbacks
<TranslatedText translationKey="missing.key" fallback="Default text" />
```

## 🔧 **Configuration**

### **TranslationConfig:**
```tsx
const config = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'src/translations',
  serviceName: 'my-app', // Required field
  debug: {
    enabled: true,
    logMissingKeys: true,
    logPerformance: true,
  },
  interpolation: {
    prefix: '${',
    suffix: '}',
  },
  fallbackStrategy: 'default',
  cache: {
    enabled: true,
    ttl: 3600,
  },
  rtl: {
    enabled: true,
    autoDetect: true,
  },
  pluralization: {
    enabled: true,
    formatNumbers: true,
  },
};
```

### **Migration from react-i18next:**
```tsx
// Before (react-i18next)
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
t('welcome.message', { name: 'John' });

// After (@logistically/i18n-react-core)
import { useTranslation } from '@logistically/i18n-react-core';
const { t } = useTranslation();
t('welcome.message', { params: { name: 'John' } });
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

## 🆘 **Support**

- **Documentation**: [Full documentation](https://github.com/onwello/i18n-react-core)
- **Issues**: [GitHub Issues](https://github.com/onwello/i18n-react-core/issues)
- **Discussions**: [GitHub Discussions](https://github.com/onwello/i18n-react-core/discussions)

---
