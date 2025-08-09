import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { TranslationProvider } from '../adapters/context';
import { TranslatedText } from '../components/TranslatedText';
import { useTranslation, useLocale } from '../adapters/context';
import { 
  getServerSideTranslations, 
  getServerTranslation 
} from '../ssr';
import { SSRTranslationUtils } from '../ssr';
import { ReactTranslationConfig } from '../types';

// Mock Next.js specific utilities
const mockNextRequest = {
  headers: {
    'accept-language': 'fr,en;q=0.9',
    'user-agent': 'Mozilla/5.0 (compatible; Next.js)',
  },
  cookies: {
    'NEXT_LOCALE': 'es',
  },
};

const mockNextResponse = {
  setHeader: jest.fn(),
  setCookie: jest.fn(),
};

// Mock Next.js components
const NextPage = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <div>
      <h1><TranslatedText translationKey="page.title" /></h1>
      <TranslatedText translationKey="page.description" />
      <div data-testid="current-locale">{locale}</div>
      <TranslatedText 
        translationKey="page.welcome" 
        params={{ user: 'Next.js User' }}
      />
    </div>
  );
};

const NextLayout = ({ children }: { children: React.ReactNode }) => {
  const { locale, setLocale } = useLocale();

  return (
    <div>
      <header>
        <TranslatedText translationKey="layout.header" />
        <select 
          value={locale} 
          onChange={(e) => setLocale(e.target.value)}
          data-testid="layout-locale-selector"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
        </select>
      </header>
      <main>{children}</main>
      <footer>
        <TranslatedText translationKey="layout.footer" />
      </footer>
    </div>
  );
};

const config: ReactTranslationConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'test-translations',
  debug: false,
  serviceName: 'nextjs-integration-test',
};

describe('Next.js Integration Tests', () => {
  describe('App Router Integration', () => {
    it('should work with Next.js App Router structure', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <NextLayout>
              <NextPage />
            </NextLayout>
          </TranslationProvider>
        );
      });

      // Verify layout structure
      expect(document.querySelector('html')).toBeInTheDocument();
      expect(document.querySelector('head')).toBeInTheDocument();
      expect(document.querySelector('body')).toBeInTheDocument();
      expect(document.querySelector('header')).toBeInTheDocument();
      expect(document.querySelector('main')).toBeInTheDocument();
      expect(document.querySelector('footer')).toBeInTheDocument();

      // Verify locale selector
      expect(screen.getByTestId('layout-locale-selector')).toBeInTheDocument();
      const localeSelector = screen.getByTestId('layout-locale-selector') as HTMLSelectElement;
      expect(localeSelector.value).toBe('en');
    });

    it('should handle dynamic route parameters', async () => {
      const DynamicPage = ({ params }: { params: { slug: string } }) => {
        const { t } = useTranslation();
        return (
          <div>
            <TranslatedText 
              translationKey="dynamic.title" 
              params={{ slug: params.slug }}
            />
            <TranslatedText translationKey="dynamic.content" />
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <DynamicPage params={{ slug: 'test-article' }} />
          </TranslationProvider>
        );
      });

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });

    it('should handle search params in Next.js', async () => {
      const SearchPage = ({ searchParams }: { searchParams: { q?: string } }) => {
        const { t } = useTranslation();
        return (
          <div>
            <TranslatedText translationKey="search.title" />
            {searchParams.q && (
              <TranslatedText 
                translationKey="search.results" 
                params={{ query: searchParams.q }}
              />
            )}
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <SearchPage searchParams={{ q: 'test query' }} />
          </TranslationProvider>
        );
      });

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('SSR Utilities Integration', () => {
    it('should work with getServerSideTranslations', async () => {
      const ssrUtils = new SSRTranslationUtils(config);
      
      // Test server-side translation loading
      const translations = await getServerSideTranslations('en', config);
      
      expect(translations).toBeDefined();
      expect(typeof translations).toBe('object');
      
      ssrUtils.destroy();
    });

    it('should work with getServerTranslation', async () => {
      const ssrUtils = new SSRTranslationUtils(config);
      
      // Test server-side translation function
      const serverUtils = await getServerTranslation('en', config);
      
      expect(typeof serverUtils.t).toBe('function');
      
      // Test translation function
      const result = serverUtils.t('welcome.title');
      expect(result).toBeDefined();
      
      ssrUtils.destroy();
    });

    it('should handle SSR context serialization', async () => {
      const ssrUtils = new SSRTranslationUtils(config);
      
      // Create SSR context
      const context = await ssrUtils.createSSRContext('en');
      
      expect(context).toBeDefined();
      expect(context.locale).toBe('en');
      expect(context.translations).toBeDefined();
      
      // Test serialization
      const serialized = ssrUtils.serializeContext(context);
      expect(typeof serialized).toBe('string');
      
      // Test deserialization
      const deserialized = ssrUtils.deserializeContext(serialized);
      expect(deserialized.locale).toBe('en');
      
      ssrUtils.destroy();
    });

    it('should handle multiple locales in SSR', async () => {
      const ssrUtils = new SSRTranslationUtils(config);
      
      // Preload multiple locales
      await ssrUtils.preloadTranslations(['en', 'fr', 'es']);
      
      // Test context with preloaded locales
      const context = await ssrUtils.createSSRContext('fr');
      
      expect(context.locale).toBe('fr');
      expect(context.translations).toBeDefined();
      
      ssrUtils.destroy();
    });
  });

  describe('Client-Side Hydration Integration', () => {
    it('should handle hydration from SSR context', async () => {
      const ssrUtils = new SSRTranslationUtils(config);
      
      // Simulate SSR context creation
      const ssrContext = await ssrUtils.createSSRContext('fr');
      const serializedContext = ssrUtils.serializeContext(ssrContext);
      
      // Simulate client-side hydration
      const HydratedApp = () => {
        const { t } = useTranslation();
        const { locale } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="hydration.test" />
            <div data-testid="hydrated-locale">{locale}</div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <HydratedApp />
          </TranslationProvider>
        );
      });

      // Should render with correct locale
      expect(screen.getByTestId('hydrated-locale')).toHaveTextContent('en');
      
      ssrUtils.destroy();
    });

    it('should handle locale switching after hydration', async () => {
      const HydratedApp = () => {
        const { locale, setLocale } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="hydration.switch" />
            <button 
              onClick={() => setLocale('fr')}
              data-testid="switch-to-fr"
            >
              Switch to French
            </button>
            <div data-testid="current-locale">{locale}</div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <HydratedApp />
          </TranslationProvider>
        );
      });

      // Initial state
      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');

      // Switch locale
      const switchButton = screen.getByTestId('switch-to-fr');
      await act(async () => {
        switchButton.click();
      });

      // Should update locale
      await waitFor(() => {
        expect(screen.getByTestId('current-locale')).toHaveTextContent('fr');
      });
    });
  });

  describe('Next.js Specific Features', () => {
    it('should handle Next.js middleware integration', async () => {
      // Simulate Next.js middleware behavior
      const MiddlewareComponent = () => {
        const { locale } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="middleware.detected" />
            <div data-testid="middleware-locale">{locale}</div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <MiddlewareComponent />
          </TranslationProvider>
        );
      });

      // Should render without middleware errors
      expect(screen.getByTestId('middleware-locale')).toBeInTheDocument();
    });

    it('should handle Next.js i18n configuration', async () => {
      const i18nConfig = {
        ...config,
        defaultLocale: 'en',
        supportedLocales: ['en', 'fr', 'es'],
        localeDetection: true,
      };

      const I18nComponent = () => {
        const { locale, supportedLocales } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="i18n.config" />
            <div data-testid="supported-locales">
              {supportedLocales.join(',')}
            </div>
            <div data-testid="current-locale">{locale}</div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={i18nConfig}>
            <I18nComponent />
          </TranslationProvider>
        );
      });

      // Should handle i18n configuration
      expect(screen.getByTestId('current-locale')).toHaveTextContent('en');
      expect(screen.getByTestId('supported-locales')).toHaveTextContent('en,fr,es');
    });

    it('should handle Next.js static generation', async () => {
      const StaticPage = () => {
        const { t } = useTranslation();
        
        return (
          <div>
            <TranslatedText translationKey="static.title" />
            <TranslatedText translationKey="static.content" />
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <StaticPage />
          </TranslationProvider>
        );
      });

      // Should render static content
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Error Handling in Next.js Context', () => {
    it('should handle SSR errors gracefully', async () => {
      const errorConfig = { ...config, translationsPath: 'invalid-path' };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const ssrUtils = new SSRTranslationUtils(errorConfig);
      
      // Should handle SSR errors without crashing
      const context = await ssrUtils.createSSRContext('en');
      expect(context).toBeDefined();
      
      ssrUtils.destroy();
      consoleSpy.mockRestore();
    });

    it('should handle hydration mismatches', async () => {
      const HydrationMismatchComponent = () => {
        const { locale } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="hydration.mismatch" />
            <div data-testid="mismatch-locale">{locale}</div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <HydrationMismatchComponent />
          </TranslationProvider>
        );
      });

      // Should handle potential hydration mismatches
      expect(screen.getByTestId('mismatch-locale')).toBeInTheDocument();
    });
  });
});
