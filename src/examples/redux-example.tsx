import React, { useState, useEffect } from 'react';
import { ReduxTranslationProvider, useReduxTranslation, useReduxTranslationWithMetrics } from '../adapters/redux-provider';
import { ReactTranslationConfig } from '../types';

// Example configuration
const exampleConfig: ReactTranslationConfig = {
  serviceName: 'redux-example',
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
  },
  debug: {
    enabled: true,
    logMissingKeys: true
  }
};

// Example translations (in a real app, these would be loaded from files)
const exampleTranslations = {
  en: {
    'welcome.title': 'Welcome to Redux i18n Example',
    'welcome.subtitle': 'This demonstrates Redux integration',
    'counter.label': 'Counter',
    'counter.value': 'Value: {count}',
    'counter.plural': {
      '0': 'No items',
      '1': '1 item',
      'other': '{count} items'
    },
    'locale.selector': 'Select Language',
    'performance.metrics': 'Performance Metrics',
    'actions.pending': 'Pending Actions: {count}',
    'cache.status': 'Cache Status',
    'error.message': 'Error occurred: {message}'
  },
  es: {
    'welcome.title': 'Bienvenido al Ejemplo de Redux i18n',
    'welcome.subtitle': 'Esto demuestra la integración con Redux',
    'counter.label': 'Contador',
    'counter.value': 'Valor: {count}',
    'counter.plural': {
      '0': 'Sin elementos',
      '1': '1 elemento',
      'other': '{count} elementos'
    },
    'locale.selector': 'Seleccionar Idioma',
    'performance.metrics': 'Métricas de Rendimiento',
    'actions.pending': 'Acciones Pendientes: {count}',
    'cache.status': 'Estado de Caché',
    'error.message': 'Error ocurrido: {message}'
  },
  fr: {
    'welcome.title': 'Bienvenue dans l\'Exemple Redux i18n',
    'welcome.subtitle': 'Ceci démontre l\'intégration Redux',
    'counter.label': 'Compteur',
    'counter.value': 'Valeur: {count}',
    'counter.plural': {
      '0': 'Aucun élément',
      '1': '1 élément',
      'other': '{count} éléments'
    },
    'locale.selector': 'Sélectionner la Langue',
    'performance.metrics': 'Métriques de Performance',
    'actions.pending': 'Actions en Attente: {count}',
    'cache.status': 'État du Cache',
    'error.message': 'Erreur survenue: {message}'
  },
  ar: {
    'welcome.title': 'مرحباً بك في مثال Redux i18n',
    'welcome.subtitle': 'هذا يوضح التكامل مع Redux',
    'counter.label': 'عداد',
    'counter.value': 'القيمة: {count}',
    'counter.plural': {
      '0': 'لا توجد عناصر',
      '1': 'عنصر واحد',
      '2': 'عنصران',
      'few': '{count} عناصر',
      'many': '{count} عنصر',
      'other': '{count} عنصر'
    },
    'locale.selector': 'اختر اللغة',
    'performance.metrics': 'مقاييس الأداء',
    'actions.pending': 'الإجراءات المعلقة: {count}',
    'cache.status': 'حالة التخزين المؤقت',
    'error.message': 'حدث خطأ: {message}'
  }
};

// Mock translation service for the example
class MockTranslationService {
  private translations = exampleTranslations;
  
  async loadTranslations(locale: string) {
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 100));
    return this.translations[locale as keyof typeof this.translations] || {};
  }
  
  translate(key: string, params?: Record<string, any>) {
    const locale = 'en'; // Default for mock
    const translation = this.translations[locale as keyof typeof this.translations]?.[key];
    if (!translation) return key;
    
    if (typeof translation === 'string') {
      return this.interpolateParams(translation, params);
    }
    
    return key;
  }
  
  translatePlural(key: string, count: number, params?: Record<string, any>) {
    const locale = 'en'; // Default for mock
    const translation = this.translations[locale as keyof typeof this.translations]?.[key];
    if (!translation || typeof translation !== 'object') return `${key} (${count})`;
    
    // Simple plural logic for demo
    if (count === 0 && translation['0']) return this.interpolateParams(translation['0'], { count, ...params });
    if (count === 1 && translation['1']) return this.interpolateParams(translation['1'], { count, ...params });
    if (translation.other) return this.interpolateParams(translation.other, { count, ...params });
    
    return `${key} (${count})`;
  }
  
  private interpolateParams(text: string, params?: Record<string, any>) {
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (_, key) => params[key]?.toString() || `{${key}}`);
  }
}

// Counter component using Redux translation
const CounterWithRedux: React.FC = () => {
  const { t, locale, setLocale, isLoading, error, performanceMetrics, pendingActions } = useReduxTranslationWithMetrics();
  const [count, setCount] = useState(0);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCount(prev => Math.max(0, prev - 1));
  };

  const handleLocaleChange = (newLocale: string) => {
    setLocale(newLocale);
  };

  if (isLoading) {
    return <div>Loading translations...</div>;
  }

  if (error) {
    return <div>{t('error.message', { message: error.message })}</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{t('welcome.title')}</h1>
      <p>{t('welcome.subtitle')}</p>
      
      {/* Locale Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label>{t('locale.selector')}: </label>
        <select value={locale} onChange={(e) => handleLocaleChange(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
        </select>
      </div>

      {/* Counter */}
      <div style={{ marginBottom: '20px' }}>
        <h2>{t('counter.label')}</h2>
        <p>{t('counter.value', { count })}</p>
        <p>{t('counter.plural', { count })}</p>
        <button onClick={handleIncrement}>+</button>
        <button onClick={handleDecrement}>-</button>
      </div>

      {/* Performance Metrics */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('performance.metrics')}</h3>
        <p>Translation Time: {performanceMetrics.translationTime.toFixed(2)}ms</p>
        <p>Cache Hit Rate: {performanceMetrics.cacheHitRate.toFixed(2)}%</p>
        <p>Last Cache Cleanup: {new Date(performanceMetrics.lastCacheCleanup).toLocaleTimeString()}</p>
      </div>

      {/* Pending Actions */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('actions.pending')}</h3>
        <p>{t('actions.pending', { count: pendingActions.length })}</p>
        {pendingActions.length > 0 && (
          <ul>
            {pendingActions.map((action, index) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Cache Status */}
      <div style={{ marginBottom: '20px' }}>
        <h3>{t('cache.status')}</h3>
        <p>Last Updated: {new Date(performanceMetrics.lastCacheCleanup).toLocaleTimeString()}</p>
      </div>
    </div>
  );
};

// Main example component
export const ReduxExample: React.FC = () => {
  return (
    <ReduxTranslationProvider config={exampleConfig}>
      <CounterWithRedux />
    </ReduxTranslationProvider>
  );
};

// Export for use in other components
export default ReduxExample;
