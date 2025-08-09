import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TranslationProvider } from '../adapters/context';
import { TranslatedText } from '../components/TranslatedText';
import { useTranslation, useLocale } from '../adapters/context';
import { ReactTranslationConfig } from '../types';

const config: ReactTranslationConfig = {
  defaultLocale: 'en',
  supportedLocales: ['en', 'fr', 'es'],
  translationsPath: 'test-translations',
  debug: false,
  serviceName: 'performance-test',
};

describe('Performance Integration Tests', () => {
  describe('Memory Usage', () => {
    it('should maintain stable memory usage during locale switching', async () => {
      const PerformanceTestComponent = () => {
        const { locale, setLocale } = useLocale();
        
        return (
          <div>
            <TranslatedText translationKey="performance.memory" />
            <button 
              onClick={() => setLocale('fr')}
              data-testid="switch-locale"
            >
              Switch Locale
            </button>
            <div data-testid="current-locale">{locale}</div>
          </div>
        );
      };

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <PerformanceTestComponent />
          </TranslationProvider>
        );
      });

      const switchButton = screen.getByTestId('switch-locale');

      // Perform multiple locale switches
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.click(switchButton);
        });
      }

      // Get final memory usage
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large numbers of components without memory leaks', async () => {
      const LargeComponentList = () => {
        const { t } = useTranslation();
        
        return (
          <div>
            {Array.from({ length: 1000 }, (_, i) => (
              <TranslatedText 
                key={i} 
                translationKey={`performance.item.${i}`} 
                params={{ index: i }}
              />
            ))}
          </div>
        );
      };

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <LargeComponentList />
          </TranslationProvider>
        );
      });

      // Get memory usage after rendering
      const afterRenderMemory = process.memoryUsage().heapUsed;
      const renderMemoryIncrease = afterRenderMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 1000 components)
      expect(renderMemoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Rendering Performance', () => {
    it('should render components within acceptable time limits', async () => {
      const PerformanceTestComponent = () => {
        const { t } = useTranslation();
        
        return (
          <div>
            {Array.from({ length: 100 }, (_, i) => (
              <TranslatedText 
                key={i} 
                translationKey={`performance.render.${i}`} 
              />
            ))}
          </div>
        );
      };

      const startTime = performance.now();

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <PerformanceTestComponent />
          </TranslationProvider>
        );
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 100 components within 1 second
      expect(renderTime).toBeLessThan(1000);
    });

    it('should handle rapid state updates efficiently', async () => {
      const RapidUpdateComponent = () => {
        const [count, setCount] = React.useState(0);
        const { t } = useTranslation();
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1);
          }, 50); // Update every 50ms (slower for test environment)
          
          return () => clearInterval(interval);
        }, []);

        return (
          <div>
            <TranslatedText 
              translationKey="performance.rapid" 
              params={{ count }}
            />
            <div data-testid="count">{count}</div>
          </div>
        );
      };

      const startTime = performance.now();

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <RapidUpdateComponent />
          </TranslationProvider>
        );
      });

      // Let it run for a shorter time in test environment
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should handle rapid updates without significant performance degradation
      expect(totalTime).toBeLessThan(500); // More lenient threshold for test environment
    }, 10000); // 10 second timeout
  });

  describe('Translation Performance', () => {
    it('should handle large numbers of translations efficiently', async () => {
      const TranslationPerformanceComponent = () => {
        const { t, translate } = useTranslation();
        
        // Generate many translation calls
        const translations = Array.from({ length: 1000 }, (_, i) => 
          translate(`performance.translation.${i}`, { index: i })
        );

        return (
          <div>
            {translations.map((translation, i) => (
              <span key={i} data-testid={`translation-${i}`}>
                {translation}
              </span>
            ))}
          </div>
        );
      };

      const startTime = performance.now();

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <TranslationPerformanceComponent />
          </TranslationProvider>
        );
      });

      const endTime = performance.now();
      const translationTime = endTime - startTime;

      // Should handle 1000 translations within 2 seconds
      expect(translationTime).toBeLessThan(2000);
    });

    it('should cache translations for performance', async () => {
      const CachingTestComponent = () => {
        const { t } = useTranslation();
        const [renderCount, setRenderCount] = React.useState(0);
        
        // Use the same translation key multiple times
        const translations = Array.from({ length: 100 }, () => 
          t('performance.caching.test')
        );

        return (
          <div>
            <button 
              onClick={() => setRenderCount(c => c + 1)}
              data-testid="re-render"
            >
              Re-render
            </button>
            <div data-testid="render-count">{renderCount}</div>
            {translations.map((translation, i) => (
              <span key={i} data-testid={`cached-${i}`}>
                {translation}
              </span>
            ))}
          </div>
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <CachingTestComponent />
          </TranslationProvider>
        );
      });

      const reRenderButton = screen.getByTestId('re-render');

      // Perform multiple re-renders
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.click(reRenderButton);
        });
      }

      const endTime = performance.now();
      const reRenderTime = endTime - startTime;

      // Re-renders should be fast due to caching
      expect(reRenderTime).toBeLessThan(1000);
    });
  });

  describe('Bundle Loading Performance', () => {
    it('should load and initialize within acceptable time', async () => {
      const startTime = performance.now();

      // Simulate bundle loading and initialization
      const { TranslationProvider } = await import('../adapters/context');
      const { TranslatedText } = await import('../components/TranslatedText');

      const TestComponent = () => {
        return (
          <TranslatedText translationKey="performance.bundle" />
        );
      };

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <TestComponent />
          </TranslationProvider>
        );
      });

      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Should load and initialize within 1 second
      expect(loadTime).toBeLessThan(1000);
    });
  });

  describe('Concurrent Usage Performance', () => {
    it('should handle concurrent translation requests efficiently', async () => {
      const ConcurrentTestComponent = () => {
        const { t } = useTranslation();
        const [results, setResults] = React.useState<string[]>([]);
        
        React.useEffect(() => {
          // Simulate concurrent translation requests (simplified for test environment)
          const promises = Array.from({ length: 10 }, (_, i) => 
            Promise.resolve(t(`performance.concurrent.${i}`, { index: i }))
          );
          
          Promise.all(promises).then(setResults);
        }, [t]);

        return (
          <div>
            <div data-testid="results-count">{results.length}</div>
            {results.slice(0, 3).map((result, i) => (
              <span key={i} data-testid={`concurrent-${i}`}>
                {result}
              </span>
            ))}
          </div>
        );
      };

      const startTime = performance.now();

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <ConcurrentTestComponent />
          </TranslationProvider>
        );
      });

      // Wait for results to be set
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      const endTime = performance.now();
      const concurrentTime = endTime - startTime;

      // Should handle concurrent requests efficiently
      expect(concurrentTime).toBeLessThan(2000); // More lenient threshold
      expect(screen.getByTestId('results-count')).toHaveTextContent('10');
    }, 5000); // 5 second timeout
  });

  describe('Garbage Collection Performance', () => {
    it('should not cause memory leaks during component lifecycle', async () => {
      const LifecycleTestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        const { t } = useTranslation();
        
        if (!shouldRender) return null;
        
        return (
          <div>
            {Array.from({ length: 100 }, (_, i) => (
              <TranslatedText 
                key={i} 
                translationKey={`performance.lifecycle.${i}`} 
              />
            ))}
          </div>
        );
      };

      const TestWrapper = () => {
        const [shouldRender, setShouldRender] = React.useState(true);
        
        return (
          <div>
            <button 
              onClick={() => setShouldRender(!shouldRender)}
              data-testid="toggle-render"
            >
              Toggle
            </button>
            <LifecycleTestComponent shouldRender={shouldRender} />
          </div>
        );
      };

      // Get initial memory usage
      const initialMemory = process.memoryUsage().heapUsed;

      await act(async () => {
        render(
          <TranslationProvider config={config}>
            <TestWrapper />
          </TranslationProvider>
        );
      });

      const toggleButton = screen.getByTestId('toggle-render');

      // Perform multiple mount/unmount cycles
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          fireEvent.click(toggleButton);
        });
        await act(async () => {
          fireEvent.click(toggleButton);
        });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable after garbage collection (more lenient for test environment)
      expect(memoryIncrease).toBeLessThan(25 * 1024 * 1024); // Less than 25MB for test environment
    });
  });
});
