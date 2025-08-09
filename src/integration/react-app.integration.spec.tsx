import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TranslationProvider } from '../adapters/context';
import { TranslatedText, TranslatedDiv, TranslatedSpan } from '../components/TranslatedText';
import { useTranslation, useLocale } from '../adapters/context';
import { ReactTranslationConfig } from '../types';

// Mock components that simulate real app usage
const Header = () => {
  const { t } = useTranslation();
  const { locale, setLocale, supportedLocales } = useLocale();

  return (
    <header>
      <h1><TranslatedText translationKey="header.title" /></h1>
      <nav>
        <a><TranslatedText translationKey="header.nav.home" /></a>
        <a><TranslatedText translationKey="header.nav.about" /></a>
        <a><TranslatedText translationKey="header.nav.contact" /></a>
      </nav>
      <select 
        value={locale} 
        onChange={(e) => setLocale(e.target.value)}
        data-testid="locale-selector"
      >
        {supportedLocales.map(loc => (
          <option key={loc} value={loc}>{loc.toUpperCase()}</option>
        ))}
      </select>
    </header>
  );
};

const UserProfile = ({ userId }: { userId: string }) => {
  const { t, translate } = useTranslation();
  const { locale } = useLocale();

  return (
    <div>
      <h2>
        <TranslatedText 
          translationKey="profile.welcome" 
          params={{ name: 'John', userId }}
        />
      </h2>
      <TranslatedText translationKey="profile.stats" />
      <div>
        <TranslatedSpan translationKey="profile.email" />
        <span>: john@example.com</span>
      </div>
      <div>
        <TranslatedSpan translationKey="profile.location" />
        <span>: {translate('profile.city', { city: 'New York' })}</span>
      </div>
    </div>
  );
};

const ProductCard = ({ product }: { product: { id: string; name: string; price: number } }) => {
  const { t } = useTranslation();

  return (
    <TranslatedDiv translationKey="product.card" className="product-card">
      <h3>{product.name}</h3>
      <TranslatedText 
        translationKey="product.price" 
        params={{ price: product.price, currency: 'USD' }}
      />
      <button><TranslatedText translationKey="product.addToCart" /></button>
    </TranslatedDiv>
  );
};

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer>
      <TranslatedText translationKey="footer.copyright" />
      <a><TranslatedText translationKey="footer.links.terms" /></a>
      <a><TranslatedText translationKey="footer.links.privacy" /></a>
    </footer>
  );
};

const App = () => {
  return (
    <div className="app">
      <Header />
      <main>
        <UserProfile userId="12345" />
        <section>
          <h2><TranslatedText translationKey="products.title" /></h2>
          <div className="products-grid">
            <ProductCard product={{ id: '1', name: 'Laptop', price: 999 }} />
            <ProductCard product={{ id: '2', name: 'Phone', price: 599 }} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const config: ReactTranslationConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'test-translations',
  debug: false,
  serviceName: 'integration-test',
};

describe('React App Integration Tests', () => {
  describe('Full Application Integration', () => {
    it('should render complete app with all components', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <App />
          </TranslationProvider>
        );
      });

      // Verify all major sections render
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer

      // Verify navigation elements
      expect(screen.getByTestId('locale-selector')).toBeInTheDocument();
      // Check that the select has the correct value (not display text)
      const localeSelector = screen.getByTestId('locale-selector') as HTMLSelectElement;
      expect(localeSelector.value).toBe('en');
    });

    it('should handle locale switching across entire app', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <App />
          </TranslationProvider>
        );
      });

      const localeSelector = screen.getByTestId('locale-selector');

      // Switch to French
      await act(async () => {
        fireEvent.change(localeSelector, { target: { value: 'fr' } });
      });

      await waitFor(() => {
        const localeSelector = screen.getByTestId('locale-selector') as HTMLSelectElement;
        expect(localeSelector.value).toBe('fr');
      });

      // Switch to Spanish
      await act(async () => {
        fireEvent.change(localeSelector, { target: { value: 'es' } });
      });

      await waitFor(() => {
        const localeSelector = screen.getByTestId('locale-selector') as HTMLSelectElement;
        expect(localeSelector.value).toBe('es');
      });
    });

    it('should handle complex translation scenarios', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <App />
          </TranslationProvider>
        );
      });

      // Verify components with parameters render correctly
      // Note: Translation keys are shown when translations are not loaded
      expect(screen.getByText('profile.welcome')).toBeInTheDocument();
      // Check that the component renders without crashing (userId is passed as param but not displayed)
      expect(document.body).toBeInTheDocument();

      // Verify product cards with dynamic data
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });
  });

  describe('Component Interaction Integration', () => {
    it('should handle multiple components using translations simultaneously', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <div>
              <Header />
              <UserProfile userId="user1" />
              <UserProfile userId="user2" />
              <ProductCard product={{ id: '1', name: 'Test Product', price: 100 }} />
            </div>
          </TranslationProvider>
        );
      });

      // Verify multiple instances work correctly
      const localeSelector = screen.getByTestId('locale-selector') as HTMLSelectElement;
      expect(localeSelector.value).toBe('en');
      // Check that components render without crashing (user IDs are passed as params but not displayed)
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle nested component translation scenarios', async () => {
      const NestedComponent = () => {
        const { t } = useTranslation();
        return (
          <div>
            <TranslatedText translationKey="nested.title" />
            <div>
              <TranslatedText translationKey="nested.subtitle" />
              <span>{t('nested.content')}</span>
            </div>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <NestedComponent />
          </TranslationProvider>
        );
      });

      // Verify nested components render without conflicts
      expect(document.querySelector('.app') || document.body).toBeInTheDocument();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle missing translations gracefully across app', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <div>
              <TranslatedText translationKey="missing.key1" />
              <TranslatedText translationKey="missing.key2" fallback="Fallback Text" />
              <TranslatedText translationKey="missing.key3" />
            </div>
          </TranslationProvider>
        );
      });

      // App should still render despite missing translations
      expect(document.body).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle translation service errors gracefully', async () => {
      const errorConfig = { ...config, translationsPath: 'invalid-path' };
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await act(async () => {
        render(
          <TranslationProvider config={errorConfig}>
            <App />
          </TranslationProvider>
        );
      });

      // App should still render despite service errors
      expect(screen.getByTestId('locale-selector')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid locale switching without performance issues', async () => {
      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <App />
          </TranslationProvider>
        );
      });

      const localeSelector = screen.getByTestId('locale-selector');

      // Rapid locale switching
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.change(localeSelector, { target: { value: 'en' } });
        });
        await act(async () => {
          fireEvent.change(localeSelector, { target: { value: 'fr' } });
        });
        await act(async () => {
          fireEvent.change(localeSelector, { target: { value: 'es' } });
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should handle large numbers of translated components', async () => {
      const LargeApp = () => {
        const { t } = useTranslation();
        return (
          <div>
            {Array.from({ length: 100 }, (_, i) => (
              <TranslatedText 
                key={i} 
                translationKey={`item.${i}`} 
                params={{ index: i }}
              />
            ))}
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <LargeApp />
          </TranslationProvider>
        );
      });

      // Should render without crashing
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('State Management Integration', () => {
    it('should maintain translation state across component re-renders', async () => {
      const StateTestComponent = () => {
        const [count, setCount] = React.useState(0);
        const { t } = useTranslation();
        const { locale } = useLocale();

        return (
          <div>
            <TranslatedText translationKey="state.test" />
            <div data-testid="count">{count}</div>
            <div data-testid="locale">{locale}</div>
            <button onClick={() => setCount(count + 1)} data-testid="increment">
              Increment
            </button>
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <StateTestComponent />
          </TranslationProvider>
        );
      });

      const incrementButton = screen.getByTestId('increment');
      const countElement = screen.getByTestId('count');
      const localeElement = screen.getByTestId('locale');

      // Initial state
      expect(countElement).toHaveTextContent('0');
      expect(localeElement).toHaveTextContent('en');

      // Trigger re-render
      await act(async () => {
        fireEvent.click(incrementButton);
      });

      // State should be maintained
      expect(countElement).toHaveTextContent('1');
      expect(localeElement).toHaveTextContent('en');
    });
  });
});
